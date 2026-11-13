import { matchesShape, snapToGrid, haversineKm } from './geo';

/**
 * The single filter pipeline. Map, table, legend counts and exports all read
 * its output, so they can never disagree with each other.
 *
 * Public preview mode applies the rules a public/scholar view would enforce:
 *   - only PUBLISHED records
 *   - display_precision 'hidden'      → record dropped
 *   - display_precision 'approximate' → coordinate snapped to a ~5 km grid
 */

const inList = (list, v) => !list || list.length === 0 || list.includes(v);

function overlapsWindow(p, from, to) {
  // Undated records always pass — hiding them would silently shrink results.
  if (p.date_start == null && p.date_end == null) return true;
  const s = p.date_start ?? p.date_end;
  const e = p.date_end ?? p.date_start;
  return s <= to && e >= from;
}

function textMatch(p, q) {
  if (!q) return true;
  const hay = [p.title, p.bh_code, p.key_no, p.period_text, p.district, p.state, p.find_location_text]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function passesCommon(p, f, publicMode) {
  if (publicMode && p.status !== 'PUBLISHED') return false;
  if (publicMode && p.display_precision === 'hidden') return false;
  return (
    inList(f.periods, p.period_id) &&
    inList(f.affiliations, p.cultural_affiliation_id) &&
    inList(f.statuses, p.status) &&
    (!f.category || p.category_id === f.category) &&
    (!f.dynasty || p.dynasty_id === f.dynasty) &&
    (!f.state || p.state === f.state) &&
    (!f.circle || p.circle === f.circle) &&
    overlapsWindow(p, f.from, f.to) &&
    textMatch(p, f.q)
  );
}

function displayCoords(coords, props, publicMode) {
  if (!coords) return null;
  if (publicMode && props.display_precision === 'approximate') return snapToGrid(coords);
  return coords;
}

/**
 * @returns {{
 *   bhs: object[], ant: object[],
 *   bhsFC, antFoundFC, museumsFC, dispersalFC,
 *   totals: { bhs, ant, antNoFindspot }
 * }}
 */
export function runFilters({ bhsFC, antFC, masters, filters, theme, publicMode }) {
  const f = { ...filters, q: (filters.q || '').trim().toLowerCase() };
  const museumsById = Object.fromEntries((masters?.museums || []).map((m) => [m.id, m]));

  // ---------- BHS ----------
  const bhs = [];
  if (filters.showBhs) {
    for (const feat of bhsFC?.features || []) {
      const p = feat.properties;
      if (!passesCommon(p, f, publicMode)) continue;
      if (!inList(f.protection, p.protection_level)) continue;
      const coords = displayCoords(feat.geometry?.coordinates, p, publicMode);
      if (!matchesShape(coords, f.shape)) continue;
      bhs.push({ ...p, _kind: 'bhs', _coords: coords, _color: theme.color(theme.key(p)) });
    }
  }

  // ---------- Antiquities ----------
  const ant = [];
  let antNoFindspot = 0;
  if (filters.showAnt) {
    for (const feat of antFC?.features || []) {
      const p = feat.properties;
      if (!passesCommon(p, f, publicMode)) continue;
      // Protection level is a site attribute; when it's filtered, keep only
      // antiquities linked to a site — and the site must match.
      if (f.protection?.length) {
        const site = p.bhs_id && bhsFC.features.find((b) => b.id === p.bhs_id);
        if (!site || !f.protection.includes(site.properties.protection_level)) continue;
      }
      const coords = displayCoords(feat.geometry?.coordinates, p, publicMode);
      // Spatial selections test the FINDSPOT. No findspot → can't be in a shape.
      if (f.shape && !coords) continue;
      if (!matchesShape(coords, f.shape)) continue;
      if (!coords) antNoFindspot += 1;
      const museum = museumsById[p.museum_id];
      const heldAt = museum ? [museum.longitude, museum.latitude] : null;
      ant.push({
        ...p,
        _kind: 'ant',
        _coords: coords,
        _heldAt: heldAt,
        _museumName: museum?.name,
        _movedKm: coords && heldAt ? haversineKm(coords, heldAt) : null,
        _color: theme.color(theme.key(p)),
      });
    }
  }

  // ---------- GeoJSON for the map ----------
  const point = (r) => ({
    type: 'Feature',
    id: r.id,
    geometry: { type: 'Point', coordinates: r._coords },
    properties: { id: r.id, kind: r._kind, title: r.title, color: r._color },
  });

  const bhsFCOut = { type: 'FeatureCollection', features: bhs.map(point) };
  const antFoundFC = { type: 'FeatureCollection', features: ant.filter((r) => r._coords).map(point) };

  const museumCounts = {};
  ant.forEach((r) => { museumCounts[r.museum_id] = (museumCounts[r.museum_id] || 0) + 1; });
  const museumsFC = {
    type: 'FeatureCollection',
    features: Object.entries(museumCounts).map(([id, count]) => {
      const m = museumsById[id];
      return {
        type: 'Feature',
        id: Number(id.replace(/\D/g, '')),
        geometry: { type: 'Point', coordinates: [m.longitude, m.latitude] },
        properties: { museum_id: id, title: m.name, count, kind: 'museum' },
      };
    }),
  };

  const dispersalFC = {
    type: 'FeatureCollection',
    features: ant
      .filter((r) => r._coords && r._heldAt && r._movedKm > 5)
      .map((r) => ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [r._coords, r._heldAt] },
        properties: { id: r.id, km: Math.round(r._movedKm) },
      })),
  };

  return {
    bhs,
    ant,
    bhsFC: bhsFCOut,
    antFoundFC,
    museumsFC,
    dispersalFC,
    totals: {
      bhs: bhsFC?.features?.length || 0,
      ant: antFC?.features?.length || 0,
      antNoFindspot,
    },
  };
}
