import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Hand, SquareDashed, CircleDashed, Ruler, X, FileJson, FileSpreadsheet, Link2, Info, LocateFixed,
  SlidersHorizontal,
} from 'lucide-react';

import Spinner from '@components/Spinner';
import Button from '@components/Button';
import EmptyState from '@components/EmptyState';
import { useToast } from '@components/Toast';
import PageHeader from '@features/dashboard/components/PageHeader';

import MapCanvas from './components/MapCanvas';
import FilterPanel from './components/FilterPanel';
import TimeSlider from './components/TimeSlider';
import Legend from './components/Legend';
import DetailPanel from './components/DetailPanel';
import ResultsTable from './components/ResultsTable';
import PlaceSearch from './components/PlaceSearch';
import { StoryMenu, StoryCard } from './components/StoryPlayer';

import {
  useGetMapMastersQuery,
  useGetMapFeaturesQuery,
  useGetPublicMapMastersQuery,
  useGetPublicMapFeaturesQuery,
} from './mapApi';
import { useMapUrlState, TIME_MIN, TIME_MAX } from './hooks/useMapUrlState';
import { buildTheme, THEME_OPTIONS } from './utils/themes';
import { runFilters } from './utils/filterFeatures';
import { exportGeoJSON, exportCsv } from './utils/exportGeo';
import { parseQuery } from './utils/smartSearch';
import { STORIES } from './utils/stories';
import { circleRing, formatKm, haversineKm, pathLengthKm, shapeToFeature, snapToGrid } from './utils/geo';

import styles from './MapExplorerPage.module.css';

const TOOLS = [
  { id: 'pan', label: 'Select / pan', icon: Hand },
  { id: 'box', label: 'Draw box', icon: SquareDashed },
  { id: 'radius', label: 'Draw radius', icon: CircleDashed },
  { id: 'measure', label: 'Measure', icon: Ruler },
];

const TOOL_HINT = {
  box: 'Drag on the map to select everything inside a box.',
  radius: 'Press at a centre point and drag outwards to set the radius.',
  measure: 'Click points along a path. Distance is great-circle.',
};

const nameMap = (arr, key = 'id') => Object.fromEntries((arr || []).map((x) => [x[key], x.name]));

function countActiveFilters(s) {
  let n = 0;
  ['periods', 'affiliations', 'protection', 'statuses'].forEach((k) => { n += s[k].length ? 1 : 0; });
  ['category', 'dynasty', 'state', 'circle', 'q'].forEach((k) => { n += s[k] ? 1 : 0; });
  if (s.from !== TIME_MIN || s.to !== TIME_MAX) n += 1;
  if (s.shape) n += 1;
  return n;
}

/** Browsers only allow geolocation on https:// or localhost. */
const CAN_LOCATE = typeof window !== 'undefined' && window.isSecureContext && 'geolocation' in navigator;
const NEAR_ME_KM = 50;

/** Everything a fresh search / story step clears. Layers + camera are separate. */
const FILTER_RESET = {
  periods: [], affiliations: [], protection: [], statuses: [],
  category: '', dynasty: '', state: '', circle: '', q: '',
  from: TIME_MIN, to: TIME_MAX, shape: null,
};
const LAYER_DEFAULTS = { showBhs: true, showAnt: true, antMode: 'found', dispersal: false, cluster: false, heat: false };

/**
 * MapExplorerPage
 *   mode="staff"  → /map inside the portal (login). All statuses, exact
 *                   locations, restricted fields, plus a public-view preview.
 *   mode="public" → /explore for visitors (no login). Reads the /public API,
 *                   which only returns safe, published data.
 */
export default function MapExplorerPage({ mode = 'staff' }) {
  const isPublic = mode === 'public';
  const toast = useToast();
  const { state, update, reset, initialView } = useMapUrlState();
  const [tool, setTool] = useState('pan');
  const [measurePoints, setMeasurePoints] = useState([]);
  const [fly, setFly] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [story, setStory] = useState(null); // { id, step, text }
  const [filtersOpen, setFiltersOpen] = useState(false); // phones only
  const publicMode = isPublic || state.pub;
  const pageClass = isPublic ? `${styles.page} ${styles.pagePublic}` : styles.page;

  // Hooks can't be conditional, so both sets are declared and one is skipped.
  const staffMasters = useGetMapMastersQuery(undefined, { skip: isPublic });
  const staffBhs = useGetMapFeaturesQuery('bhs', { skip: isPublic });
  const staffAnt = useGetMapFeaturesQuery('antiquities', { skip: isPublic });
  const pubMasters = useGetPublicMapMastersQuery(undefined, { skip: !isPublic });
  const pubBhs = useGetPublicMapFeaturesQuery('bhs', { skip: !isPublic });
  const pubAnt = useGetPublicMapFeaturesQuery('antiquities', { skip: !isPublic });
  const mastersQ = isPublic ? pubMasters : staffMasters;
  const bhsQ = isPublic ? pubBhs : staffBhs;
  const antQ = isPublic ? pubAnt : staffAnt;
  const masters = mastersQ.data;
  const bhsFC = bhsQ.data;
  const antFC = antQ.data;

  const themeOptions = useMemo(
    () => (publicMode ? THEME_OPTIONS.filter((t) => t.value !== 'status') : THEME_OPTIONS),
    [publicMode]
  );
  const themeId = themeOptions.some((t) => t.value === state.theme) ? state.theme : 'period';
  const theme = useMemo(() => ({ ...buildTheme(themeId, masters), id: themeId }), [themeId, masters]);
  const periodTheme = useMemo(() => buildTheme('period', masters), [masters]);

  // ---------- the one filter pass ----------
  const filters = useMemo(() => ({
    showBhs: state.showBhs,
    showAnt: state.showAnt,
    periods: state.periods,
    affiliations: state.affiliations,
    protection: state.protection,
    statuses: state.statuses,
    category: state.category,
    dynasty: state.dynasty,
    state: state.state,
    circle: state.circle,
    q: state.q,
    from: state.from,
    to: state.to,
    shape: state.shape,
  }), [state]);

  const result = useMemo(
    () => runFilters({ bhsFC, antFC, masters, filters, theme, publicMode }),
    [bhsFC, antFC, masters, filters, theme, publicMode]
  );

  // Same pass minus the time window → feeds the slider histogram
  const timeless = useMemo(
    () => runFilters({ bhsFC, antFC, masters, filters: { ...filters, from: -1e9, to: 1e9 }, theme, publicMode }),
    [bhsFC, antFC, masters, filters, theme, publicMode]
  );
  const timelessRecords = useMemo(() => [...timeless.bhs, ...timeless.ant], [timeless]);

  // ---------- lookups over the FULL dataset ----------
  const lookup = useMemo(() => {
    if (!masters || !bhsFC || !antFC) return null;
    const museum = Object.fromEntries(masters.museums.map((m) => [m.id, m]));
    const visible = (p) => !publicMode || p.status === 'PUBLISHED';
    const bhsById = {};
    bhsFC.features.forEach((f) => { bhsById[f.id] = { ...f.properties, _rawCoords: f.geometry.coordinates }; });
    const antById = {};
    const antBySite = {};
    const antByMuseum = {};
    antFC.features.forEach((f) => {
      const p = f.properties;
      const raw = f.geometry?.coordinates || null;
      const m = museum[p.museum_id];
      const heldAt = m ? [m.longitude, m.latitude] : null;
      const rec = { ...p, _rawFind: raw, _movedKm: raw && heldAt ? haversineKm(raw, heldAt) : null };
      antById[p.id] = rec;
      if (!visible(p)) return;
      if (p.bhs_id) (antBySite[p.bhs_id] ||= []).push(rec);
      (antByMuseum[p.museum_id] ||= []).push(rec);
    });
    return {
      period: nameMap(masters.periods),
      dynasty: nameMap(masters.dynasties),
      category: nameMap(masters.categories),
      affiliation: nameMap(masters.cultural_affiliations),
      material: nameMap(masters.materials),
      precision: nameMap(masters.location_precisions),
      protection: nameMap(masters.protection_levels),
      discovery: nameMap(masters.discovery_types),
      source: Object.fromEntries(masters.sources.map((s) => [s.id, `${s.title} (${s.year})`])),
      museum,
      bhsById,
      antById,
      antBySite,
      antByMuseum,
    };
  }, [masters, bhsFC, antFC, publicMode]);

  const visibleIds = useMemo(() => ({
    bhs: new Set(result.bhs.map((r) => r.id)),
    ant: new Set(result.ant.map((r) => r.id)),
  }), [result]);

  // ---------- selection ----------
  const selection = useMemo(() => {
    if (!state.sel || !lookup) return null;
    const [kind, id] = state.sel.split(':');
    if (kind === 'bhs' && lookup.bhsById[id]) return { kind, record: lookup.bhsById[id] };
    if (kind === 'ant' && lookup.antById[id]) return { kind, record: lookup.antById[id] };
    if (kind === 'museum' && lookup.museum[id]) return { kind, record: lookup.museum[id] };
    return null;
  }, [state.sel, lookup]);

  const selectedCoords = useMemo(() => {
    if (!selection) return null;
    const { kind, record: r } = selection;
    if (kind === 'museum') return [r.longitude, r.latitude];
    const raw = kind === 'bhs' ? r._rawCoords : r._rawFind;
    if (!raw) return null;
    return publicMode && r.display_precision === 'approximate' ? snapToGrid(raw) : raw;
  }, [selection, publicMode]);

  const handleSelect = useCallback(({ kind, id, fly: shouldFly }) => {
    update({ sel: `${kind}:${id}` });
    if (!shouldFly || !lookup) return;
    let c = null;
    if (kind === 'bhs') c = lookup.bhsById[id]?._rawCoords;
    if (kind === 'ant') c = lookup.antById[id]?._rawFind;
    if (c) setFly({ center: c, zoom: 9, key: Date.now() });
  }, [update, lookup]);

  // Links inside the detail panel always fly
  const selectAndFly = useCallback((s) => handleSelect({ ...s, fly: true }), [handleSelect]);

  const handleRadius = useCallback((center, radiusKm) => {
    update({ shape: { kind: 'radius', center, radiusKm } });
    const ring = circleRing(center, radiusKm, 16);
    const lngs = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    setFly({ bounds: [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], key: Date.now() });
  }, [update]);

  const handleShapeDrawn = useCallback((shape) => {
    update({ shape });
    setTool('pan');
  }, [update]);

  const handleView = useCallback((view) => update({ view }), [update]);
  const handleMeasureAdd = useCallback((c) => setMeasurePoints((p) => [...p, c]), []);
  const clearSelection = useCallback(() => update({ sel: null }), [update]);

  // A measurement only lives while the measure tool is active
  useEffect(() => {
    if (tool !== 'measure') setMeasurePoints([]);
  }, [tool]);

  // Escape: leave the current tool, then clear the selection
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (tool !== 'pan') setTool('pan');
      else if (state.sel) update({ sel: null });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tool, state.sel, update]);

  const shapeFeature = useMemo(() => shapeToFeature(state.shape), [state.shape]);
  const mapData = useMemo(() => ({
    bhsFC: result.bhsFC,
    antFoundFC: result.antFoundFC,
    museumsFC: result.museumsFC,
    dispersalFC: result.dispersalFC,
  }), [result]);
  const layers = useMemo(() => ({
    showBhs: state.showBhs,
    showAnt: state.showAnt,
    antMode: state.antMode,
    dispersal: state.dispersal,
    cluster: state.cluster,
    heat: state.heat,
  }), [state.showBhs, state.showAnt, state.antMode, state.dispersal, state.cluster, state.heat]);
  const selected = useMemo(() => {
    if (!selectedCoords) return null;
    let heldAt = null;
    if (selection?.kind === 'ant') {
      const m = lookup.museum[selection.record.museum_id];
      if (m) heldAt = [m.longitude, m.latitude];
    }
    return { coords: selectedCoords, heldAt };
  }, [selectedCoords, selection, lookup]);

  // ---------- find box: everything the viewer can see ----------
  const searchIndex = useMemo(() => {
    if (!lookup) return [];
    const items = [];
    const places = { state: {}, district: {} };
    const addPlace = (kind, name, coords, parent) => {
      if (!name || !coords) return;
      const key = parent ? `${name}|${parent}` : name;
      (places[kind][key] ||= { name, parent, pts: [] }).pts.push(coords);
    };
    Object.values(lookup.bhsById).forEach((r) => {
      if (publicMode && r.status !== 'PUBLISHED') return;
      items.push({ kind: 'bhs', id: r.id, label: r.title, sub: [r.district, r.state].filter(Boolean).join(', '), alt: [r.bh_code] });
      addPlace('state', r.state, r._rawCoords);
      addPlace('district', r.district, r._rawCoords, r.state);
    });
    Object.values(lookup.antById).forEach((r) => {
      if (publicMode && r.status !== 'PUBLISHED') return;
      items.push({ kind: 'ant', id: r.id, label: r.title, sub: [lookup.category[r.category_id], r.key_no].join(' · '), alt: [r.key_no] });
      addPlace('state', r.state, r._rawFind);
    });
    Object.values(lookup.museum).forEach((m) => {
      items.push({ kind: 'museum', id: m.id, label: m.name, sub: 'Holding museum', coords: [m.longitude, m.latitude] });
    });
    ['state', 'district'].forEach((kind) => {
      Object.values(places[kind]).forEach((p) => {
        const lngs = p.pts.map((c) => c[0]);
        const lats = p.pts.map((c) => c[1]);
        items.push({
          kind,
          id: p.parent ? `${p.name}|${p.parent}` : p.name,
          label: p.name,
          sub: kind === 'district' ? p.parent : `${p.pts.length} record(s)`,
          bounds: [[Math.min(...lngs) - 0.15, Math.min(...lats) - 0.15], [Math.max(...lngs) + 0.15, Math.max(...lats) + 0.15]],
        });
      });
    });
    return items;
  }, [lookup, publicMode]);

  const handlePick = useCallback((item) => {
    if (item.kind === 'bhs' || item.kind === 'ant') {
      handleSelect({ kind: item.kind, id: item.id, fly: true });
      if (item.kind === 'ant' && !lookup.antById[item.id]?._rawFind) {
        toast.info('This object’s findspot is unknown. Showing its details only.');
      }
    } else if (item.kind === 'museum') {
      update({ sel: `museum:${item.id}` });
      setFly({ center: item.coords, zoom: 10, key: Date.now() });
    } else {
      setFly({ bounds: item.bounds, key: Date.now() });
    }
  }, [handleSelect, lookup, toast, update]);

  const nearMe = (radiusKm = NEAR_ME_KM) => {
    if (!CAN_LOCATE) {
      toast.warning('Your location is only available on a secure (https) connection.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const here = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(here);
        handleRadius(here, radiusKm);
        toast.success(`Showing everything within ${radiusKm} km of you.`);
      },
      (err) => {
        setLocating(false);
        toast.warning(err.code === 1 ? 'Location permission was denied.' : 'Couldn’t get your location.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  // ---------- smart search (rule-based; see utils/smartSearch.js) ----------
  const places = useMemo(() => {
    if (!lookup) return [];
    const list = Object.values(lookup.bhsById)
      .filter((b) => !publicMode || b.status === 'PUBLISHED')
      .map((b) => ({ name: b.title, coords: b._rawCoords }));
    Object.values(lookup.museum).forEach((m) => list.push({ name: m.name, coords: [m.longitude, m.latitude] }));
    searchIndex
      .filter((i) => i.kind === 'district')
      .forEach((d) => list.push({
        name: d.label,
        coords: [(d.bounds[0][0] + d.bounds[1][0]) / 2, (d.bounds[0][1] + d.bounds[1][1]) / 2],
      }));
    return list;
  }, [lookup, publicMode, searchIndex]);

  const parse = useCallback((text) => parseQuery(text, { masters, places }), [masters, places]);

  const handleSmart = useCallback((r) => {
    setStory(null);
    update({ ...FILTER_RESET, ...LAYER_DEFAULTS, ...r.filters, ...r.layers, sel: null });
    if (r.near) {
      handleRadius(r.near.coords, r.near.radiusKm);
    } else if (r.nearMe) {
      nearMe(r.nearMe.radiusKm);
    } else if (r.filters.state) {
      const st = searchIndex.find((i) => i.kind === 'state' && i.label === r.filters.state);
      if (st) setFly({ bounds: st.bounds, key: Date.now() });
    }
    toast.info(`Showing: ${r.chips.join(' · ')}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, handleRadius, searchIndex, toast]);

  // ---------- guided stories ----------
  const storyDef = story ? STORIES.find((x) => x.id === story.id) : null;

  const goToStep = useCallback((id, step) => {
    const def = STORIES.find((x) => x.id === id);
    const st = def?.steps[step];
    if (!st || !lookup) return;
    setTool('pan');
    update({ ...FILTER_RESET, ...LAYER_DEFAULTS, ...(st.filters || {}), ...(st.layers || {}), sel: null });

    let ctx = null;
    if (st.site) {
      const b = Object.values(lookup.bhsById).find((x) => x.title === st.site);
      if (b) {
        update({ sel: `bhs:${b.id}` });
        setFly({ center: b._rawCoords, zoom: 8, key: Date.now() });
      }
    } else if (st.focus === 'farthest-object') {
      const best = Object.values(lookup.antById)
        .filter((a) => a._rawFind && a._movedKm != null && (!publicMode || a.status === 'PUBLISHED'))
        .sort((a, b) => b._movedKm - a._movedKm)[0];
      if (best) {
        const m = lookup.museum[best.museum_id];
        update({ sel: `ant:${best.id}` });
        const pts = [best._rawFind, [m.longitude, m.latitude]];
        setFly({
          bounds: [
            [Math.min(pts[0][0], pts[1][0]), Math.min(pts[0][1], pts[1][1])],
            [Math.max(pts[0][0], pts[1][0]), Math.max(pts[0][1], pts[1][1])],
          ],
          key: Date.now(),
        });
        ctx = { title: best.title, km: formatKm(best._movedKm), museum: m.name };
      }
    } else if (st.bounds) {
      setFly({ bounds: st.bounds, key: Date.now() });
    }
    const text = typeof st.text === 'function' ? st.text(ctx) : st.text;
    setStory({ id, step, text });
  }, [lookup, update, publicMode]);

  const exitStory = useCallback(() => setStory(null), []);
  const nextStep = useCallback(() => {
    if (!story) return;
    if (story.step < storyDef.steps.length - 1) goToStep(story.id, story.step + 1);
    else setStory(null);
  }, [story, storyDef, goToStep]);
  const prevStep = useCallback(() => {
    if (story && story.step > 0) goToStep(story.id, story.step - 1);
  }, [story, goToStep]);

  const activeFilterCount = countActiveFilters(state);
  const resetFilters = () => {
    reset();
    setMeasurePoints([]);
  };

  const doExport = (fmt) => {
    const args = { bhs: result.bhs, ant: result.ant, publicMode };
    if (!args.bhs.length && !args.ant.length) {
      toast.warning('Nothing to export — the current result is empty.');
      return;
    }
    const n = fmt === 'geojson' ? exportGeoJSON(args) : exportCsv(args);
    toast.success(`Exported ${n} records${publicMode && !isPublic ? ' (public-safe)' : ''}.`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link to this exact view copied.');
    } catch {
      toast.warning('Couldn’t copy. Copy the address bar instead.');
    }
  };

  // ---------- loading / error ----------
  const loading = mastersQ.isLoading || bhsQ.isLoading || antQ.isLoading;
  const error = mastersQ.error || bhsQ.error || antQ.error;

  const header = (
    <PageHeader
      eyebrow={isPublic ? 'Explore the register' : 'Research'}
      title={isPublic ? 'Heritage Map of India' : 'Map Explorer'}
      subtitle={
        isPublic
          ? 'Find monuments and antiquities, see where they are and when they were made, and download what you find.'
          : 'Sites and antiquities in space and time. Running on a dummy dataset in the proposed schema.'
      }
      actions={
        <>
          <Button variant="secondary" size="sm" leftIcon={<Link2 size={14} />} onClick={copyLink}>Copy link</Button>
          <Button variant="secondary" size="sm" leftIcon={<FileSpreadsheet size={14} />} onClick={() => doExport('csv')} disabled={loading || !!error}>CSV</Button>
          <Button variant="primary" size="sm" leftIcon={<FileJson size={14} />} onClick={() => doExport('geojson')} disabled={loading || !!error}>GeoJSON</Button>
        </>
      }
    />
  );

  if (loading) {
    return (
      <div className={pageClass}>
        {header}
        <div className={styles.loading}><Spinner label="Loading map data" /></div>
      </div>
    );
  }

  if (error || !lookup) {
    const notBuilt = error?.status === 404;
    return (
      <div className={pageClass}>
        {header}
        <EmptyState
          title={notBuilt ? 'The backend doesn’t have the map API yet' : 'Couldn’t load map data'}
          description={
            notBuilt
              ? 'GET /map/masters and /map/features exist only in the mock layer for now. Set VITE_USE_MOCKS=true to run the demo.'
              : error?.data?.message || 'Check the network tab and try again.'
          }
        />
      </div>
    );
  }

  const measureKm = pathLengthKm(measurePoints);
  const shapeLabel = state.shape?.kind === 'radius'
    ? `Within ${formatKm(state.shape.radiusKm)} of ${state.shape.center[1].toFixed(2)}°N, ${state.shape.center[0].toFixed(2)}°E`
    : state.shape ? 'Inside drawn box' : null;

  return (
    <div className={pageClass}>
      {header}

      <div className={styles.stats} aria-live="polite">
        <span><strong>{result.bhs.length}</strong> of {result.totals.bhs} sites</span>
        <span><strong>{result.ant.length}</strong> of {result.totals.ant} antiquities</span>
        {result.totals.antNoFindspot > 0 && state.antMode === 'found' && (
          <span className={styles.statNote}>
            {result.totals.antNoFindspot} without a findspot aren’t plotted. Switch to “Where held now” to see them.
          </span>
        )}
        {state.pub && !isPublic && <span className={styles.pubTag}>Public view preview</span>}
      </div>

      <div className={`${styles.explorer} ${filtersOpen ? styles.explorerFiltersOpen : ''}`}>
        <FilterPanel
          state={state}
          update={update}
          reset={resetFilters}
          masters={masters}
          theme={theme}
          themeOptions={themeOptions}
          activeFilterCount={activeFilterCount}
          isPublic={isPublic}
        />

        <div className={styles.mapColumn}>
          <div className={styles.searchBar}>
            <PlaceSearch
              index={searchIndex}
              activeQuery={state.q}
              onPick={handlePick}
              onFilter={(q) => update({ q })}
              onClearFilter={() => update({ q: '' })}
              parse={parse}
              onSmart={handleSmart}
            />
            <button
              type="button"
              className={styles.filtersToggle}
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={14} /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
            {CAN_LOCATE && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<LocateFixed size={14} />}
                onClick={() => nearMe()}
                disabled={locating}
              >
                {locating ? 'Locating…' : 'Near me'}
              </Button>
            )}
          </div>
          <div className={styles.toolbar}>
            <div className={styles.tools} role="toolbar" aria-label="Map tools">
              {TOOLS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={tool === id ? styles.toolOn : styles.tool}
                  onClick={() => setTool(id)}
                  aria-pressed={tool === id}
                  title={label}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <StoryMenu stories={STORIES} onStart={(id) => goToStep(id, 0)} />

            <div className={styles.toolStatus}>
              {TOOL_HINT[tool] && <span className={styles.hint}><Info size={13} /> {TOOL_HINT[tool]}</span>}
              {tool === 'measure' && measurePoints.length > 1 && (
                <span className={styles.chip}>
                  <Ruler size={13} /> {formatKm(measureKm)}
                  <button type="button" onClick={() => setMeasurePoints([])} aria-label="Clear measurement"><X size={12} /></button>
                </span>
              )}
              {shapeLabel && tool === 'pan' && (
                <span className={styles.chip}>
                  {shapeLabel}
                  <button type="button" onClick={() => update({ shape: null })} aria-label="Clear spatial selection"><X size={12} /></button>
                </span>
              )}
            </div>
          </div>

          <div className={styles.mapArea}>
            <MapCanvas
              data={mapData}
              layers={layers}
              selected={selected}
              shapeFeature={shapeFeature}
              measurePoints={measurePoints}
              userLocation={userLocation}
              tool={tool}
              flyRequest={fly}
              initialView={initialView}
              onSelect={handleSelect}
              onClearSelection={clearSelection}
              onShapeDrawn={handleShapeDrawn}
              onMeasureAdd={handleMeasureAdd}
              onViewChange={handleView}
            />
            {storyDef && (
              <StoryCard
                story={storyDef}
                step={story.step}
                text={story.text}
                onPrev={prevStep}
                onNext={nextStep}
                onExit={exitStory}
              />
            )}
            {!storyDef && <Legend theme={theme} records={[...result.bhs, ...(state.antMode === 'found' ? result.ant.filter((r) => r._coords) : result.ant)]} layers={layers} />}
            <DetailPanel
              selection={selection}
              lookup={lookup}
              masters={masters}
              periodColor={periodTheme.color}
              visibleIds={visibleIds}
              publicMode={publicMode}
              onSelect={selectAndFly}
              onClose={clearSelection}
              onZoom={(c) => setFly({ center: c, zoom: 12, key: Date.now() })}
              onRadius={handleRadius}
              hideOnPhone={!!storyDef}
            />
          </div>

          <TimeSlider
            periods={masters.periods}
            from={state.from}
            to={state.to}
            onChange={(from, to) => update({ from, to })}
            records={timelessRecords}
            colorForPeriod={periodTheme.color}
          />
        </div>
      </div>

      <ResultsTable
        bhs={result.bhs}
        ant={result.ant}
        lookup={lookup}
        selectedKey={state.sel}
        onSelect={handleSelect}
        publicMode={publicMode}
      />

      <p className={styles.footnote}>
        Demo data: named monuments use approximate public coordinates; all antiquities and minor sites are invented. Monument
        photos: Wikimedia Commons contributors (CC BY-SA). Basemap © OpenStreetMap contributors — demo only, not Survey of
        India–compliant; production uses Bhuvan, Mappls or self-hosted tiles.
      </p>
    </div>
  );
}

