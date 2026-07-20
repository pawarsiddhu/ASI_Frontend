import { AlertCircle } from 'lucide-react';
import Card from '@components/Card';
import EmptyState from '@components/EmptyState';
import Button from '@components/Button';

import PageHeader from './PageHeader';
import StatGrid from './StatGrid';
import QuickActions from './QuickActions';
import ActivityFeed from './ActivityFeed';
import SimpleBarChart from './SimpleBarChart';

import styles from './DashboardLayout.module.css';

/**
 * DashboardLayout — shared shape for every role dashboard.
 *
 * Time-of-day greeting was removed per demo feedback. Instead each role
 * passes eyebrow + title + subtitle to PageHeader for a clean band at the
 * top of every dashboard.
 */
export default function DashboardLayout({
  eyebrow,
  title = 'Dashboard',
  subtitle,
  stats = [],
  activity = [],
  chart = null,
  quickActions = [],
  quickActionsTitle = 'Quick Actions',
  isLoading = false,
  isFetching = false,
  isError = false,
  refetch,
}) {
  return (
    <div className={styles.wrapper}>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        onRefresh={refetch}
        isFetching={isFetching}
      />

      {isError ? (
        <Card>
          <EmptyState
            icon={<AlertCircle size={36} />}
            title="Could not load your dashboard"
            description="There was a problem fetching your data. Please try again."
            action={<Button onClick={refetch}>Retry</Button>}
          />
        </Card>
      ) : (
        <>
          <StatGrid stats={stats} isLoading={isLoading} />

          <div className={styles.row}>
            <QuickActions title={quickActionsTitle} actions={quickActions} />
            <ActivityFeed items={activity} isLoading={isLoading} />
          </div>

          {chart && (
            <SimpleBarChart
              title={chart.title}
              subtitle={chart.subtitle}
              data={chart.data}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
