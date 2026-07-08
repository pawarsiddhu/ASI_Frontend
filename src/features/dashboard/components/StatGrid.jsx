import {
  FileText,
  Clock,
  RotateCcw,
  CheckCircle2,
  Inbox,
  Send,
  Users,
  Building2,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import StatCard from '@components/StatCard';
import styles from './StatGrid.module.css';

/**
 * Icon lookup by stat key. Adding a new stat? Register its icon here.
 * Falls back to FileText if unknown.
 */
const ICON_BY_KEY = {
  drafts: FileText,
  pending: Clock,
  returned: RotateCcw,
  published: CheckCircle2,
  queue: Inbox,
  returnedByAdmin: RotateCcw,
  forwardedToAdmin: Send,
  teamTotal: Users,
  total: FileText,
  awaitingReview: Clock,
  pendingPublish: Send,
  rejectedMonth: AlertCircle,
  publishQueue: Inbox,
  approvals: ShieldCheck,
  users: Users,
  circleRecords: Building2,
  circlePublished: CheckCircle2,
  circlePending: Clock,
  circleUsers: Users,
};

/**
 * StatGrid — renders 4 stat cards.
 *
 * @param {object} props
 * @param {Array} props.stats — array of stat objects from the API
 * @param {boolean} [props.isLoading]
 */
export default function StatGrid({ stats = [], isLoading = false }) {
  // On first load we don't have stats yet — render 4 skeleton cards.
  const items = isLoading && stats.length === 0
    ? Array.from({ length: 4 }, (_, i) => ({ key: `sk-${i}` }))
    : stats;

  return (
    <div className={styles.grid}>
      {items.map((stat) => {
        const Icon = ICON_BY_KEY[stat.key] || FileText;
        return (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            iconColor={stat.iconColor}
            icon={<Icon size={16} />}
            helperText={stat.helperText}
            isLoading={isLoading}
          />
        );
      })}
    </div>
  );
}
