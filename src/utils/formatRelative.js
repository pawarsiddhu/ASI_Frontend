/**
 * formatRelative(isoOrDate, verbose = false)
 *
 * Compact relative-time formatter used in list rows and activity strips.
 *   default:  "just now", "5m ago", "2h ago", "3d ago", "2mo ago"
 *   verbose:  same, but "yesterday" for exactly 1 day, "N days ago" for 2-6
 *
 * Returns an empty string when the input is falsy or unparseable — safer
 * than a placeholder like "unknown" that could leak into UI.
 */
export function formatRelative(isoOrDate, verbose = false) {
  if (!isoOrDate) return '';
  const then =
    typeof isoOrDate === 'string' || typeof isoOrDate === 'number'
      ? new Date(isoOrDate).getTime()
      : isoOrDate?.getTime?.();
  if (!then || Number.isNaN(then)) return '';

  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (verbose) {
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d}d ago`;
  }
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
