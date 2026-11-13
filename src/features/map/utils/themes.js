import { STATUS_LABEL } from '@features/antiquities/schema';

/**
 * Thematic colouring — "colour the map by X".
 *
 * Period is ORDINAL (older → newer), so it gets an ordered ramp: gold for
 * the oldest eras, through brand maroon, to deep plum for Colonial. Every
 * other theme is NOMINAL, so it gets distinct hues.
 */
const PERIOD_RAMP = ['#D9B44A', '#D48A2E', '#C2611F', '#A63D1F', '#8B1A1A', '#6E1F45', '#4C2A5E', '#2E3157'];

const CATEGORICAL = [
  '#8B1A1A', '#0D9488', '#C9A961', '#6D4C9E', '#B45309', '#2F6F4F',
  '#C2417A', '#3B6EA8', '#7A5C2E', '#1F9EB0', '#8C8C2A', '#5E5E5E',
];

const PROTECTION_COLORS = { CENTRAL: '#0D9488', STATE: '#C9A961', UNPROTECTED: '#B91C1C' };

const STATUS_COLORS = {
  DRAFT: '#78756F',
  PENDING_SUPERVISOR: '#A16207',
  PENDING_ADMIN: '#C9A961',
  PENDING_SUPERADMIN: '#B45309',
  PUBLISHED: '#0D9488',
  RETURNED: '#D97706',
  REJECTED: '#B91C1C',
};

export const THEME_OPTIONS = [
  { value: 'period', label: 'Period' },
  { value: 'category', label: 'Category' },
  { value: 'affiliation', label: 'Cultural affiliation' },
  { value: 'protection', label: 'Protection level' },
  { value: 'status', label: 'Workflow status' },
];

const FALLBACK = '#A8A5A0';

/**
 * Build a theme: { key(props) → value, color(value) → hex, legend: [{value,label,color}] }.
 * Built from the master tables so new vocabulary values colour automatically.
 */
export function buildTheme(themeId, masters) {
  if (!masters) return { key: () => null, color: () => FALLBACK, legend: [] };

  if (themeId === 'period') {
    const legend = masters.periods.map((p, i) => ({ value: p.id, label: p.name, color: PERIOD_RAMP[i % PERIOD_RAMP.length] }));
    return fromLegend((p) => p.period_id, legend);
  }
  if (themeId === 'category') {
    const legend = masters.categories.map((c, i) => ({
      value: c.id,
      label: c.name,
      group: c.applies_to,
      // BHS and antiquity categories reuse the palette independently
      color: CATEGORICAL[(c.applies_to === 'BHS' ? i : i - 12) % CATEGORICAL.length],
    }));
    return fromLegend((p) => p.category_id, legend);
  }
  if (themeId === 'affiliation') {
    const legend = masters.cultural_affiliations.map((a, i) => ({ value: a.id, label: a.name, color: CATEGORICAL[i % CATEGORICAL.length] }));
    return fromLegend((p) => p.cultural_affiliation_id, legend);
  }
  if (themeId === 'protection') {
    const legend = masters.protection_levels.map((p) => ({ value: p.id, label: p.name, color: PROTECTION_COLORS[p.id] || FALLBACK }));
    // Antiquities have no protection level — they inherit nothing and fall back to grey.
    return fromLegend((p) => p.protection_level, legend);
  }
  // status
  const legend = Object.keys(STATUS_COLORS).map((s) => ({ value: s, label: STATUS_LABEL[s] || s, color: STATUS_COLORS[s] }));
  return fromLegend((p) => p.status, legend);
}

function fromLegend(key, legend) {
  const byValue = Object.fromEntries(legend.map((l) => [l.value, l.color]));
  return { key, color: (v) => byValue[v] || FALLBACK, legend };
}

export const MUSEUM_COLOR = '#4C2A5E';
export const DISPERSAL_COLOR = '#6E1F45';
export const SELECTION_COLOR = '#1A1815';
