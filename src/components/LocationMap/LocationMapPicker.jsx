import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Crosshair, X, Loader2 } from 'lucide-react';

import Button from '@components/Button';
import {
  brandPinIcon,
  INDIA_CENTER,
  INDIA_ZOOM,
  DETAIL_ZOOM,
  hasValidCoords,
} from '@utils/leafletSetup';
import { reverseGeocode } from '@utils/reverseGeocode';

import styles from './LocationMapPicker.module.css';

/**
 * ClickHandler — subscribes to map clicks and forwards the picked coord to the
 * parent. Split out because useMapEvents can only be called inside a component
 * rendered as a child of MapContainer.
 */
function ClickHandler({ onPick, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * ExternalSync — when the parent form pushes new lat/lng in (user typed into
 * the number inputs), smoothly recenter the map. Skips the initial mount and
 * skips any change that originated from the map itself (compared against a
 * ref of the last value the picker emitted).
 */
function ExternalSync({ latitude, longitude, lastEmittedRef }) {
  const map = useMap();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!hasValidCoords(latitude, longitude)) return;

    const last = lastEmittedRef.current;
    if (last && Math.abs(last.lat - latitude) < 1e-6 && Math.abs(last.lng - longitude) < 1e-6) {
      return; // change came from the map itself — don't fight our own event
    }
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), DETAIL_ZOOM), {
      duration: 0.6,
    });
  }, [latitude, longitude, map, lastEmittedRef]);

  return null;
}

/**
 * LocationMapPicker — click-to-pin + drag-to-adjust map, controlled from the
 * outside.
 *
 * Emits two callbacks:
 *   - onChange({latitude, longitude})  — synchronous, on every pin move
 *   - onLocationResolved({state, district}) — asynchronous, after reverse-
 *     geocoding. Fires with empty strings when coords go invalid or geocoding
 *     comes back empty, so the caller can safely mirror the values into form
 *     state without further checks.
 *
 * Geocoding is triggered by a useEffect that watches lat/lng regardless of
 * source (pin drop OR user typing into sibling inputs), debounced by 400ms.
 * Any in-flight request is aborted when coords change again — so a fast
 * dragger doesn't stack up requests.
 */
export default function LocationMapPicker({
  latitude,
  longitude,
  onChange,
  onLocationResolved,
  disabled = false,
  helperText,
  label = 'Pin on map',
}) {
  const hasPin = hasValidCoords(latitude, longitude);
  const lastEmittedRef = useRef(null);
  const [rerender, setRerender] = useState(0);

  // Local mirror of the last successful geocode result — used only for the
  // in-map overlay ("· District, State"). Parent owns the canonical values.
  const [resolved, setResolved] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Ref-mirror the callback so the geocode effect doesn't re-fire every time
  // the parent re-renders with a new inline arrow function.
  const onLocationResolvedRef = useRef(onLocationResolved);
  useEffect(() => {
    onLocationResolvedRef.current = onLocationResolved;
  }, [onLocationResolved]);

  const emit = (lat, lng) => {
    const rounded = { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
    lastEmittedRef.current = rounded;
    onChange?.({ latitude: rounded.lat, longitude: rounded.lng });
  };

  const handleClear = () => {
    lastEmittedRef.current = null;
    setResolved(null);
    onChange?.({ latitude: '', longitude: '' });
    onLocationResolvedRef.current?.({ state: '', district: '' });
    setRerender((n) => n + 1); // force MapContainer remount so view resets
  };

  // ---- Reverse-geocode effect ------------------------------------------------
  // Watches lat/lng. Fires on any valid change (pin OR manual typing). Debounces
  // 400ms. Aborts previous in-flight requests. Silently no-ops on failure —
  // geocoding is convenience, not workflow-critical.
  useEffect(() => {
    if (!hasValidCoords(latitude, longitude)) {
      setResolved(null);
      onLocationResolvedRef.current?.({ state: '', district: '' });
      return;
    }

    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setIsGeocoding(true);
      try {
        const result = await reverseGeocode(latitude, longitude, {
          signal: abort.signal,
        });
        if (abort.signal.aborted) return;
        setResolved(result);
        onLocationResolvedRef.current?.(result);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        // eslint-disable-next-line no-console
        console.warn('[LocationMapPicker] reverse geocode failed:', err);
        setResolved({ state: '', district: '' });
      } finally {
        if (!abort.signal.aborted) setIsGeocoding(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [latitude, longitude]);

  const initialCenter = hasPin ? [latitude, longitude] : INDIA_CENTER;
  const initialZoom = hasPin ? DETAIL_ZOOM : INDIA_ZOOM;

  const resolvedText =
    resolved && (resolved.district || resolved.state)
      ? [resolved.district, resolved.state].filter(Boolean).join(', ')
      : null;

  return (
    <div className={styles.wrapper} aria-label={label}>
      <div className={styles.header}>
        <div className={styles.headerLabel}>
          <MapPin size={14} />
          <span>{label}</span>
        </div>
        {helperText && !hasPin && (
          <span className={styles.helperText}>{helperText}</span>
        )}
      </div>

      <div className={`${styles.mapShell} ${disabled ? styles.disabled : ''}`}>
        <MapContainer
          key={`picker-${rerender}`}
          center={initialCenter}
          zoom={initialZoom}
          scrollWheelZoom
          className={styles.map}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
          />
          <ClickHandler onPick={emit} disabled={disabled} />
          <ExternalSync
            latitude={typeof latitude === 'number' ? latitude : parseFloat(latitude)}
            longitude={typeof longitude === 'number' ? longitude : parseFloat(longitude)}
            lastEmittedRef={lastEmittedRef}
          />
          {hasPin && (
            <Marker
              position={[latitude, longitude]}
              icon={brandPinIcon}
              draggable={!disabled}
              eventHandlers={{
                dragend(e) {
                  const { lat, lng } = e.target.getLatLng();
                  emit(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>

        {/* Floating instruction / readout overlay */}
        <div className={styles.overlay} data-hasPin={hasPin ? 'true' : 'false'}>
          {hasPin ? (
            <>
              <div className={styles.coordReadout}>
                <Crosshair size={12} />
                <code>
                  {Number(latitude).toFixed(4)}°{latitude >= 0 ? 'N' : 'S'}
                  {', '}
                  {Number(longitude).toFixed(4)}°{longitude >= 0 ? 'E' : 'W'}
                </code>
                {isGeocoding && (
                  <span className={styles.geocodeStatus}>
                    <Loader2 size={11} className={styles.spin} />
                    Resolving location…
                  </span>
                )}
                {!isGeocoding && resolvedText && (
                  <span className={styles.geocodeResolved}>· {resolvedText}</span>
                )}
                {!isGeocoding && resolved && !resolvedText && (
                  <span className={styles.geocodeUnknown}>· Location not identified</span>
                )}
              </div>
              {!disabled && (
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<X size={12} />}
                  onClick={handleClear}
                  className={styles.clearBtn}
                >
                  Clear pin
                </Button>
              )}
            </>
          ) : (
            <div className={styles.hint}>
              <MapPin size={12} />
              <span>Click anywhere on the map to drop a pin. Drag it to fine-tune.</span>
            </div>
          )}
        </div>
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
        {' · '}
        Geocoding by{' '}
        <a
          href="https://nominatim.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Nominatim
        </a>
      </p>
    </div>
  );
}
