import { API_BASE_URL } from './constants';

/**
 * Build a full URL for a record's image.
 *
 * Backend stores images at a server-relative path like `uploads/antiquity/xxx.png`
 * and serves the `/uploads/...` tree read-only via express.static. To render an
 * image in the browser we prepend the API base URL.
 *
 * Robustness:
 *   - Missing image_path → returns null (caller must handle).
 *   - Extra leading slash on image_path → stripped so we don't double-slash.
 *
 * @param {object | null | undefined} record - a record with `image_path`
 * @returns {string | null}
 *
 * @example
 *   imageSrc({ image_path: 'uploads/antiquity/1234.png' })
 *   // → 'http://10.210.12.12:3000/uploads/antiquity/1234.png'
 */
export function imageSrc(record) {
  const path = record?.image_path;
  if (!path) return null;
  const clean = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${clean}`;
}
