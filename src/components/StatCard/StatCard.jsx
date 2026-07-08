import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Skeleton from '@components/Skeleton';
import styles from './StatCard.module.css';

/**
 * StatCard — the dashboard workhorse.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string | number | null | undefined} props.value
 * @param {React.ReactNode} [props.icon]
 * @param {string} [props.iconColor='brand']  brand|success|warning|danger|info
 * @param {{ value: number, direction: 'up'|'down'|'flat', suffix?: string }} [props.trend]
 * @param {string} [props.helperText]
 * @param {boolean} [props.isLoading]
 * @param {() => void} [props.onClick]  — optional; makes the whole card clickable
 */
export default function StatCard({
  label,
  value,
  icon,
  iconColor = 'brand',
  trend,
  helperText,
  isLoading = false,
  onClick,
}) {
  const Element = onClick ? 'button' : 'div';

  const classes = [
    styles.card,
    onClick ? styles.interactive : '',
    isLoading ? styles.loading : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Element
      className={classes}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className={styles.top}>
        <div className={styles.label}>{label}</div>
        {icon && (
          <div
            className={styles.icon}
            data-color={iconColor}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      <div className={styles.valueRow}>
        {isLoading ? (
          <Skeleton width={80} height={32} />
        ) : (
          <div className={styles.value}>{formatValue(value)}</div>
        )}
        {!isLoading && trend && (
          <TrendPill trend={trend} />
        )}
      </div>

      {!isLoading && helperText && (
        <div className={styles.helper}>{helperText}</div>
      )}
      {isLoading && <Skeleton width="60%" height={12} />}
    </Element>
  );
}

function TrendPill({ trend }) {
  const { value, direction, suffix = '%' } = trend;
  const Icon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  return (
    <span className={styles.trend} data-direction={direction}>
      <Icon size={12} />
      <span>
        {value > 0 ? '+' : ''}
        {value}
        {suffix}
      </span>
    </span>
  );
}

function formatValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString('en-IN');
  return value;
}
