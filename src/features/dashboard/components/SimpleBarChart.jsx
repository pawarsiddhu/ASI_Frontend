import Card from '@components/Card';
import Skeleton from '@components/Skeleton';
import styles from './SimpleBarChart.module.css';

/**
 * SimpleBarChart — horizontal bar chart, CSS only.
 * Values are auto-scaled to the max in the dataset.
 * Perfect for "top N" style breakdowns. When we need real charting
 * (line/pie/multi-series), swap to recharts.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {Array<{ label: string, value: number }>} props.data
 * @param {boolean} [props.isLoading]
 */
export default function SimpleBarChart({
  title,
  subtitle,
  data = [],
  isLoading = false,
}) {
  const max = data.length
    ? Math.max(...data.map((d) => d.value))
    : 1;

  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>{title}</Card.Title>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </Card.Header>
      <div className={styles.body}>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.row}>
                <Skeleton width={100} height={12} />
                <Skeleton width="100%" height={22} variant="rect" />
              </div>
            ))
          : data.map((d) => (
              <div key={d.label} className={styles.row}>
                <div className={styles.label}>{d.label}</div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.bar}
                    style={{ width: `${(d.value / max) * 100}%` }}
                  >
                    <span className={styles.barValue}>
                      {d.value.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </Card>
  );
}
