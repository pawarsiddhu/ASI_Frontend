/**
 * Circle metadata — display niceties for known ASI circles.
 *
 * The backend is now the source of truth for the LIST of circles
 * (GET /circles returns just codes like ["AGRA","DELHI",...]). This file
 * enriches those codes with display names and state mappings for the
 * circles we know about — so the UI can show "Agra Circle" instead of
 * bare "AGRA", and reports can group AGRA records under "Uttar Pradesh".
 *
 * Circles the backend returns that AREN'T in this table are still fully
 * usable: `getCircleLabel` falls back to a derived title-case name
 * ("Agra Circle") and `getCircleState` returns null. Add entries here
 * as the backend enum expands and we need real state mappings.
 *
 * IMPORTANT: entries here should never DRIVE the available circle list.
 * They're only for enrichment. The list itself comes from useCircles().
 */

// The 29 real ASI circles + their headquartered state. Seeded from public
// ASI directory data; add/adjust as needed. Codes are UPPERCASE and stable.
export const CIRCLE_METADATA = {
  AGRA:          { name: 'Agra Circle',          state: 'Uttar Pradesh' },
  AURANGABAD:    { name: 'Aurangabad Circle',    state: 'Maharashtra' },
  BENGALURU:     { name: 'Bengaluru Circle',     state: 'Karnataka' },
  BHOPAL:        { name: 'Bhopal Circle',        state: 'Madhya Pradesh' },
  BHUBANESWAR:   { name: 'Bhubaneswar Circle',   state: 'Odisha' },
  CHANDIGARH:    { name: 'Chandigarh Circle',    state: 'Chandigarh' },
  CHENNAI:       { name: 'Chennai Circle',       state: 'Tamil Nadu' },
  DEHRADUN:      { name: 'Dehradun Circle',      state: 'Uttarakhand' },
  DELHI:         { name: 'Delhi Circle',         state: 'Delhi' },
  DHARWAD:       { name: 'Dharwad Circle',       state: 'Karnataka' },
  GOA:           { name: 'Goa Circle',           state: 'Goa' },
  GUWAHATI:      { name: 'Guwahati Circle',      state: 'Assam' },
  HYDERABAD:     { name: 'Hyderabad Circle',     state: 'Telangana' },
  JAIPUR:        { name: 'Jaipur Circle',        state: 'Rajasthan' },
  JODHPUR:       { name: 'Jodhpur Circle',       state: 'Rajasthan' },
  KOLKATA:       { name: 'Kolkata Circle',       state: 'West Bengal' },
  LUCKNOW:       { name: 'Lucknow Circle',       state: 'Uttar Pradesh' },
  MUMBAI:        { name: 'Mumbai Circle',        state: 'Maharashtra' },
  NAGPUR:        { name: 'Nagpur Circle',        state: 'Maharashtra' },
  PATNA:         { name: 'Patna Circle',         state: 'Bihar' },
  RAIPUR:        { name: 'Raipur Circle',        state: 'Chhattisgarh' },
  RANCHI:        { name: 'Ranchi Circle',        state: 'Jharkhand' },
  SHIMLA:        { name: 'Shimla Circle',        state: 'Himachal Pradesh' },
  SRINAGAR:      { name: 'Srinagar Circle',      state: 'Jammu & Kashmir' },
  THRISSUR:      { name: 'Thrissur Circle',      state: 'Kerala' },
  VADODARA:      { name: 'Vadodara Circle',      state: 'Gujarat' },
};

/**
 * Circles we ship in-app when the API is unreachable. Kept small on purpose —
 * this is a "last-resort so the form isn't broken" set, not a mirror of the
 * backend. The soft fallback path in useCircles() logs a warning so this
 * doesn't silently mask a real outage.
 */
export const FALLBACK_CIRCLE_IDS = [
  'DELHI',
  'MUMBAI',
  'CHENNAI',
  'KOLKATA',
  'JAIPUR',
  'GUWAHATI',
];

/**
 * Best-effort display label for a circle code.
 *
 * Priority:
 *   1. Metadata table (nice pre-written names)
 *   2. Derived from code — "AGRA" → "Agra Circle" so unknown codes still
 *      read well
 *   3. em-dash if the code is falsy
 *
 * Pure — safe to call in configs, tables, exports; no hooks, no state.
 */
export function getCircleLabel(id) {
  if (!id) return '—';
  const meta = CIRCLE_METADATA[id];
  if (meta?.name) return meta.name;
  const s = String(id);
  const titled = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return `${titled} Circle`;
}

/**
 * State associated with a circle, or null if we don't have a mapping.
 * Used by dashboards/reports for state-wise aggregation on antiquity records
 * (BHS records carry their own `state` field so this isn't needed there).
 */
export function getCircleState(id) {
  return CIRCLE_METADATA[id]?.state ?? null;
}

/**
 * Turn a list of circle codes into `{value, label}` <Select> options,
 * sorted alphabetically by label. Pure — used by useCircles() and callable
 * directly by tests / consumers that have their own list.
 */
export function toCircleOptions(ids) {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => ({ value: id, label: getCircleLabel(id) }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
