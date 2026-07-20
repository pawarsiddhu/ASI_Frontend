import { ArrowUp, ArrowDown, ArrowUpDown, Eye } from 'lucide-react';
import Button from '@components/Button';
import Skeleton from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
// StatusBadge is type-agnostic — imported from antiquities feature.
import StatusBadge from '@features/antiquities/components/StatusBadge';
import { getCircleLabel } from '@features/circles';
import styles from './BHSTable.module.css';

const COLUMNS = [
  { key: 'title', label: 'Site Name', sortable: true },
  { key: 'circle', label: 'Circle', sortable: false, width: 160 },
  { key: 'status', label: 'Status', sortable: true, width: 200 },
  { key: 'created_at', label: 'Created', sortable: true, width: 130 },
  { key: 'actions', label: '', sortable: false, width: 80 },
];

export default function BHSTable({
  items = [],
  isLoading = false,
  isFetching = false,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
}) {
  return (
    <div
      className={styles.wrapper}
      style={{ opacity: isFetching && !isLoading ? 0.55 : 1 }}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
                scope="col"
              >
                {col.sortable ? (
                  <button
                    type="button"
                    className={styles.sortBtn}
                    onClick={() => onSort(col.key)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <SortIcon active={sortBy === col.key} order={sortOrder} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <SkeletonRows />
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className={styles.emptyCell}>
                <EmptyState
                  title="No records match your filters"
                  description="Try clearing the search or adjusting the filters."
                  size="sm"
                />
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                className={onRowClick ? styles.rowClickable : ''}
                onClick={() => onRowClick?.(item)}
              >
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.nameText}>
                      {item.title || <em>Untitled</em>}
                    </span>
                    <span className={styles.materialText}>Record #{item.id}</span>
                  </div>
                </td>
                <td className={styles.circleCell}>
                  {getCircleLabel(item.circle)}
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td className={styles.dateCell}>{formatDate(item.created_at)}</td>
                <td className={styles.actionsCell}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye size={12} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick?.(item);
                    }}
                    aria-label={`View ${item.title || 'record'}`}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, order }) {
  if (!active) return <ArrowUpDown size={12} className={styles.sortIcon} />;
  return order === 'asc' ? (
    <ArrowUp size={12} className={styles.sortIconActive} />
  ) : (
    <ArrowDown size={12} className={styles.sortIconActive} />
  );
}

function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={`sk-${i}`}>
      {COLUMNS.map((col) => (
        <td key={col.key}>
          <Skeleton width="80%" height={12} />
        </td>
      ))}
    </tr>
  ));
}

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function formatDate(iso) {
  if (!iso) return '—';
  return DATE_FMT.format(new Date(iso));
}
