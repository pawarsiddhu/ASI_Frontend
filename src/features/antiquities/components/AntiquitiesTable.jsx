import { ArrowUp, ArrowDown, ArrowUpDown, Eye } from 'lucide-react';
import Badge from '@components/Badge';
import Button from '@components/Button';
import Skeleton from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
import StatusBadge from './StatusBadge';
import { CATEGORY_LABEL } from '../schema';
import styles from './AntiquitiesTable.module.css';

const COLUMNS = [
  { key: 'accessionNo', label: 'Accession No.', sortable: false, width: 190 },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'category', label: 'Category', sortable: false, width: 130 },
  { key: 'circle', label: 'Circle', sortable: false, width: 160 },
  { key: 'status', label: 'Status', sortable: true, width: 200 },
  { key: 'updatedAt', label: 'Updated', sortable: true, width: 130 },
  { key: 'actions', label: '', sortable: false, width: 80 },
];

/**
 * AntiquitiesTable — the results grid.
 *
 * @param {object} props
 * @param {Array} props.items
 * @param {boolean} [props.isLoading]
 * @param {boolean} [props.isFetching] — soft loading (query re-runs, keep old data visible)
 * @param {string} props.sortBy
 * @param {'asc'|'desc'} props.sortOrder
 * @param {(key: string) => void} props.onSort
 * @param {(item: object) => void} [props.onRowClick]
 */
export default function AntiquitiesTable({
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
      // A soft loading state — dim the table while the query re-runs.
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
                    <SortIcon
                      active={sortBy === col.key}
                      order={sortOrder}
                    />
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
                <td className={styles.accessionCell}>
                  <code>{item.accessionNo}</code>
                </td>
                <td>
                  <div className={styles.nameCell}>
                    <span className={styles.nameText}>{item.name}</span>
                    <span className={styles.materialText}>
                      {item.material} · {item.period.split(' (')[0]}
                    </span>
                  </div>
                </td>
                <td>
                  <Badge size="sm">
                    {CATEGORY_LABEL[item.category] || item.category}
                  </Badge>
                </td>
                <td className={styles.circleCell}>{item.circle.name}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td className={styles.dateCell}>{formatDate(item.updatedAt)}</td>
                <td className={styles.actionsCell}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye size={12} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick?.(item);
                    }}
                    aria-label={`View ${item.name}`}
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
