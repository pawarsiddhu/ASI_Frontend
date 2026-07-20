import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import Card from '@components/Card';
import Skeleton from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
import StatusBadge from '@features/antiquities/components/StatusBadge';
import {
  STATUS,
  STATUS_LABEL,
  STATUS_BADGE_VARIANT,
} from '@features/antiquities/schema';
import { DIMENSION_META } from '../schema';
import styles from './ReportTable.module.css';

/**
 * ReportTable — the matrix. Rows = groups, columns = per-status counts + total.
 *
 * Renders:
 *   [ dimension label ] [ status1 ] [ status2 ] ... [ Total ]
 * with a bottom "Totals" row that shows overall counts.
 *
 * The columns are the status enum in a fixed order (workflow order), so the
 * eye can scan across the whole approval pipeline for each group.
 */

// Column order matches the workflow flow — left = earliest stage, right = terminal.
const STATUS_COLUMNS = [
  STATUS.DRAFT,
  STATUS.SUPERVISOR_REVIEW,
  STATUS.ADMIN_REVIEW,
  STATUS.PUBLISH_QUEUE,
  STATUS.PUBLISHED,
  STATUS.RETURNED,
  STATUS.REJECTED,
];

export default function ReportTable({
  rows = [],
  totals,
  dimension,
  isLoading,
  isFetching,
}) {
  const dimensionLabel =
    DIMENSION_META[dimension]?.columnLabel || 'Group';

  // Local sort — cheap client-side since we won't have thousands of rows.
  const [sortBy, setSortBy] = useState('total');
  const [sortOrder, setSortOrder] = useState('desc');

  const sorted = [...rows].sort((a, b) => {
    let av, bv;
    if (sortBy === 'label') {
      av = a.label || '';
      bv = b.label || '';
      return sortOrder === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    }
    if (sortBy === 'total') {
      av = a.total;
      bv = b.total;
    } else {
      // sort by a specific status column
      av = a.byStatus?.[sortBy] || 0;
      bv = b.byStatus?.[sortBy] || 0;
    }
    if (av === bv) return 0;
    return sortOrder === 'asc' ? av - bv : bv - av;
  });

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder(key === 'label' ? 'asc' : 'desc');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <div className={styles.wrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{dimensionLabel}</th>
                {STATUS_COLUMNS.map((s) => (
                  <th key={s} className={styles.numCol}>
                    {STATUS_LABEL[s]}
                  </th>
                ))}
                <th className={styles.numCol}>Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td>
                    <Skeleton width="70%" height={12} />
                  </td>
                  {STATUS_COLUMNS.map((s) => (
                    <td key={s} className={styles.numCol}>
                      <Skeleton width={24} height={12} />
                    </td>
                  ))}
                  <td className={styles.numCol}>
                    <Skeleton width={30} height={12} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card>
        <div className={styles.emptyWrap}>
          <EmptyState
            title="No records for this filter"
            description="Try widening the date range or picking a different grouping."
            size="sm"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div
        className={styles.wrapper}
        style={{ opacity: isFetching ? 0.65 : 1 }}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">
                <SortableHeader
                  label={dimensionLabel}
                  active={sortBy === 'label'}
                  order={sortOrder}
                  onClick={() => handleSort('label')}
                />
              </th>
              {STATUS_COLUMNS.map((s) => (
                <th key={s} scope="col" className={styles.numCol}>
                  <SortableHeader
                    label={STATUS_LABEL[s]}
                    active={sortBy === s}
                    order={sortOrder}
                    onClick={() => handleSort(s)}
                    inlineBadge={
                      <span
                        className={`${styles.dot} ${styles[`dot_${STATUS_BADGE_VARIANT[s]}`]}`}
                        aria-hidden="true"
                      />
                    }
                  />
                </th>
              ))}
              <th scope="col" className={styles.numCol}>
                <SortableHeader
                  label="Total"
                  active={sortBy === 'total'}
                  order={sortOrder}
                  onClick={() => handleSort('total')}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.key}>
                <td className={styles.dimCell}>{row.label}</td>
                {STATUS_COLUMNS.map((s) => {
                  const v = row.byStatus?.[s] || 0;
                  return (
                    <td
                      key={s}
                      className={`${styles.numCol} ${v === 0 ? styles.zero : ''}`}
                    >
                      {v.toLocaleString('en-IN')}
                    </td>
                  );
                })}
                <td className={`${styles.numCol} ${styles.totalCell}`}>
                  {row.total.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Totals footer */}
          {totals && (
            <tfoot>
              <tr>
                <th scope="row" className={styles.footLabel}>
                  Totals
                </th>
                {STATUS_COLUMNS.map((s) => (
                  <td key={s} className={styles.numCol}>
                    {(totals[s] || 0).toLocaleString('en-IN')}
                  </td>
                ))}
                <td className={`${styles.numCol} ${styles.totalCell}`}>
                  {(totals.all || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </Card>
  );
}

function SortableHeader({ label, active, order, onClick, inlineBadge }) {
  const Icon = !active ? ArrowUpDown : order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      className={`${styles.sortBtn} ${active ? styles.sortBtnActive : ''}`}
      onClick={onClick}
    >
      {inlineBadge}
      <span>{label}</span>
      <Icon size={11} className={styles.sortIcon} />
    </button>
  );
}
