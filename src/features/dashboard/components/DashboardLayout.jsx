import { AlertCircle } from 'lucide-react';
import Card from '@components/Card';
import EmptyState from '@components/EmptyState';
import Button from '@components/Button';

import GreetingHeader from './GreetingHeader';
import StatGrid from './StatGrid';
import QuickActions from './QuickActions';
import ActivityFeed from './ActivityFeed';
import SimpleBarChart from './SimpleBarChart';

import { useGetDashboardQuery } from '../dashboardApi';

import styles from './DashboardLayout.module.css';

/**
 * DashboardLayout — the shared shape every role dashboard renders.
 *
 * Handles the data fetch, loading state, error state, and layout. Each role
 * dashboard just passes its own `quickActions` config; everything else
 * (stats, chart, activity) is role-driven server-side.
 *
 * @param {object} props
 * @param {Array} props.quickActions — role-specific action tiles
 * @param {string} [props.quickActionsTitle]
 */
export default function DashboardLayout({
  quickActions = [],
  quickActionsTitle = 'Quick Actions',
}) {
  const { data, isLoading, isFetching, isError, refetch } =
    useGetDashboardQuery();

  return (
    <div className={styles.wrapper}>
      <GreetingHeader onRefresh={refetch} isFetching={isFetching} />

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
          <StatGrid stats={data?.stats || []} isLoading={isLoading} />

          <div className={styles.row}>
            <QuickActions title={quickActionsTitle} actions={quickActions} />
            <ActivityFeed
              items={data?.activity || []}
              isLoading={isLoading}
            />
          </div>

          {data?.chart && (
            <SimpleBarChart
              title={data.chart.title}
              subtitle={data.chart.subtitle}
              data={data.chart.data}
              isLoading={isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
