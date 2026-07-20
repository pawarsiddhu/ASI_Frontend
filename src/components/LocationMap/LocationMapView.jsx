import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';

import {
  brandPinIcon,
  DETAIL_ZOOM,
  hasValidCoords,
} from '@utils/leafletSetup';

import styles from './LocationMapView.module.css';

/**
 * LocationMapView — read-only map for a saved record. Static-feel: no drag,
 * no scroll-wheel zoom (which hijacks page scroll on mobile), no double-click
 * zoom. Zoom-in/-out control buttons are retained so a curious viewer can
 * still look around the surroundings — the SoW frames the site's context as
 * something worth showing.
 */
export default function LocationMapView({ latitude, longitude, title }) {
  if (!hasValidCoords(latitude, longitude)) {
    return (
      <div className={styles.missing}>
        <MapPin size={16} />
        <span>No coordinates recorded for this site.</span>
      </div>
    );
  }

  const position = [Number(latitude), Number(longitude)];

  return (
    <div className={styles.wrapper}>
      <div className={styles.mapShell}>
        <MapContainer
          center={position}
          zoom={DETAIL_ZOOM}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={false}
          touchZoom={false}
          keyboard={false}
          className={styles.map}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
          />
          <Marker position={position} icon={brandPinIcon}>
            {title && (
              <Popup>
                <strong>{title}</strong>
                <br />
                <code style={{ fontSize: '11px' }}>
                  {Number(latitude).toFixed(4)}°{latitude >= 0 ? 'N' : 'S'},{' '}
                  {Number(longitude).toFixed(4)}°{longitude >= 0 ? 'E' : 'W'}
                </code>
              </Popup>
            )}
          </Marker>
        </MapContainer>
      </div>
      <p className={styles.attribution}>
        Map data ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenStreetMap contributors
        </a>
      </p>
    </div>
  );
}
