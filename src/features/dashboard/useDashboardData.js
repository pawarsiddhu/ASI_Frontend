import { useMemo } from 'react';
import { useListAntiquitiesQuery } from '@features/antiquities/antiquitiesApi';
import { useListBHSQuery } from '@features/bhs/bhsApi';
import { STATUS, STATUS_LABEL } from '@features/antiquities/schema';
import { getCircleLabel } from '@features/circles';
import { ROLES } from '@utils/constants';

/**
 * useDashboardData(role) — the single hook every role dashboard calls.
 *
 * Backend has no dedicated /dashboard or /reports endpoints in POC, so we
 * aggregate both records lists (antiquities + BHS) client-side. Since RTK
 * Query caches by tag, dashboards + list pages share the same fetches —
 * no duplicate network calls, and mutations to either type refresh the
 * dashboard automatically.
 *
 * Scope note: OPERATOR is scoped server-side to own records; everyone else
 * receives the full list. So Operator stats naturally reflect "my records"
 * without any client filter, and every other role sees the whole picture.
 *
 * Each record carries a `type` field ('ANTIQUITY' | 'BHS') so downstream
 * builders can slice by type where useful. All aggregations here treat the
 * combined list as one — "total records" means all types.
 *
 * @param {string} role — one of ROLES.* (OPERATOR / SUPERVISOR / ADMIN / SUPERADMIN / RD)
 * @returns {{ stats, activity, chart, isLoading, isFetching, isError, refetch }}
 */
export function useDashboardData(role) {
  const antiquities = useListAntiquitiesQuery({});
  const bhs = useListBHSQuery({});

  // Loading if EITHER is still loading; fetching if either is fetching.
  // Error only if BOTH failed — a single partial failure shouldn't blank
  // the whole dashboard. (Rare; both hit the same /records endpoint.)
  const isLoading = antiquities.isLoading || bhs.isLoading;
  const isFetching = antiquities.isFetching || bhs.isFetching;
  const isError = antiquities.isError && bhs.isError;

  const refetch = () => {
    antiquities.refetch();
    bhs.refetch();
  };

  const derived = useMemo(() => {
    const aList = Array.isArray(antiquities.data) ? antiquities.data : [];
    const bList = Array.isArray(bhs.data) ? bhs.data : [];
    // Ensure `type` is set on every row — the backend list endpoint returns
    // it, but defensive fallback keeps `buildActivity` accurate even if a
    // future response shape drops it.
    const merged = [
      ...aList.map((r) => ({ type: 'ANTIQUITY', ...r })),
      ...bList.map((r) => ({ type: 'BHS', ...r })),
    ];
    return {
      stats: buildStats(role, merged),
      activity: buildActivity(merged),
      chart: buildChart(role, merged),
    };
  }, [role, antiquities.data, bhs.data]);

  return { ...derived, isLoading, isFetching, isError, refetch };
}

// ---------------------------------------------------------------------------
// Stat builders — one per role. Each returns exactly 4 stat cards.
// ---------------------------------------------------------------------------

function buildStats(role, records) {
  const count = (predicate) => records.filter(predicate).length;

  switch (role) {
    case ROLES.OPERATOR:
      return [
        {
          key: 'drafts',
          label: 'My Drafts',
          value: count((r) => r.status === STATUS.DRAFT),
          helperText: 'Not yet submitted',
        },
        {
          key: 'pending',
          label: 'In Review',
          value: count(
            (r) =>
              r.status === STATUS.SUPERVISOR_REVIEW ||
              r.status === STATUS.ADMIN_REVIEW ||
              r.status === STATUS.PUBLISH_QUEUE
          ),
          helperText: 'Awaiting review upstream',
        },
        {
          key: 'returned',
          label: 'Returned',
          value: count((r) => r.status === STATUS.RETURNED),
          helperText: 'Needs your correction',
        },
        {
          key: 'published',
          label: 'Published',
          value: count((r) => r.status === STATUS.PUBLISHED),
          helperText: 'Anchored on ledger',
        },
      ];

    case ROLES.SUPERVISOR:
      return [
        {
          key: 'queue',
          label: 'Awaiting My Review',
          value: count((r) => r.status === STATUS.SUPERVISOR_REVIEW),
          helperText: 'In your inbox',
        },
        {
          key: 'forwardedToAdmin',
          label: 'With Admin+',
          value: count(
            (r) =>
              r.status === STATUS.ADMIN_REVIEW ||
              r.status === STATUS.PUBLISH_QUEUE
          ),
          helperText: 'Moved past supervisor',
        },
        {
          key: 'published',
          label: 'Published',
          value: count((r) => r.status === STATUS.PUBLISHED),
          helperText: 'Completed workflow',
        },
        {
          key: 'total',
          label: 'Total Records',
          value: records.length,
          helperText: 'All antiquities in system',
        },
      ];

    case ROLES.ADMIN:
      return [
        {
          key: 'awaitingReview',
          label: 'Awaiting My Review',
          value: count((r) => r.status === STATUS.ADMIN_REVIEW),
          helperText: 'In your queue',
        },
        {
          key: 'pendingPublish',
          label: 'Publish Queue',
          value: count((r) => r.status === STATUS.PUBLISH_QUEUE),
          helperText: 'With Super Admin',
        },
        {
          key: 'published',
          label: 'Published',
          value: count((r) => r.status === STATUS.PUBLISHED),
          helperText: 'Anchored on ledger',
        },
        {
          key: 'total',
          label: 'Total Records',
          value: records.length,
          helperText: 'Across all circles',
        },
      ];

    case ROLES.SUPERADMIN:
      return [
        {
          key: 'publishQueue',
          label: 'My Review Queue',
          value: count((r) => r.status === STATUS.PUBLISH_QUEUE),
          helperText: 'Ready to anchor',
        },
        {
          key: 'published',
          label: 'Published',
          value: count((r) => r.status === STATUS.PUBLISHED),
          helperText: 'Anchored on ledger',
        },
        {
          key: 'rejectedMonth',
          label: 'Rejected',
          value: count((r) => r.status === STATUS.REJECTED),
          helperText: 'Terminal, cannot reopen',
        },
        {
          key: 'total',
          label: 'Total Records',
          value: records.length,
          helperText: 'All antiquities in system',
        },
      ];

    case ROLES.RD:
      return [
        {
          key: 'circleRecords',
          label: 'Total Records',
          value: records.length,
          helperText: 'Across all circles',
        },
        {
          key: 'circlePublished',
          label: 'Published',
          value: count((r) => r.status === STATUS.PUBLISHED),
          helperText: 'Anchored on ledger',
        },
        {
          key: 'circlePending',
          label: 'In Workflow',
          value: count(
            (r) =>
              r.status === STATUS.SUPERVISOR_REVIEW ||
              r.status === STATUS.ADMIN_REVIEW ||
              r.status === STATUS.PUBLISH_QUEUE
          ),
          helperText: 'Under review',
        },
        {
          key: 'rejectedMonth',
          label: 'Rejected',
          value: count((r) => r.status === STATUS.REJECTED),
          helperText: 'Terminal',
        },
      ];

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Activity feed — last 5 records by created_at, mapped to feed shape.
// We don't have a real per-event stream (would need /history across all
// records), so we synthesise activity from record status: "this record
// is currently at status X, created at Y". Not per-actor, but honest
// about what happened at the record level.
// ---------------------------------------------------------------------------

const STATUS_TO_ACTIVITY_TYPE = {
  [STATUS.DRAFT]: 'draft',
  [STATUS.SUPERVISOR_REVIEW]: 'forward',
  [STATUS.ADMIN_REVIEW]: 'forward',
  [STATUS.PUBLISH_QUEUE]: 'forward',
  [STATUS.PUBLISHED]: 'published',
  [STATUS.RETURNED]: 'returned',
  [STATUS.REJECTED]: 'reject',
};

const STATUS_TO_BADGE = {
  [STATUS.DRAFT]: 'Draft',
  [STATUS.SUPERVISOR_REVIEW]: 'Under review',
  [STATUS.ADMIN_REVIEW]: 'Under review',
  [STATUS.PUBLISH_QUEUE]: 'In queue',
  [STATUS.PUBLISHED]: 'Published',
  [STATUS.RETURNED]: 'Returned',
  [STATUS.REJECTED]: 'Rejected',
};

function buildActivity(records) {
  return [...records]
    .sort((a, b) => {
      const at = new Date(b.created_at || 0).getTime();
      const bt = new Date(a.created_at || 0).getTime();
      return at - bt;
    })
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      type: STATUS_TO_ACTIVITY_TYPE[r.status] || 'draft',
      title: r.title || `Record #${r.id}`,
      // Circle label from getCircleLabel — handles unknown codes gracefully.
      description: `${r.type || 'ANTIQUITY'} · ${getCircleLabel(r.circle)}`,
      badge: STATUS_TO_BADGE[r.status] || STATUS_LABEL[r.status] || r.status,
      at: fmtRelative(r.created_at),
    }));
}

/** Small "5m ago" / "2d ago" formatter for the activity feed. */
function fmtRelative(iso) {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

// ---------------------------------------------------------------------------
// Chart — role-specific bar breakdowns. Returns null when the role doesn't
// warrant a chart (Operator is small-data; skip).
// ---------------------------------------------------------------------------

function buildChart(role, records) {
  if (role === ROLES.OPERATOR) return null; // Own records — chart adds noise
  if (!records.length) return null;

  // Admin / SuperAdmin / RD → distribution by circle
  if (
    role === ROLES.ADMIN ||
    role === ROLES.SUPERADMIN ||
    role === ROLES.RD
  ) {
    const byCircle = countBy(records, (r) => r.circle);
    return {
      title: 'Records by Circle',
      // Subtitle no longer hardcodes a circle count — the backend owns the
      // list now, so the chart just reports what's actually there.
      subtitle: 'Distribution across ASI circles',
      data: Object.entries(byCircle)
        .map(([circle, value]) => ({
          label: getCircleLabel(circle),
          value,
        }))
        .sort((a, b) => b.value - a.value),
    };
  }

  // Supervisor → workflow status distribution (their whole team picture)
  if (role === ROLES.SUPERVISOR) {
    const byStatus = countBy(records, (r) => r.status);
    return {
      title: 'Records by Status',
      subtitle: 'Where each record currently sits in the workflow',
      data: Object.entries(byStatus)
        .map(([status, value]) => ({
          label: STATUS_LABEL[status] || status,
          value,
        }))
        .sort((a, b) => b.value - a.value),
    };
  }

  return null;
}

function countBy(items, keyFn) {
  const out = {};
  for (const it of items) {
    const k = keyFn(it) || 'unknown';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}
