import { RefreshCw } from 'lucide-react';
import Button from '@components/Button';
import styles from './PageHeader.module.css';

/**
 * PageHeader — the small band at the top of every page below the AppShell
 * header. Replaces the older GreetingHeader (killed per demo feedback —
 * "we do not need that good evening / good afternoon thing").
 *
 * Structure:
 *   - Optional eyebrow label (small caps role/section tag)
 *   - Title (page name)
 *   - Optional subtitle (single supporting line)
 *   - Optional right-side actions slot (buttons, refresh, etc.)
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  onRefresh,
  isFetching,
  actions,
}) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      <div className={styles.actions}>
        {actions}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={
              <RefreshCw
                size={14}
                className={isFetching ? styles.spin : undefined}
              />
            }
            onClick={onRefresh}
            disabled={isFetching}
          >
            Refresh
          </Button>
        )}
      </div>
    </div>
  );
}
