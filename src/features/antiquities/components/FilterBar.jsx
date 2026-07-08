import { Search, X, SlidersHorizontal } from 'lucide-react';
import Input from '@components/Input';
import Select from '@components/Select';
import Button from '@components/Button';
import Badge from '@components/Badge';
import {
  STATUS_OPTIONS,
  CATEGORY_OPTIONS,
  CIRCLE_OPTIONS,
} from '../schema';
import styles from './FilterBar.module.css';

/**
 * FilterBar — search + status/circle/category dropdowns + reset.
 *
 * Fully controlled. Parent debounces `search` before firing the query.
 *
 * @param {object} props
 * @param {{ search: string, status: string, circle: string, category: string }} props.filters
 * @param {(patch: object) => void} props.onChange — receives {key: value}
 * @param {() => void} props.onReset
 * @param {boolean} [props.canFilterByCircle=true] — hide the Circle filter for
 *   users who only see their own circle (RD, Supervisor) since it's redundant
 */
export default function FilterBar({
  filters,
  onChange,
  onReset,
  canFilterByCircle = true,
}) {
  const { search, status, circle, category } = filters;

  const activeCount =
    (status ? 1 : 0) + (circle ? 1 : 0) + (category ? 1 : 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchWrap}>
        <Input
          placeholder="Search by name or accession number…"
          leftIcon={<Search size={14} />}
          value={search}
          onChange={(e) => onChange({ search: e.target.value })}
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

      <div className={styles.filters}>
        <div className={styles.filterIcon}>
          <SlidersHorizontal size={14} />
          <span>Filters</span>
          {activeCount > 0 && (
            <Badge size="sm" variant="primary">
              {activeCount}
            </Badge>
          )}
        </div>

        <Select
          size="sm"
          placeholder="All statuses"
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
          options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]}
        />

        {canFilterByCircle && (
          <Select
            size="sm"
            placeholder="All circles"
            value={circle}
            onChange={(e) => onChange({ circle: e.target.value })}
            options={[{ value: '', label: 'All circles' }, ...CIRCLE_OPTIONS]}
          />
        )}

        <Select
          size="sm"
          placeholder="All categories"
          value={category}
          onChange={(e) => onChange({ category: e.target.value })}
          options={[
            { value: '', label: 'All categories' },
            ...CATEGORY_OPTIONS,
          ]}
        />

        {(search || activeCount > 0) && (
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
  );
}
