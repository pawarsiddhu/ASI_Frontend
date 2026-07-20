import { INDIAN_STATE } from '@features/bhs/schema';

/**
 * Reverse-geocode a lat/lng to Indian administrative fields using Nominatim
 * (OpenStreetMap's own geocoder).
 *
 * Why Nominatim: free, no API key, same OSM ecosystem as our tile provider,
 * respectable coverage for India. Rate-limited to 1 req/sec per their usage
 * policy — the picker debounces upstream so a demo user is comfortably under.
 *
 * Returns { state, district } where either may be '' if we couldn't confidently
 * identify it. Never throws to the caller for expected empties (unknown areas,
 * sea coordinates, disputed borders) — those come back as empty strings. Real
 * errors (network, timeout) still throw.
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

/**
 * Normalize a state name for comparison — lowercase, expand '&' to 'and',
 * strip everything non-alphanumeric. Handles the awkward pair "Jammu &
 * Kashmir" (our list) vs "Jammu and Kashmir" (Nominatim's spelling).
 */
function normKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '');
}

const STATE_LOOKUP = INDIAN_STATE.reduce((acc, name) => {
  acc[normKey(name)] = name;
  return acc;
}, {});

/**
 * Match Nominatim's state string against our dropdown values. Two passes:
 *   1. Exact normalized match (handles the & / and case).
 *   2. Substring match — Nominatim sometimes returns "National Capital
 *      Territory of Delhi"; we still want that to resolve to "Delhi".
 * Falls back to '' when nothing matches (e.g. Andaman & Nicobar, not in our
 * six-circle POC list).
 */
function matchState(rawState) {
  const key = normKey(rawState);
  if (!key) return '';
  if (STATE_LOOKUP[key]) return STATE_LOOKUP[key];
  for (const candidate of Object.keys(STATE_LOOKUP)) {
    if (key.includes(candidate) || candidate.includes(key)) {
      return STATE_LOOKUP[candidate];
    }
  }
  return '';
}

/**
 * Extract a district-ish string from Nominatim's `address` block. India-
 * specific pecking order — `state_district` is the reliable field in
 * populated areas; `county` is what rural pins fall back to.
 */
function extractDistrict(addr) {
  return String(
    addr?.state_district || addr?.county || addr?.district || ''
  ).trim();
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{state: string, district: string}>}
 */
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '10'); // district-ish resolution
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    throw new Error(`Nominatim ${res.status}`);
  }
  const data = await res.json();
  const addr = data?.address || {};
  return {
    state: matchState(addr.state),
    district: extractDistrict(addr),
  };
}