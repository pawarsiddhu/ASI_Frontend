import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { boxRing, circleRing, haversineKm } from '../utils/geo';
import { MUSEUM_COLOR, DISPERSAL_COLOR, SELECTION_COLOR } from '../utils/themes';
import styles from './MapCanvas.module.css';

/**
 * MapCanvas — the only file that talks to MapLibre.
 *
 * React owns all state; this component pushes it into map sources with
 * setData(). Interaction results (clicks, drawn shapes, measure points,
 * camera moves) go back up through callbacks.
 *
 * BASEMAP CAVEAT: demo uses public OpenStreetMap raster tiles (same as the
 * existing BHS location picker). Production must swap BASE_STYLE for a
 * Survey of India–compliant source (Bhuvan / Mappls / self-hosted tiles
 * with corrected boundaries). That's a one-object change below.
 */

const INDIA_BOUNDS = [[67.5, 6.5], [97.5, 36.5]];
const INDIA_CENTER = [82.5, 22.5];
const MAX_BOUNDS = [[50, -10], [115, 48]];

const BASE_STYLE = {
  version: 8,
  // No `glyphs`: count labels are HTML markers (see syncCountLabels), so the
  // map never depends on an external font server. With a symbol layer and an
  // unreachable glyph host, MapLibre drops the whole data tile and the
  // bubbles vanish along with their labels.
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors · demo basemap, not SoI-compliant',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      // Desaturate so the thematic colours carry the meaning, not the basemap.
      paint: { 'raster-saturation': -0.75, 'raster-brightness-min': 0.08, 'raster-contrast': -0.1 },
    },
  ],
};

const EMPTY = { type: 'FeatureCollection', features: [] };

/** Layers that can be clicked / hovered, in priority order. */
const INTERACTIVE = ['bhs-points', 'ant-points', 'museum-circles', 'bhs-clusters'];

function addStaticSources(map) {
  ['ant', 'museums', 'dispersal', 'selected', 'shape', 'draft', 'measure', 'me'].forEach((id) => {
    map.addSource(id, { type: 'geojson', data: EMPTY });
  });
}

function addStaticLayers(map) {
  // Dispersal: findspot → holding museum
  map.addLayer({
    id: 'dispersal-lines',
    type: 'line',
    source: 'dispersal',
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': DISPERSAL_COLOR,
      'line-width': ['interpolate', ['linear'], ['get', 'km'], 5, 0.8, 1500, 2.2],
      'line-opacity': 0.45,
      'line-dasharray': [2, 1.5],
    },
  });

  // Museums ("where held now") — bubble sized by object count
  map.addLayer({
    id: 'museum-circles',
    type: 'circle',
    source: 'museums',
    paint: {
      'circle-color': MUSEUM_COLOR,
      'circle-opacity': 0.82,
      'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 9, 40, 26],
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 2,
    },
  });

  // Antiquities ("where found") — small squares-ish dots so they read
  // differently from BHS circles even in the same colour.
  map.addLayer({
    id: 'ant-points',
    type: 'circle',
    source: 'ant',
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 3.5, 10, 6],
      'circle-stroke-color': '#1A1815',
      'circle-stroke-width': 1,
      'circle-opacity': 0.9,
    },
  });
}

function addBhsLayers(map, cluster, beforeId) {
  map.addSource('bhs', {
    type: 'geojson',
    data: EMPTY,
    cluster,
    clusterRadius: 44,
    clusterMaxZoom: 9,
  });
  map.addLayer(
    {
      id: 'bhs-heat',
      type: 'heatmap',
      source: 'bhs',
      layout: { visibility: 'none' },
      paint: {
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 22, 9, 40],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.9, 9, 2],
        'heatmap-opacity': 0.75,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(251,246,232,0)',
          0.2, '#E8D9A8',
          0.45, '#D48A2E',
          0.7, '#A63D1F',
          1, '#5A1010',
        ],
      },
    },
    beforeId
  );
  map.addLayer(
    {
      id: 'bhs-clusters',
      type: 'circle',
      source: 'bhs',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#8B1A1A',
        'circle-opacity': 0.85,
        'circle-radius': ['step', ['get', 'point_count'], 14, 5, 18, 12, 24],
        'circle-stroke-color': '#FBEAEA',
        'circle-stroke-width': 3,
      },
    },
    beforeId
  );
  map.addLayer(
    {
      id: 'bhs-points',
      type: 'circle',
      source: 'bhs',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 6, 10, 10],
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 2,
      },
    },
    beforeId
  );
}

function removeBhsLayers(map) {
  ['bhs-points', 'bhs-clusters', 'bhs-heat'].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource('bhs')) map.removeSource('bhs');
}

/**
 * Count labels for clusters and museums as HTML markers. Re-run whenever
 * the visible features change (data, camera, visibility).
 */
function createCountLabels(map) {
  const live = new Map(); // key → Marker
  const visible = (id) => map.getLayer(id) && map.getLayoutProperty(id, 'visibility') !== 'none';
  return function sync() {
    const next = new Map();
    const put = (key, coords, text, cls) => {
      let mk = live.get(key);
      if (!mk) {
        const el = document.createElement('div');
        el.className = cls;
        mk = new maplibregl.Marker({ element: el }).setLngLat(coords).addTo(map);
      }
      mk.setLngLat(coords);
      mk.getElement().textContent = text;
      next.set(key, mk);
    };
    if (visible('bhs-clusters') && map.getSource('bhs')) {
      map.querySourceFeatures('bhs').forEach((f) => {
        if (f.properties.cluster) {
          put(`c${f.properties.cluster_id}`, f.geometry.coordinates, f.properties.point_count_abbreviated, styles.clusterLabel);
        }
      });
    }
    if (visible('museum-circles')) {
      map.querySourceFeatures('museums').forEach((f) => {
        put(`m${f.properties.museum_id}`, f.geometry.coordinates, f.properties.count, styles.museumLabel);
      });
    }
    live.forEach((mk, key) => { if (!next.has(key)) mk.remove(); });
    live.clear();
    next.forEach((mk, key) => live.set(key, mk));
  };
}

function addOverlayLayers(map) {
  map.addLayer({
    id: 'selected-line',
    type: 'line',
    source: 'selected',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: { 'line-color': SELECTION_COLOR, 'line-width': 2.5, 'line-dasharray': [2, 1.5] },
  });
  map.addLayer({
    id: 'selected-ring',
    filter: ['==', ['geometry-type'], 'Point'],
    type: 'circle',
    source: 'selected',
    paint: {
      'circle-radius': 15,
      'circle-color': 'rgba(0,0,0,0)',
      'circle-stroke-color': SELECTION_COLOR,
      'circle-stroke-width': 3,
    },
  });
  ['shape', 'draft'].forEach((src) => {
    map.addLayer({
      id: `${src}-fill`,
      type: 'fill',
      source: src,
      paint: { 'fill-color': '#8B1A1A', 'fill-opacity': src === 'draft' ? 0.12 : 0.07 },
    });
    map.addLayer({
      id: `${src}-line`,
      type: 'line',
      source: src,
      paint: { 'line-color': '#8B1A1A', 'line-width': 2, 'line-dasharray': src === 'draft' ? [2, 2] : [1, 0] },
    });
  });
  // "You are here" (Near me)
  map.addLayer({
    id: 'me-halo',
    type: 'circle',
    source: 'me',
    paint: { 'circle-radius': 16, 'circle-color': '#2563EB', 'circle-opacity': 0.18 },
  });
  map.addLayer({
    id: 'me-dot',
    type: 'circle',
    source: 'me',
    paint: { 'circle-radius': 6, 'circle-color': '#2563EB', 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2 },
  });
  map.addLayer({
    id: 'measure-line',
    type: 'line',
    source: 'measure',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: { 'line-color': '#1A1815', 'line-width': 2.5, 'line-dasharray': [1.5, 1] },
  });
  map.addLayer({
    id: 'measure-points',
    type: 'circle',
    source: 'measure',
    filter: ['==', ['geometry-type'], 'Point'],
    paint: { 'circle-radius': 5, 'circle-color': '#FFFFFF', 'circle-stroke-color': '#1A1815', 'circle-stroke-width': 2 },
  });
}

export default function MapCanvas({
  data,
  layers,
  selected,
  shapeFeature,
  measurePoints,
  userLocation,
  tool,
  flyRequest,
  initialView,
  onSelect,
  onClearSelection,
  onShapeDrawn,
  onMeasureAdd,
  onViewChange,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const labelsRef = useRef(() => {});

  // Latest props for event handlers registered once.
  const live = useRef({});
  live.current = { tool, onSelect, onClearSelection, onShapeDrawn, onMeasureAdd, onViewChange };

  // ---------- create map once ----------
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      // Start from a fixed camera. Fitting `bounds` / applying `maxBounds` in
      // the constructor throws "failed to invert matrix" if the container has
      // no size yet — both are applied on load instead.
      center: initialView?.center ?? INDIA_CENTER,
      zoom: initialView?.zoom ?? 4,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;
    // Dev-only handle for poking at the map from the console.
    if (import.meta.env.DEV) window.__asiMap = map;
    map.touchZoomRotate.disableRotation();
    const syncLabels = createCountLabels(map);
    labelsRef.current = syncLabels;
    map.on('sourcedata', (e) => {
      if ((e.sourceId === 'bhs' || e.sourceId === 'museums') && e.isSourceLoaded) syncLabels();
    });
    map.on('moveend', syncLabels);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-left');

    let tileErrors = 0;
    map.on('error', (e) => {
      if (e?.sourceId === 'osm' || /tile/i.test(e?.error?.message || '')) {
        tileErrors += 1;
        if (tileErrors > 6) setTilesFailed(true);
      }
    });

    // 'style.load', not 'load': 'load' waits for the first basemap tiles,
    // so on a slow or firewalled tile server the records wouldn't appear
    // until those requests time out. Our data must not depend on the basemap.
    map.once('style.load', () => {
      const { clientWidth, clientHeight } = map.getContainer();
      if (clientWidth > 0 && clientHeight > 0) {
        if (!initialView) map.fitBounds(INDIA_BOUNDS, { padding: 20, animate: false });
        map.setMaxBounds(MAX_BOUNDS);
      }
      addStaticSources(map);
      addStaticLayers(map);
      addBhsLayers(map, false);
      addOverlayLayers(map);
      setReady(true);
    });

    // ---------- hover tooltip ----------
    const tip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: styles.tip });
    const onEnter = (e) => {
      if (live.current.tool !== 'pan') return;
      map.getCanvas().style.cursor = 'pointer';
      const f = e.features?.[0];
      if (!f) return;
      const p = f.properties;
      let html;
      if (p.cluster) html = `<strong>${p.point_count} sites</strong><br/><span>Click to zoom in</span>`;
      else if (p.kind === 'museum') html = `<strong>${p.title}</strong><br/><span>${p.count} object(s) in current result</span>`;
      else html = `<strong>${p.title}</strong><br/><span>${p.kind === 'bhs' ? 'Built heritage' : 'Antiquity — findspot'}</span>`;
      tip.setLngLat(f.geometry.coordinates).setHTML(html).addTo(map);
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = live.current.tool === 'pan' ? '' : 'crosshair';
      tip.remove();
    };
    // Registered after style load, once the layers exist (delegated listeners
    // query by layer id and error if the layer isn't in the style yet).
    map.once('style.load', () => {
      INTERACTIVE.forEach((id) => {
        map.on('mousemove', id, onEnter);
        map.on('mouseleave', id, onLeave);
      });
    });

    // ---------- click: select / zoom cluster / clear ----------
    map.on('click', async (e) => {
      const t = live.current.tool;
      if (t === 'measure') {
        live.current.onMeasureAdd?.([e.lngLat.lng, e.lngLat.lat]);
        return;
      }
      if (t !== 'pan') return;
      const present = INTERACTIVE.filter((id) => map.getLayer(id));
      const hits = map.queryRenderedFeatures(e.point, { layers: present });
      if (!hits.length) {
        live.current.onClearSelection?.();
        return;
      }
      // Pick by explicit priority, not draw order: a museum bubble is large
      // and deliberate, so it wins over a site dot sitting underneath it.
      const PRIORITY = ['museum-circles', 'bhs-points', 'ant-points', 'bhs-clusters'];
      const f = [...hits].sort((a, b) => PRIORITY.indexOf(a.layer.id) - PRIORITY.indexOf(b.layer.id))[0];
      if (f.layer.id === 'bhs-clusters') {
        const zoom = await map.getSource('bhs').getClusterExpansionZoom(f.properties.cluster_id);
        map.easeTo({ center: f.geometry.coordinates, zoom });
        return;
      }
      if (f.layer.id === 'museum-circles') {
        live.current.onSelect?.({ kind: 'museum', id: f.properties.museum_id });
        return;
      }
      live.current.onSelect?.({ kind: f.properties.kind, id: f.properties.id });
    });

    // ---------- drag-to-draw (box / radius) ----------
    let start = null;
    const draftFeature = (a, b, kind) => {
      const ring = kind === 'radius' ? circleRing(a, Math.max(haversineKm(a, b), 0.1)) : boxRing(a, b);
      return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ring] }, properties: {} };
    };
    map.on('mousedown', (e) => {
      const t = live.current.tool;
      if (t !== 'box' && t !== 'radius') return;
      e.preventDefault();
      map.dragPan.disable();
      start = [e.lngLat.lng, e.lngLat.lat];
    });
    map.on('mousemove', (e) => {
      if (!start) return;
      const t = live.current.tool;
      const cur = [e.lngLat.lng, e.lngLat.lat];
      map.getSource('draft')?.setData({ type: 'FeatureCollection', features: [draftFeature(start, cur, t)] });
    });
    map.on('mouseup', (e) => {
      if (!start) return;
      const t = live.current.tool;
      const end = [e.lngLat.lng, e.lngLat.lat];
      map.getSource('draft')?.setData(EMPTY);
      map.dragPan.enable();
      const a = start;
      start = null;
      if (t === 'radius') {
        const radiusKm = Math.max(1, haversineKm(a, end));
        live.current.onShapeDrawn?.({ kind: 'radius', center: a, radiusKm });
      } else {
        const bounds = [Math.min(a[0], end[0]), Math.min(a[1], end[1]), Math.max(a[0], end[0]), Math.max(a[1], end[1])];
        // Ignore accidental clicks with no drag
        if (bounds[2] - bounds[0] < 0.01 || bounds[3] - bounds[1] < 0.01) return;
        live.current.onShapeDrawn?.({ kind: 'box', bounds, ring: boxRing([bounds[0], bounds[1]], [bounds[2], bounds[3]]) });
      }
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      live.current.onViewChange?.({ center: [c.lng, c.lat], zoom: map.getZoom() });
    });

    return () => {
      tip.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- cluster toggle: rebuild BHS source ----------
  const clusterRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || clusterRef.current === layers.cluster) return;
    clusterRef.current = layers.cluster;
    removeBhsLayers(map);
    addBhsLayers(map, layers.cluster, 'selected-ring');
    map.getSource('bhs').setData(data.bhsFC);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, layers.cluster]);

  // ---------- push data ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource('bhs')?.setData(data.bhsFC);
    map.getSource('ant')?.setData(data.antFoundFC);
    map.getSource('museums')?.setData(data.museumsFC);
    map.getSource('dispersal')?.setData(data.dispersalFC);
  }, [ready, data, layers.cluster]);

  // ---------- layer visibility ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const vis = (id, on) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    const bhsOn = layers.showBhs && !layers.heat;
    vis('bhs-points', bhsOn);
    vis('bhs-clusters', bhsOn);
    vis('bhs-heat', layers.showBhs && layers.heat);
    vis('ant-points', layers.showAnt && layers.antMode === 'found');
    vis('museum-circles', layers.showAnt && (layers.antMode === 'held' || layers.dispersal));
    vis('dispersal-lines', layers.showAnt && layers.dispersal);
    labelsRef.current();
  }, [ready, layers]);

  // ---------- selection ring ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const features = [];
    if (selected?.coords) {
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: selected.coords }, properties: {} });
    }
    // Antiquity: also trace findspot → holding museum
    if (selected?.coords && selected.heldAt) {
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [selected.coords, selected.heldAt] }, properties: {} });
    }
    map.getSource('selected')?.setData({ type: 'FeatureCollection', features });
  }, [ready, selected]);

  // ---------- active shape ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource('shape')?.setData(shapeFeature ? { type: 'FeatureCollection', features: [shapeFeature] } : EMPTY);
  }, [ready, shapeFeature]);

  // ---------- measure ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const features = measurePoints.map((c) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {} }));
    if (measurePoints.length > 1) {
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: measurePoints }, properties: {} });
    }
    map.getSource('measure')?.setData({ type: 'FeatureCollection', features });
  }, [ready, measurePoints]);

  // ---------- user location ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource('me')?.setData(
      userLocation
        ? { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: userLocation }, properties: {} }] }
        : EMPTY
    );
  }, [ready, userLocation]);

  // ---------- cursor per tool ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = tool === 'pan' ? '' : 'crosshair';
    if (tool === 'pan') map.doubleClickZoom.enable();
    else map.doubleClickZoom.disable();
  }, [tool]);

  // ---------- fly requests ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !flyRequest) return;
    if (flyRequest.bounds) map.fitBounds(flyRequest.bounds, { padding: 60, maxZoom: 9, duration: 900 });
    else map.flyTo({ center: flyRequest.center, zoom: Math.max(map.getZoom(), flyRequest.zoom ?? 9), duration: 900 });
  }, [ready, flyRequest]);

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} aria-label="Interactive heritage map" role="region" />
      {tilesFailed && (
        <div className={styles.tileWarning} role="status">
          Basemap tiles aren’t loading (network or firewall). Records still plot correctly.
        </div>
      )}
    </div>
  );
}
