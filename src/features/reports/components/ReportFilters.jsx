import { useMemo } from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import Card from '@components/Card';
import Select from '@components/Select';
import Input from '@components/Input';
import Button from '@components/Button';
import Badge from '@components/Badge';
import {
  DIMENSION_META,
  DATE_PRESETS,
  presetToRange,
} from '../schema';
import styles from './ReportFilters.module.css';

/**
 * ReportFilters — controls above every report page.
 *
 * State model (owned by the parent):
 *   { dimension, preset, from, to }
 *
 * When preset != 'custom':
 *   - from/to are derived by presetToRange() and passed to the API
 *   - the custom date inputs are hidden
 * When preset == 'custom':
 *   - custom date inputs appear + drive from/to
 */
export default function ReportFilters({
  dimensions, // array of dimension ids available for this role
  value, // { dimension, preset, from, to }
  onChange,
  onReset,
  isLoading,
}) {
  const dimensionOptions = useMemo(
    () =>
      dimensions.map((d) => ({
        value: d,
        label: DIMENSION_META[d]?.label || d,
      })),
    [dimensions]
  );

  const isCustom = value.preset === 'custom';
  const effectiveRange = useMemo(() => {
    if (isCustom) return { from: value.from, to: value.to };
    return presetToRange(value.preset);
  }, [isCustom, value.preset, value.from, value.to]);

  const patch = (p) => onChange({ ...value, ...p });

  const activeDate = value.preset !== 'all' && value.preset !== '';

  return (
    <Card className={styles.card}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="report-dimension">
            Group by
          </label>
          <Select
            id="report-dimension"
            value={value.dimension}
            onChange={(e) => patch({ dimension: e.target.value })}
            options={dimensionOptions}
            disabled={isLoading}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="report-preset">
            Date range
          </label>
          <Select
            id="report-preset"
            value={value.preset}
            onChange={(e) => patch({ preset: e.target.value, from: '', to: '' })}
            options={DATE_PRESETS}
            disabled={isLoading}
          />
        </div>

        {isCustom && (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="report-from">
                From
              </label>
              <Input
                id="report-from"
                type="date"
                value={value.from || ''}
                onChange={(e) => patch({ from: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="report-to">
                To
              </label>
              <Input
                id="report-to"
                type="date"
                value={value.to || ''}
                onChange={(e) => patch({ to: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <div className={styles.spacer} />

        <div className={styles.trailing}>
          {activeDate && effectiveRange.from && (
            <Badge size="sm" variant="info">
              <Calendar size={11} />
              <span style={{ marginLeft: 4 }}>
                {effectiveRange.from} → {effectiveRange.to}
              </span>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw size={12} />}
            onClick={onReset}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}
