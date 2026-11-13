/**
 * Small spatial helpers. Deliberately dependency-free: at demo/POC volumes
 * the browser does this instantly. In production, radius / polygon queries
 * move to PostGIS (ST_DWithin, ST_Within) and these become UI-only helpers.
 */

const EARTH_RADIUS_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

/** Great-circle distance in km between [lng, lat] pairs. */
export function haversineKm([lng1, lat1], [lng2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Total length of a polyline of [lng, lat] points, in km. */
export function pathLengthKm(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += haversineKm(points[i - 1], points[i]);
  return total;
}

/** Ray-casting point-in-polygon for a single outer ring of [lng, lat]. */
export function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Destination point given start, bearing (deg) and distance (km). */
function destination([lng, lat], bearingDeg, km) {
  const d = km / EARTH_RADIUS_KM;
  const b = toRad(bearingDeg);
  const la1 = toRad(lat);
  const lo1 = toRad(lng);
  const la2 = Math.asin(Math.sin(la1) * Math.cos(d) + Math.cos(la1) * Math.sin(d) * Math.cos(b));
  const lo2 = lo1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la1), Math.cos(d) - Math.sin(la1) * Math.sin(la2));
  return [toDeg(lo2), toDeg(la2)];
}

/** Polygon ring approximating a circle on the ground. */
export function circleRing(center, radiusKm, steps = 64) {
  const ring = [];
  for (let i = 0; i <= steps; i += 1) ring.push(destination(center, (i * 360) / steps, radiusKm));
  return ring;
}

/** Ring for an axis-aligned box from two corner [lng, lat] points. */
export function boxRing([lng1, lat1], [lng2, lat2]) {
  const w = Math.min(lng1, lng2);
  const e = Math.max(lng1, lng2);
  const s = Math.min(lat1, lat2);
  const n = Math.max(lat1, lat2);
  return [[w, s], [e, s], [e, n], [w, n], [w, s]];
}

/**
 * Generalise a coordinate for public display: snap to a grid cell centre.
 * 0.05° ≈ 5.5 km — enough to hide a site's exact spot while keeping the
 * regional pattern a researcher actually needs.
 */
export const PUBLIC_GRID_DEG = 0.05;
export function snapToGrid([lng, lat], cell = PUBLIC_GRID_DEG) {
  const snap = (v) => (Math.floor(v / cell) + 0.5) * cell;
  return [Number(snap(lng).toFixed(4)), Number(snap(lat).toFixed(4))];
}

/** Does a [lng, lat] point satisfy the active spatial selection? */
export function matchesShape(coords, shape) {
  if (!shape || !coords) return true;
  if (shape.kind === 'radius') return haversineKm(coords, shape.center) <= shape.radiusKm;
  if (shape.kind === 'box') return pointInRing(coords, shape.ring);
  return true;
}

/** GeoJSON polygon feature for the active shape (for drawing it). */
export function shapeToFeature(shape) {
  if (!shape) return null;
  const ring = shape.kind === 'radius' ? circleRing(shape.center, shape.radiusKm) : shape.ring;
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} };
}

/** "1,234 km" / "850 m" */
export function formatKm(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('en-IN')} km`;
}

/** -250 → "250 BCE", 1010 → "1010 CE" */
export function formatYear(y) {
  if (y == null || Number.isNaN(y)) return '—';
  return y < 0 ? `${-y} BCE` : `${y} CE`;
}

export function formatYearRange(start, end) {
  if (start == null && end == null) return 'Undated';
  if (start === end) return formatYear(start);
  if (start < 0 && end < 0) return `${-start}–${-end} BCE`;
  if (start >= 0 && end >= 0) return `${start}–${end} CE`;
  return `${formatYear(start)} – ${formatYear(end)}`;
}
