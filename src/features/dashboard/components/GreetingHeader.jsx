import { useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Button from '@components/Button';
import { useAuth } from '@hooks/useAuth';
import { ROLE_LABELS } from '@utils/constants';
import styles from './GreetingHeader.module.css';

function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Welcome back';
}

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * GreetingHeader — top of every dashboard.
 * Time-of-day aware, shows role + circle context, refresh action.
 */
export default function GreetingHeader({ onRefresh, isFetching }) {
  const { user, role } = useAuth();

  const { greeting, dateStr } = useMemo(() => {
    const now = new Date();
    return {
      greeting: greetingForHour(now.getHours()),
      dateStr: DATE_FMT.format(now),
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] || user?.name || '';

  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>
          {greeting}, {firstName}
        </h1>
        <p className={styles.subtitle}>
          {dateStr}
          {user?.circle && (
            <>
              <span className={styles.dot} aria-hidden="true">·</span>
              {user.circle}
            </>
          )}
          <span className={styles.dot} aria-hidden="true">·</span>
          {ROLE_LABELS[role]}
        </p>
      </div>
      {onRefresh && (
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={12} className={isFetching ? styles.spin : ''} />}
          onClick={onRefresh}
          disabled={isFetching}
        >
          Refresh
        </Button>
      )}
    </div>
  );
}
