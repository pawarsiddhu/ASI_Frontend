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

/**
 * Default map view — India as a whole.
 *
 * INDIA_CENTER + INDIA_ZOOM are the coarse fallback (roughly the geographic
 * centre near Nagpur at country-scale zoom). The picker uses these as the
 * MapContainer's initial props, then a fitBounds pass with INDIA_BOUNDS
 * tightens the frame so India fills the widget regardless of viewport
 * width. Without the fitBounds step, wide desktop widgets at zoom 5 show
 * a lot of surrounding Asia — which reads as "global-ish" rather than
 * "here's India".
 */
export const INDIA_CENTER = [22.5937, 78.9629];
export const INDIA_ZOOM = 5;

/**
 * Bounding box for the Republic of India — [[south, west], [north, east]].
 * Tuned tight to India's mainland extent (Kanyakumari's tip to Ladakh, Gujarat
 * coast to Arunachal). Chosen small enough that fitBounds produces a zoomed-in
 * frame where India dominates the widget, but large enough to include the
 * Kashmir + Northeast extremes so no record's home region is off-screen at
 * the default view. NOT enforced as maxBounds — operators can still pan to
 * remote sites like Lakshadweep or the Andamans if ever needed.
 */
export const INDIA_BOUNDS = [
  [8.0, 68.5],   // south-west corner (just north of Kanyakumari / Gujarat coast)
  [36.0, 96.5],  // north-east corner (Ladakh / Arunachal)
];

/** Focused view for detail-page reads and after a pin is dropped. */
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