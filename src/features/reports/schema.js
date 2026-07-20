import { ROLES } from '@utils/constants';

/**
 * Reports schema — the registry of report "dimensions" (group-by axes).
 *
 * A dimension is the thing rows are grouped by: circle, museum, state, etc.
 * Each dimension has an id (URL param), label (tab / dropdown text), and
 * a `columnLabel` used as the leftmost table column header.
 *
 * Roles see only the dimensions relevant to them (per SoW).
 * Adding a new dimension: register it here, teach the MSW handler to group by
 * that field, and it appears in the UI automatically.
 */

export const DIMENSION = {
  CIRCLE: 'circle',
  MUSEUM: 'museum',
  STATE: 'state',
  STATUS: 'status',
  CATEGORY: 'category',
};

export const DIMENSION_META = {
  [DIMENSION.CIRCLE]: {
    id: DIMENSION.CIRCLE,
    label: 'By Circle',
    columnLabel: 'ASI Circle',
    description: 'Records grouped by the ASI regional circle',
  },
  [DIMENSION.MUSEUM]: {
    id: DIMENSION.MUSEUM,
    label: 'By Museum',
    columnLabel: 'Museum',
    description: 'Records grouped by hosting museum',
  },
  [DIMENSION.STATE]: {
    id: DIMENSION.STATE,
    label: 'By State',
    columnLabel: 'State',
    description: 'Records grouped by state',
  },
  [DIMENSION.STATUS]: {
    id: DIMENSION.STATUS,
    label: 'By Status',
    columnLabel: 'Workflow Status',
    description: 'Records grouped by workflow status',
  },
  [DIMENSION.CATEGORY]: {
    id: DIMENSION.CATEGORY,
    label: 'By Category',
    columnLabel: 'Category',
    description: 'Records grouped by antiquity category',
  },
};

/**
 * Which dimensions each role can pick. Order matters — first entry is the
 * default when the user lands on /reports/antiquities without ?dimension.
 *
 * Admin (per SoW): state/district/tehsil for BHS + museum/circle for Antiquities.
 * Super Admin (per SoW): state totals + per-museum + per-archaeological-site.
 */
export const DIMENSIONS_BY_ROLE = {
  [ROLES.ADMIN]: [
    DIMENSION.CIRCLE,
    DIMENSION.MUSEUM,
    DIMENSION.STATE,
    DIMENSION.STATUS,
    DIMENSION.CATEGORY,
  ],
  [ROLES.SUPERADMIN]: [
    DIMENSION.STATE,
    DIMENSION.MUSEUM,
    DIMENSION.CIRCLE,
    DIMENSION.STATUS,
    DIMENSION.CATEGORY,
  ],
  // Chunk B will add operator / supervisor / rd here.
};

/**
 * Date-range presets. Value = day count backward from today.
 * A `null` value means "custom range" — filters render date inputs.
 */
export const DATE_PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom range…' },
];

export const DEFAULT_PRESET = 'all';

/**
 * Turn a preset value into an ISO date range { from, to }.
 * `to` is always today; `from` shifts based on preset.
 */
export function presetToRange(preset, today = new Date()) {
  const to = new Date(today);
  to.setHours(23, 59, 59, 999);

  if (preset === 'all' || !preset) {
    return { from: null, to: null };
  }
  if (preset === 'ytd') {
    const from = new Date(today.getFullYear(), 0, 1);
    return { from: iso(from), to: iso(to) };
  }
  if (preset === 'custom') {
    return { from: null, to: null };
  }
  const days = parseInt(preset, 10);
  if (Number.isFinite(days)) {
    const from = new Date(today);
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    return { from: iso(from), to: iso(to) };
  }
  return { from: null, to: null };
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}
