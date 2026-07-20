import L from 'leaflet';

/**
 * Custom pin marker in ASI brand maroon, delivered as a Leaflet DivIcon so we
 * side-step the well-known Vite/Leaflet default-marker asset-URL breakage
 * (leaflet ships its icon URLs as relative paths that bundlers mangle).
 *
 * The pin is a plain SVG. Sizing is chosen so the tip of the pin sits exactly
 * on the coordinate — that's what `iconAnchor: [halfWidth, height]` does.
 */
export const brandPinIcon = L.divIcon({
  className: 'asi-pin-icon',
  html: `
    <svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id="pinShadow" x="-40%" y="-20%" width="180%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path
        d="M14 0C6.268 0 0 6.268 0 14c0 9.5 12.4 24.7 13.1 25.5a1.15 1.15 0 0 0 1.8 0C15.6 38.7 28 23.5 28 14 28 6.268 21.732 0 14 0z"
        fill="#8B1A1A"
        stroke="#5A1010"
        stroke-width="1"
        filter="url(#pinShadow)"
      />
      <circle cx="14" cy="14" r="5" fill="#FBEAEA" stroke="#5A1010" stroke-width="1"/>
    </svg>
  `,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  popupAnchor: [0, -36],
});

/** Default map view — India as a whole, wide zoom so the user picks a region. */
export const INDIA_CENTER = [22.5937, 78.9629];
export const INDIA_ZOOM = 5;

/** Focused view for detail-page reads. */
export const DETAIL_ZOOM = 14;

/**
 * Guard against NaN / out-of-range coordinates before feeding them to Leaflet
 * (Leaflet will happily render at [NaN, NaN] and produce a blank grey map).
 * Empty strings return false — the form uses '' for unset numeric fields.
 */
export function hasValidCoords(lat, lng) {
  const nLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const nLng = typeof lng === 'number' ? lng : parseFloat(lng);
  return (
    Number.isFinite(nLat) &&
    Number.isFinite(nLng) &&
    nLat >= -90 && nLat <= 90 &&
    nLng >= -180 && nLng <= 180
  );
}
