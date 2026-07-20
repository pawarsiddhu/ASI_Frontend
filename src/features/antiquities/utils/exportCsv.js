import { STATUS_LABEL, CIRCLE } from '../schema';

/**
 * exportItemsAsCsv — turn RecordSummary rows into a CSV file and trigger a
 * browser download.
 *
 * Columns match what GET /records actually returns; deeper fields
 * (accession_number, material, provenance, image, etc.) live on the full
 * detail row (GET /records/:id) and aren't included in the list export
 * for POC. A "rich export" that fans out to detail fetches can be added
 * later if a demo requires it — for now this file mirrors the summary
 * shape one-to-one and is honest about what the list actually has.
 *
 * The column config below is the ONLY thing to edit when we want more or
 * fewer columns.
 */

const COLUMNS = [
  { header: 'Record ID', get: (r) => r.id },
  { header: 'Title', get: (r) => r.title || '' },
  { header: 'Type', get: (r) => r.type || '' },
  {
    header: 'Circle',
    get: (r) => CIRCLE[r.circle]?.name || r.circle || '',
  },
  {
    header: 'Status',
    get: (r) => STATUS_LABEL[r.status] || r.status || '',
  },
  { header: 'Current Level', get: (r) => r.current_level || '' },
  { header: 'Created By (user id)', get: (r) => r.created_by ?? '' },
  { header: 'Created', get: (r) => (r.created_at || '').slice(0, 10) },
];

/**
 * CSV cell escaping (RFC 4180): wrap in "" if the value contains "," "\n" or
 * ", double any embedded quotes.
 */
function escapeCell(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(items) {
  const rows = [
    COLUMNS.map((c) => c.header).join(','),
    ...items.map((item) =>
      COLUMNS.map((c) => escapeCell(c.get(item))).join(',')
    ),
  ];
  return rows.join('\r\n');
}

function downloadFile(filename, contents) {
  // Excel needs a BOM to recognize UTF-8 with non-ASCII (Devanagari-safe).
  const blob = new Blob(['\uFEFF' + contents], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * @param {Array} items — records to export.
 * @param {object} [meta]
 * @param {string} [meta.scope='antiquities'] — filename prefix.
 */
export function exportItemsAsCsv(items, meta = {}) {
  if (!items?.length) return;
  const scope = meta.scope || 'antiquities';
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${scope}-${stamp}.csv`;
  downloadFile(filename, toCsv(items));
}
