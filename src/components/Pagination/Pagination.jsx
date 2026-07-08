import { ChevronLeft, ChevronRight } from 'lucide-react';
import Select from '@components/Select';
import styles from './Pagination.module.css';

/**
 * Pagination — pure controlled component.
 *
 * @param {object} props
 * @param {number} props.page          — current page (1-based)
 * @param {number} props.totalPages
 * @param {number} props.pageSize
 * @param {number} props.total
 * @param {(p: number) => void} props.onPageChange
 * @param {(size: number) => void} [props.onPageSizeChange]
 * @param {number[]} [props.pageSizeOptions=[25, 50, 100, 200]]
 */
export default function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 200],
}) {
  const pageNumbers = getPageNumbers(page, totalPages);
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={styles.wrapper}>
      <div className={styles.info}>
        {total === 0 ? (
          <span>No records to show</span>
        ) : (
          <span>
            Showing <strong>{start}</strong>&ndash;<strong>{end}</strong> of{' '}
            <strong>{total.toLocaleString('en-IN')}</strong> records
          </span>
        )}
      </div>

      <div className={styles.controls}>
        {onPageSizeChange && (
          <div className={styles.pageSizeGroup}>
            <span className={styles.label}>Rows per page</span>
            <Select
              size="sm"
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              options={pageSizeOptions.map((n) => ({
                value: String(n),
                label: String(n),
              }))}
            />
          </div>
        )}

        <div className={styles.pageGroup}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>

          {pageNumbers.map((p, i) =>
            p === '…' ? (
              <span key={`e-${i}`} className={styles.ellipsis}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`${styles.page} ${
                  p === page ? styles.pageActive : ''
                }`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className={styles.arrow}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * getPageNumbers — returns the sequence of pages + ellipses for the pagination bar.
 * Example for current=5, total=10 → [1, '…', 4, 5, 6, '…', 10]
 */
function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const filtered = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withEllipses = [];
  filtered.forEach((p, i) => {
    if (i > 0 && p - filtered[i - 1] > 1) {
      withEllipses.push('…');
    }
    withEllipses.push(p);
  });
  return withEllipses;
}
