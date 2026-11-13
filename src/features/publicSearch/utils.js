import { API_BASE_URL } from '@utils/constants';

/**
 * Build the full URL for a public record's image.
 * Public payloads carry `image` (not `image_path` like the internal shape),
 * so we can't reuse the internal `imageSrc()` helper directly.
 */
export function publicImageSrc(record) {
  const path = record?.image;
  if (!path) return null;
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

/** Format an ISO date as "20 Jul 2026". Safe on nulls. */
export function formatUpdatedAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Client-side filter: case-insensitive match against title or reference_number.
 * Optionally narrows to a state (BHS records only).
 */
export function filterRecords(records, { q, state }) {
  const query = (q || '').trim().toLowerCase();
  return (records || []).filter((r) => {
    if (state && r.state !== state) return false;
    if (!query) return true;
    const t = (r.title || '').toLowerCase();
    const ref = (r.reference_number || '').toLowerCase();
    return t.includes(query) || ref.includes(query);
  });
}

/** Sort by updated_at descending — the only sort the UI offers. */
export function sortByUpdatedDesc(records) {
  return [...(records || [])].sort((a, b) => {
    const ta = new Date(a.updated_at || 0).getTime();
    const tb = new Date(b.updated_at || 0).getTime();
    return tb - ta;
  });
}

/** Unique, sorted list of states present in a BHS result set. */
export function uniqueStates(records) {
  const set = new Set();
  (records || []).forEach((r) => {
    if (r.state) set.add(r.state);
  });
  return Array.from(set).sort();
}
