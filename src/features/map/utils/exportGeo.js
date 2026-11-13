/**
 * Export the CURRENT filtered result — exactly what's on the map and table.
 *
 * GeoJSON is the researcher-grade output: opens directly in QGIS, R (sf),
 * Python (geopandas) and kepler.gl. CSV is for Excel users.
 *
 * In public preview mode, restricted fields are stripped and coordinates are
 * the generalised ones the viewer sees, never the exact ones.
 */

const RESTRICTED_FIELDS = ['accession_number', 'find_precision', 'coordinate_source'];

function cleanProps(r, publicMode) {
  const out = {};
  Object.entries(r).forEach(([k, v]) => {
    if (k.startsWith('_')) return;
    if (publicMode && RESTRICTED_FIELDS.includes(k)) return;
    out[k] = Array.isArray(v) ? v.join('; ') : v;
  });
  return out;
}

function stamp() {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
}

function download(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportGeoJSON({ bhs, ant, publicMode }) {
  const features = [
    ...bhs.map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: r._coords },
      properties: { record_type: 'BHS', ...cleanProps(r, publicMode) },
    })),
    ...ant.map((r) => ({
      type: 'Feature',
      // Findspot geometry; null when unknown (valid GeoJSON).
      geometry: r._coords ? { type: 'Point', coordinates: r._coords } : null,
      properties: {
        record_type: 'ANTIQUITY',
        held_at: r._museumName || null,
        moved_km: r._movedKm != null ? Math.round(r._movedKm) : null,
        ...cleanProps(r, publicMode),
      },
    })),
  ];
  download(
    `nmma-map-${stamp()}.geojson`,
    JSON.stringify({ type: 'FeatureCollection', features }, null, 2),
    'application/geo+json'
  );
  return features.length;
}

function escapeCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCsv({ bhs, ant, publicMode }) {
  const rows = [
    ...bhs.map((r) => ({
      record_type: 'BHS',
      longitude: r._coords?.[0],
      latitude: r._coords?.[1],
      ...cleanProps(r, publicMode),
    })),
    ...ant.map((r) => ({
      record_type: 'ANTIQUITY',
      longitude: r._coords?.[0] ?? '',
      latitude: r._coords?.[1] ?? '',
      held_at: r._museumName || '',
      moved_km: r._movedKm != null ? Math.round(r._movedKm) : '',
      ...cleanProps(r, publicMode),
    })),
  ];
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escapeCell(r[h])).join(',')),
  ].join('\r\n');
  // BOM so Excel reads UTF-8 (Devanagari-safe)
  download(`nmma-map-${stamp()}.csv`, `﻿${csv}`, 'text/csv;charset=utf-8');
  return rows.length;
}
