import { Search, X } from 'lucide-react';
import styles from './SearchFilters.module.css';

/**
 * SearchFilters — text input (title/reference) + state dropdown (BHS only).
 * Debouncing is done by the parent — this is a controlled UI.
 */
export default function SearchFilters({
  q,
  onQChange,
  state,
  onStateChange,
  states,
  showStateFilter,
}) {
  return (
    <div className={styles.filters}>
      <label className={styles.searchLabel}>
        <Search size={16} aria-hidden="true" className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search by title or reference number…"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          aria-label="Search"
        />
        {q && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onQChange('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </label>

      {showStateFilter && (
        <select
          className={styles.select}
          value={state || ''}
          onChange={(e) => onStateChange(e.target.value || '')}
          aria-label="Filter by state"
        >
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
}
