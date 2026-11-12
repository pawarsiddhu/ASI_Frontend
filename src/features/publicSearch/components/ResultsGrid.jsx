import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import ResultCard from './ResultCard';
import styles from './ResultsGrid.module.css';

const PAGE_SIZE = 12;

/**
 * ResultsGrid — pagination-aware grid of ResultCards.
 * Card skeletons on loading; empty state on zero results (with a differentiated
 * message when the emptiness comes from a filter).
 */
export default function ResultsGrid({
  records,
  isLoading,
  isError,
  onRetry,
  onSelect,
  page,
  onPageChange,
  hasActiveFilter,
}) {
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return records.slice(start, start + PAGE_SIZE);
  }, [records, safePage]);

  if (isError) {
    return (
      <div className={styles.state}>
        <SearchX size={40} className={styles.stateIcon} aria-hidden="true" />
        <h3 className={styles.stateTitle}>Couldn't load records</h3>
        <p className={styles.stateBody}>
          Something went wrong reaching the archive. Please try again.
        </p>
        <button type="button" className={styles.retry} onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.grid} aria-busy="true" aria-label="Loading results">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeleton}>
            <div className={styles.skeletonImg} />
            <div className={styles.skeletonBody}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineTitle}`} />
              <div className={styles.skeletonLine} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className={styles.state}>
        <SearchX size={40} className={styles.stateIcon} aria-hidden="true" />
        <h3 className={styles.stateTitle}>
          {hasActiveFilter ? 'No matches' : 'No records yet'}
        </h3>
        <p className={styles.stateBody}>
          {hasActiveFilter
            ? 'Try a different search term or clear the filters.'
            : 'Published records will appear here as they are added to the register.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {pageSlice.map((r) => (
          <ResultCard key={r.id} record={r} onSelect={onSelect} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className={styles.pager} aria-label="Results pagination">
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className={styles.pageInfo}>
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </nav>
      )}
    </>
  );
}
