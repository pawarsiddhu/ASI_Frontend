import { STATUS, STATUS_LABEL } from '@features/antiquities/schema';
import { DIMENSION_META } from '../schema';

/**
 * exportReportAsCsv — save the current report matrix as CSV.
 *
 * Columns:  <Dimension> | Draft | Under Supervisor Review | ... | Total
 * Rows:     one per group + a "Totals" summary row at the bottom.
 */

const STATUS_ORDER = [
  STATUS.DRAFT,
  STATUS.SUPERVISOR_REVIEW,
  STATUS.ADMIN_REVIEW,
  STATUS.PUBLISH_QUEUE,
  STATUS.PUBLISHED,
  STATUS.RETURNED,
  STATUS.REJECTED,
];

function escape(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(report) {
  const dimLabel =
    DIMENSION_META[report.dimension]?.columnLabel || report.dimension;

  const header = [dimLabel, ...STATUS_ORDER.map((s) => STATUS_LABEL[s]), 'Total'];

  const lines = [header.map(escape).join(',')];

  for (const row of report.rows) {
    const cells = [
      row.label,
      ...STATUS_ORDER.map((s) => row.byStatus?.[s] || 0),
      row.total,
    ];
    lines.push(cells.map(escape).join(','));
  }

  // Totals row at the bottom
  if (report.totals) {
    const totalsRow = [
      'Totals',
      ...STATUS_ORDER.map((s) => report.totals[s] || 0),
      report.totals.all || 0,
    ];
    lines.push(totalsRow.map(escape).join(','));
  }

  return lines.join('\r\n');
}

function download(filename, contents) {
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

export function exportReportAsCsv(report) {
  if (!report?.rows?.length) return;
  const stamp = new Date().toISOString().slice(0, 10);
  download(`antiquities-report-${report.dimension}-${stamp}.csv`, buildCsv(report));
}
