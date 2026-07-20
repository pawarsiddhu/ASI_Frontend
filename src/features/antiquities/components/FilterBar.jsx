import { Search, X } from 'lucide-react';
import Input from '@components/Input';
import Select from '@components/Select';
import Button from '@components/Button';
import { STATUS, STATUS_LABEL } from '../schema';
import { useCircles } from '@features/circles';
import styles from './FilterBar.module.css';

/**
 * FilterBar — pill-chip filters for record lists.
 *
 * Redesigned after the demo — the earlier dropdown-heavy version read as an
 * admin form, not a browse tool. Now the primary status filter is a row of
 * pill chips (the pattern the reference screenshots use for their main
 * segmentation control) and only Circle stays as a dropdown because it has
 * enough options that chips would wrap onto three rows.
 *
 * Circle options come from GET /circles via useCircles (see @features/circles).
 * If the fetch fails, useCircles serves a small fallback set so the filter
 * remains usable during a demo. Client-side filtering; parent debounces
 * `search`.
 */

// Order matters — this is the reading order in the pill row.
// Some backend statuses collapse (e.g. all "pending X" states surface here
// under a single "In Review" chip) to keep the row scannable.
const STATUS_CHIPS = [
  { key: '',                          label: 'All' },
  { key: STATUS.DRAFT,                label: STATUS_LABEL[STATUS.DRAFT] },
  { key: STATUS.SUPERVISOR_REVIEW,    label: STATUS_LABEL[STATUS.SUPERVISOR_REVIEW] },
  { key: STATUS.ADMIN_REVIEW,         label: STATUS_LABEL[STATUS.ADMIN_REVIEW] },
  { key: STATUS.PUBLISH_QUEUE,        label: STATUS_LABEL[STATUS.PUBLISH_QUEUE] },
  { key: STATUS.RETURNED,             label: STATUS_LABEL[STATUS.RETURNED] },
  { key: STATUS.PUBLISHED,            label: STATUS_LABEL[STATUS.PUBLISHED] },
  { key: STATUS.REJECTED,             label: STATUS_LABEL[STATUS.REJECTED] },
];

export default function FilterBar({
  filters,
  onChange,
  onReset,
  canFilterByCircle = true,
}) {
  const { search, status, circle } = filters;
  const hasActiveFilters = Boolean(search || status || circle);

  // Live circle list from the backend. During the initial fetch `options`
  // is empty; we still render the Select (with just "All circles") so the
  // filter row doesn't reflow when data arrives.
  const { options: circleOptions, isLoading: circlesLoading } = useCircles();

  return (
    <div className={styles.wrapper}>
      {/* Search — full-width, prominent */}
      <div className={styles.searchRow}>
        <Input
          placeholder="Search by title or record ID…"
          leftIcon={<Search size={16} />}
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
          size="lg"
          rightIcon={
            search ? (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={() => onChange({ search: '' })}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null
          }
        />
      </div>

      {/* Filter row: status chips on the left, circle dropdown + reset on the right */}
      <div className={styles.filterRow}>
        <div className={styles.chipGroup} role="tablist" aria-label="Filter by status">
          {STATUS_CHIPS.map((chip) => {
            const active = status === chip.key;
            return (
              <button
                key={chip.key || 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                onClick={() => onChange({ status: chip.key })}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className={styles.rightGroup}>
          {canFilterByCircle && (
            <Select
              size="sm"
              value={circle}
              onChange={(e) => onChange({ circle: e.target.value })}
              disabled={circlesLoading}
              options={[
                { value: '', label: circlesLoading ? 'Loading…' : 'All circles' },
                ...circleOptions,
              ]}
            />
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<X size={12} />}
              onClick={onReset}
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
