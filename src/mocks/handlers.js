import { http, HttpResponse, delay } from 'msw';
import { findByUsername, findById } from './data/users';
import {
  antiquities,
  findAntiquityById,
  findAntiquityIndex,
} from './data/antiquities';
import {
  STATUS,
  STATUS_LABEL,
  CATEGORY_LABEL,
  CIRCLE_TO_STATE,
} from '@features/antiquities/schema';
import { CIRCLE_METADATA } from '@features/circles/circleMetadata';
import { ROLES } from '@utils/constants';

// ============================================================================
// JWT helpers (fake, structurally similar to real JWT)
// ============================================================================
function makeToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    iat: Math.floor(Date.now() / 1000),
  };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `fake-jwt.${encoded}.sig`;
}

function decodeToken(token) {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

function requireAuth(request) {
  const token = getBearerToken(request);
  if (!token) return { error: unauthorized('Missing token.') };
  const payload = decodeToken(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    return { error: unauthorized('Token expired or invalid.') };
  }
  const user = findById(payload.sub);
  if (!user) return { error: unauthorized('User not found.') };
  return { payload, user };
}

function unauthorized(message) {
  return HttpResponse.json({ message }, { status: 401 });
}

function badRequest(message) {
  return HttpResponse.json({ message }, { status: 400 });
}

function forbidden(message) {
  return HttpResponse.json({ message }, { status: 403 });
}

// ============================================================================
// Workflow state machine — the single source of truth for transitions.
// Matches the workflow diagram: Operator → Supervisor → Admin → Super Admin,
// with Return moving one level back, Reject as terminal, Publish as terminal-success.
// ============================================================================
const FORWARD_TRANSITIONS = {
  [STATUS.DRAFT]: STATUS.SUPERVISOR_REVIEW,
  [STATUS.RETURNED]: STATUS.SUPERVISOR_REVIEW,
  [STATUS.SUPERVISOR_REVIEW]: STATUS.ADMIN_REVIEW,
  [STATUS.ADMIN_REVIEW]: STATUS.PUBLISH_QUEUE,
  // Note: publish_queue → published happens via /publish, not /forward.
};

const RETURN_TRANSITIONS = {
  [STATUS.SUPERVISOR_REVIEW]: STATUS.RETURNED, // Supervisor → Operator
  [STATUS.ADMIN_REVIEW]: STATUS.SUPERVISOR_REVIEW, // Admin → Supervisor
  [STATUS.PUBLISH_QUEUE]: STATUS.ADMIN_REVIEW, // Super Admin → Admin
};

// Roles allowed to perform each action at each status.
// Used to enforce that the action is only taken by the current reviewer.
const FORWARD_ACTOR = {
  [STATUS.DRAFT]: [ROLES.OPERATOR],
  [STATUS.RETURNED]: [ROLES.OPERATOR],
  [STATUS.SUPERVISOR_REVIEW]: [ROLES.SUPERVISOR],
  [STATUS.ADMIN_REVIEW]: [ROLES.ADMIN],
};

const RETURN_ACTOR = {
  [STATUS.SUPERVISOR_REVIEW]: [ROLES.SUPERVISOR],
  [STATUS.ADMIN_REVIEW]: [ROLES.ADMIN],
  [STATUS.PUBLISH_QUEUE]: [ROLES.SUPERADMIN],
};

const REJECT_ACTOR = {
  [STATUS.SUPERVISOR_REVIEW]: [ROLES.SUPERVISOR, ROLES.ADMIN, ROLES.SUPERADMIN],
  [STATUS.ADMIN_REVIEW]: [ROLES.ADMIN, ROLES.SUPERADMIN],
  [STATUS.PUBLISH_QUEUE]: [ROLES.SUPERADMIN],
};

// ============================================================================
// Ledger id generators — real API shape only.
// The earlier `makeTrustAnchor` returned a bundle of fake IPFS/block/network
// metadata that never existed on the real backend. That's gone. The real
// backend surfaces two ledger fields on a published record:
//   - blockchain_tx : the Fabric transaction id set on publish
//   - ledger_key    : a UUID under which the asset is anchored
// Both are surfaced as opaque strings; the mock generates lookalikes.
// ============================================================================
function randomHex(len) {
  let out = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * 16)];
  return out;
}

/** Generates a UUID-v4-shaped string using randomHex. */
function makeLedgerKey() {
  const h = randomHex(32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${
    '89ab'[Math.floor(Math.random() * 4)]
  }${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// ============================================================================
// Helper — append a history entry to a record
// ============================================================================
function appendHistory(record, entry) {
  if (!Array.isArray(record.history)) record.history = [];
  record.history.push({
    at: new Date().toISOString(),
    ...entry,
  });
}

// ============================================================================
// Handlers
// ============================================================================
export const handlers = [
  // ---------- POST /api/auth/login ----------
  http.post('*/auth/login', async ({ request }) => {
    await delay(400);
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;
    const user = findByUsername(username);
    if (!user || password !== 'password123') {
      return HttpResponse.json(
        { message: 'Invalid username or password.' },
        { status: 401 }
      );
    }
    return HttpResponse.json({ token: makeToken(user), user });
  }),

  // ---------- GET /circles ----------
  // Mirrors the real backend: enveloped response with a flat string[]. The
  // baseQuery layer unwraps to plain data downstream. Auth is required —
  // circles are internal reference data.
  //
  // For demo value, we return a rotating subset of the full ASI circle
  // catalogue so the "backend list drives the dropdown" story is visible:
  // Agra shows up alongside the original six, proving the frontend no
  // longer hardcodes them.
  http.get('*/circles', async ({ request }) => {
    await delay(150);
    const { error } = requireAuth(request);
    if (error) return error;
    const codes = [
      'AGRA',
      'AURANGABAD',
      'BENGALURU',
      'BHOPAL',
      'CHENNAI',
      'DELHI',
      'GUWAHATI',
      'HYDERABAD',
      'JAIPUR',
      'KOLKATA',
      'LUCKNOW',
      'MUMBAI',
      'PATNA',
      'SRINAGAR',
      'VADODARA',
    ].filter((c) => c in CIRCLE_METADATA);
    return HttpResponse.json({
      success: true,
      message: 'Circles fetched',
      data: codes,
    });
  }),

  // ---------- GET /api/antiquities ----------
  http.get('*/records', async ({ request }) => {
    await delay(500);
    const { error, payload, user } = requireAuth(request);
    if (error) return error;

    let scoped = antiquities;
    if (payload.role === ROLES.OPERATOR) {
      scoped = scoped.filter((a) => a.recordedBy.id === user.id);
    } else if (
      payload.role === ROLES.SUPERVISOR ||
      payload.role === ROLES.RD
    ) {
      scoped = scoped.filter((a) => a.circle.id === user.circleId);
    }

    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const status = url.searchParams.get('status') || '';
    const circle = url.searchParams.get('circle') || '';
    const category = url.searchParams.get('category') || '';
    const type = url.searchParams.get('type') || '';

    let filtered = scoped;
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.accessionNo.toLowerCase().includes(search) ||
          a.id.toLowerCase().includes(search)
      );
    }
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (circle) filtered = filtered.filter((a) => a.circle.id === circle);
    if (category) filtered = filtered.filter((a) => a.category === category);
    // All mock records are antiquities; the ANTIQUITY filter is an identity
    // op today but will matter once BHS records join the seed.
    if (type === 'BHS') filtered = [];
    // (type === 'ANTIQUITY' → no filter needed since all seeds are antiquities)

    const sortBy = url.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    filtered = [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortBy);
      const bv = getSortValue(b, sortBy);
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filtered.length;
    const page = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);
    const pageSize = Math.max(
      1,
      parseInt(url.searchParams.get('pageSize'), 10) || 25
    );
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }),

  // ---------- GET /api/antiquities/:id ----------
  http.get('*/records/:id', async ({ request, params }) => {
    await delay(300);
    const { error } = requireAuth(request);
    if (error) return error;
    const item = findAntiquityById(params.id);
    if (!item) {
      return HttpResponse.json(
        { message: 'Antiquity not found.' },
        { status: 404 }
      );
    }
    return HttpResponse.json(item);
  }),

  // ---------- POST /api/antiquities ----------
  http.post('*/records', async ({ request }) => {
    await delay(500);
    const { error, user } = requireAuth(request);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    if (!body.name?.trim()) return badRequest('Name is required.');

    const circles = antiquities.map((a) => a.circle);
    const circleObj = circles.find((c) => c.id === body.circle) || {
      id: body.circle,
      name: body.circle,
    };

    const nowIso = new Date().toISOString();
    const newRecord = {
      id: `R-2026-${String(1200 + antiquities.length).padStart(4, '0')}`,
      accessionNo: body.accessionNo || '',
      name: body.name,
      category: body.category,
      subCategory: body.subCategory || '',
      material: body.material,
      condition: body.condition,
      dimensions: {
        h: body.height || 0,
        w: body.width || 0,
        d: body.depth || 0,
        unit: 'cm',
      },
      weight: { value: body.weight || 0, unit: 'g' },
      period: body.period,
      culturalAffiliation: body.culturalAffiliation,
      provenance: body.provenance || '',
      circle: circleObj,
      museumName: body.museumName || '',
      currentLocation: body.currentLocation || '',
      sourceOfAcquisition: body.sourceOfAcquisition || '',
      acquisitionDate: body.acquisitionDate || null,
      identificationMarks: body.identificationMarks || '',
      remarks: body.remarks || '',
      recordedBy: { id: user.id, name: user.name },
      recordedAt: nowIso,
      updatedAt: nowIso,
      status: STATUS.DRAFT,
      images: [],
      history: [
        {
          at: nowIso,
          byUserId: user.id,
          byUserName: user.name,
          action: 'create',
          from: null,
          to: STATUS.DRAFT,
          comment: 'Record created',
        },
      ],
    };

    antiquities.unshift(newRecord);
    return HttpResponse.json(newRecord, { status: 201 });
  }),

  // ---------- PUT /api/antiquities/:id ----------
  // Update fields. Same validation as create.
  http.put('*/records/:id', async ({ request, params }) => {
    await delay(400);
    const { error, user } = requireAuth(request);
    if (error) return error;

    const idx = findAntiquityIndex(params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: 'Antiquity not found.' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (!body.name?.trim()) return badRequest('Name is required.');

    const existing = antiquities[idx];
    const nowIso = new Date().toISOString();
    const circles = antiquities.map((a) => a.circle);
    const circleObj =
      circles.find((c) => c.id === body.circle) || existing.circle;

    const updated = {
      ...existing,
      accessionNo: body.accessionNo ?? existing.accessionNo,
      name: body.name,
      category: body.category ?? existing.category,
      subCategory: body.subCategory ?? existing.subCategory,
      material: body.material ?? existing.material,
      condition: body.condition ?? existing.condition,
      dimensions: {
        h: body.height ?? existing.dimensions.h,
        w: body.width ?? existing.dimensions.w,
        d: body.depth ?? existing.dimensions.d,
        unit: 'cm',
      },
      weight: {
        value: body.weight ?? existing.weight.value,
        unit: existing.weight.unit || 'g',
      },
      period: body.period ?? existing.period,
      culturalAffiliation:
        body.culturalAffiliation ?? existing.culturalAffiliation,
      provenance: body.provenance ?? existing.provenance,
      circle: circleObj,
      museumName: body.museumName ?? existing.museumName,
      currentLocation: body.currentLocation ?? existing.currentLocation,
      sourceOfAcquisition:
        body.sourceOfAcquisition ?? existing.sourceOfAcquisition,
      acquisitionDate: body.acquisitionDate ?? existing.acquisitionDate,
      identificationMarks:
        body.identificationMarks ?? existing.identificationMarks,
      remarks: body.remarks ?? existing.remarks,
      images: Array.isArray(body.images) ? body.images : existing.images,
      updatedAt: nowIso,
    };

    appendHistory(updated, {
      byUserId: user.id,
      byUserName: user.name,
      action: 'edit',
      from: existing.status,
      to: existing.status,
      comment: 'Record fields updated',
    });

    antiquities[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // ---------- POST /api/antiquities/:id/forward ----------
  http.post('*/records/:id/forward', async ({ request, params }) => {
    return handleWorkflowTransition({
      request,
      params,
      action: 'forward',
      transitionMap: FORWARD_TRANSITIONS,
      actorMap: FORWARD_ACTOR,
      requiresComment: true,
    });
  }),

  // ---------- POST /api/antiquities/:id/return ----------
  http.post('*/records/:id/return', async ({ request, params }) => {
    return handleWorkflowTransition({
      request,
      params,
      action: 'return',
      transitionMap: RETURN_TRANSITIONS,
      actorMap: RETURN_ACTOR,
      requiresComment: true,
    });
  }),

  // ---------- POST /api/antiquities/:id/reject ----------
  http.post('*/records/:id/reject', async ({ request, params }) => {
    await delay(500);
    const { error, user, payload } = requireAuth(request);
    if (error) return error;

    const idx = findAntiquityIndex(params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: 'Antiquity not found.' },
        { status: 404 }
      );
    }
    const record = antiquities[idx];
    const body = await request.json().catch(() => ({}));
    const comment = (body.note || body.comment || '').trim();
    if (!comment) return badRequest('A rejection reason is required.');

    const allowedRoles = REJECT_ACTOR[record.status] || [];
    if (!allowedRoles.includes(payload.role)) {
      return forbidden(
        `Cannot reject a record in status "${record.status}" as ${payload.role}.`
      );
    }

    const from = record.status;
    const updated = {
      ...record,
      status: STATUS.REJECTED,
      updatedAt: new Date().toISOString(),
    };
    appendHistory(updated, {
      byUserId: user.id,
      byUserName: user.name,
      action: 'reject',
      from,
      to: STATUS.REJECTED,
      comment,
    });
    antiquities[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // ---------- POST /records/:id/publish ----------
  // Super Admin publishes. Generates fake TX hash + IPFS CID (Phase 5 remainder:
  // strip the fake anchors, wire real blockchain_tx display, add Verify UI).
  http.post('*/records/:id/publish', async ({ request, params }) => {
    await delay(700); // Slightly longer to sell the "anchoring" step
    const { error, user, payload } = requireAuth(request);
    if (error) return error;

    if (payload.role !== ROLES.SUPERADMIN) {
      return forbidden('Only Super Admin can publish.');
    }

    const idx = findAntiquityIndex(params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: 'Antiquity not found.' },
        { status: 404 }
      );
    }
    const record = antiquities[idx];
    if (record.status !== STATUS.PUBLISH_QUEUE) {
      return badRequest(
        `Record must be in Publish Queue to publish. Current: ${record.status}.`
      );
    }

    const body = await request.json().catch(() => ({}));
    const comment = (body.note || body.comment || '').trim() || 'Published';

    // Match the real backend contract: publish sets `blockchain_tx` on the
    // record itself. The old fake `trustAnchor` object (txHash/ipfsCid/
    // blockNumber/network) is gone — those fields never existed on the real
    // API. `ledger_key` is stable across resets in the real backend; the
    // mock synthesises one on first publish if not already present.
    const from = record.status;
    const blockchainTx = 'tx_' + randomHex(24);
    const ledgerKey = record.ledger_key || makeLedgerKey();
    const updated = {
      ...record,
      status: STATUS.PUBLISHED,
      blockchain_tx: blockchainTx,
      ledger_key: ledgerKey,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    appendHistory(updated, {
      byUserId: user.id,
      byUserName: user.name,
      action: 'publish',
      from,
      to: STATUS.PUBLISHED,
      comment,
      meta: { blockchain_tx: blockchainTx },
    });
    antiquities[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // ---------- GET /records/:id/verify ----------
  // Recompute-and-compare against the "ledger". In the mock we don't
  // actually hash anything — we return the shape the real backend uses so
  // the frontend's five UI states can be exercised.
  //
  // Response shape is a oneOf (see swagger):
  //   VerifyComparison  → { verified, contentMatch, imageMatch, txId }
  //   VerifyUnavailable → { verified, reason }
  //
  // Default behaviour: happy path (verified: true).
  // For demo variety without needing extra records, a couple of specific
  // record ids trip the alternate states:
  //   - if the record has no blockchain_tx → NOT_ANCHORED
  //   - if the id ends in 7 → deliberate contentMatch=false (drift demo)
  //   - if the id ends in 9 → NOT_FOUND_ON_LEDGER (unavailable demo)
  // Everything else verifies clean.
  http.get('*/records/:id/verify', async ({ request, params }) => {
    await delay(500);
    const { error } = requireAuth(request);
    if (error) return error;

    const idx = findAntiquityIndex(params.id);
    if (idx === -1) {
      return HttpResponse.json(
        { message: `Record ${params.id} not found` },
        { status: 404 }
      );
    }
    const record = antiquities[idx];

    // Only published records can be verified — matches real backend 409.
    if (record.status !== STATUS.PUBLISHED) {
      return HttpResponse.json(
        { message: 'Only published records can be verified.' },
        { status: 409 }
      );
    }

    // --- Unavailable variants ---
    if (!record.blockchain_tx) {
      return HttpResponse.json({
        verified: false,
        reason: 'NOT_ANCHORED',
      });
    }
    const lastChar = String(record.id).slice(-1);
    if (lastChar === '9') {
      return HttpResponse.json({
        verified: false,
        reason: 'NOT_FOUND_ON_LEDGER',
      });
    }

    // --- Comparison variants ---
    if (lastChar === '7') {
      // Deliberate mismatch — content ok, image drifted.
      return HttpResponse.json({
        verified: false,
        contentMatch: true,
        imageMatch: false,
        txId: record.blockchain_tx,
      });
    }

    // Happy path
    return HttpResponse.json({
      verified: true,
      contentMatch: true,
      imageMatch: true,
      txId: record.blockchain_tx,
    });
  }),

  // ---------- GET /api/reports/antiquities ----------
  // Aggregate report of antiquities grouped by a chosen dimension.
  //   ?dimension = circle | museum | state | status | category  (default: circle)
  //   ?from      = YYYY-MM-DD  (optional, filters by updatedAt)
  //   ?to        = YYYY-MM-DD  (optional, inclusive)
  //
  // Scope: Admin + Super Admin see everything. Other roles get 403 for now
  // (Chunk B will scope to team/circle/own).
  http.get('*/reports/antiquities', async ({ request }) => {
    await delay(500);
    const { error, payload } = requireAuth(request);
    if (error) return error;

    if (payload.role !== ROLES.ADMIN && payload.role !== ROLES.SUPERADMIN) {
      return forbidden('This report is available to Admin and Super Admin.');
    }

    const url = new URL(request.url);
    const dimension = url.searchParams.get('dimension') || 'circle';
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');

    // ---- 1. Filter by date range (using updatedAt) ----
    let scoped = antiquities;
    if (from) {
      const fromMs = new Date(from + 'T00:00:00').getTime();
      scoped = scoped.filter((r) => new Date(r.updatedAt).getTime() >= fromMs);
    }
    if (to) {
      const toMs = new Date(to + 'T23:59:59').getTime();
      scoped = scoped.filter((r) => new Date(r.updatedAt).getTime() <= toMs);
    }

    // ---- 2. Compute overall totals ----
    const totals = buildStatusTotals(scoped);
    totals.all = scoped.length;

    // ---- 3. Group by dimension ----
    const groups = groupByDimension(scoped, dimension);
    const rows = Object.values(groups).sort((a, b) => b.total - a.total);

    return HttpResponse.json({
      dimension,
      from: from || null,
      to: to || null,
      totals,
      rows,
    });
  }),
];

// ============================================================================
// Shared workflow-transition handler (forward + return share this shape)
// ============================================================================
async function handleWorkflowTransition({
  request,
  params,
  action,
  transitionMap,
  actorMap,
  requiresComment,
}) {
  await delay(500);
  const { error, user, payload } = requireAuth(request);
  if (error) return error;

  const idx = findAntiquityIndex(params.id);
  if (idx === -1) {
    return HttpResponse.json(
      { message: 'Antiquity not found.' },
      { status: 404 }
    );
  }
  const record = antiquities[idx];

  const body = await request.json().catch(() => ({}));
  const comment = (body.note || body.comment || '').trim();
  if (requiresComment && !comment) {
    return badRequest('A comment is required for this action.');
  }

  const nextStatus = transitionMap[record.status];
  if (!nextStatus) {
    return badRequest(
      `Cannot ${action} from status "${record.status}".`
    );
  }

  const allowedRoles = actorMap[record.status] || [];
  if (!allowedRoles.includes(payload.role)) {
    return forbidden(
      `Role "${payload.role}" cannot ${action} a record in "${record.status}".`
    );
  }

  const from = record.status;
  const updated = {
    ...record,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
  appendHistory(updated, {
    byUserId: user.id,
    byUserName: user.name,
    action,
    from,
    to: nextStatus,
    comment: comment || `Record ${action}ed`,
  });
  antiquities[idx] = updated;
  return HttpResponse.json(updated);
}

// ---- Helpers ----
function getSortValue(record, key) {
  if (key === 'name' || key === 'status') return record[key];
  return new Date(record[key] || 0).getTime();
}

// ============================================================================
// Aggregation helpers for reports
// ============================================================================

/**
 * buildStatusTotals — count records per workflow status.
 * Every status key is present in the output, even if 0, so the UI can render
 * consistent columns.
 */
function buildStatusTotals(records) {
  const out = {};
  Object.values(STATUS).forEach((s) => {
    out[s] = 0;
  });
  for (const r of records) {
    if (out[r.status] !== undefined) out[r.status] += 1;
  }
  return out;
}

/**
 * groupByDimension — bucket records by the given dimension.
 *   circle   → key = circle.id, label = circle.name
 *   museum   → key = museumName || 'Unspecified', label same
 *   state    → key = CIRCLE_TO_STATE[circle.id] || 'Unknown', label same
 *   status   → key = status, label = STATUS_LABEL[status]
 *   category → key = category, label = CATEGORY_LABEL[category]
 *
 * Returns an object keyed by bucket key. Values are rows in the shape the
 * ReportTable expects.
 */
function groupByDimension(records, dimension) {
  const buckets = {};

  for (const r of records) {
    const { key, label } = getBucket(r, dimension);
    if (!buckets[key]) {
      buckets[key] = {
        key,
        label,
        total: 0,
        byStatus: buildStatusTotals([]), // zeroed
      };
    }
    buckets[key].total += 1;
    if (buckets[key].byStatus[r.status] !== undefined) {
      buckets[key].byStatus[r.status] += 1;
    }
  }

  return buckets;
}

function getBucket(record, dimension) {
  switch (dimension) {
    case 'museum': {
      const name = record.museumName || 'Unspecified';
      return { key: name, label: name };
    }
    case 'state': {
      const state = CIRCLE_TO_STATE[record.circle?.id] || 'Unknown';
      return { key: state, label: state };
    }
    case 'status':
      return { key: record.status, label: STATUS_LABEL[record.status] || record.status };
    case 'category':
      return {
        key: record.category,
        label: CATEGORY_LABEL[record.category] || record.category,
      };
    case 'circle':
    default:
      return {
        key: record.circle?.id || 'Unknown',
        label: record.circle?.name || 'Unknown Circle',
      };
  }
}
