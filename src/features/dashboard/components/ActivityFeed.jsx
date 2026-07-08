import {
  FileText,
  Send,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Inbox,
  Edit3,
  ShieldCheck,
  BarChart3,
  Plus,
} from 'lucide-react';
import Card from '@components/Card';
import Badge from '@components/Badge';
import Skeleton from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
import styles from './ActivityFeed.module.css';

/**
 * Activity feed. Type → icon + tone lookup lives here.
 * Add a new activity type by adding an entry.
 */
const TYPE_META = {
  create: { icon: Plus, color: 'brand' },
  draft: { icon: FileText, color: 'brand' },
  forward: { icon: Send, color: 'info' },
  returned: { icon: RotateCcw, color: 'warning' },
  reject: { icon: XCircle, color: 'danger' },
  published: { icon: CheckCircle2, color: 'success' },
  publish: { icon: CheckCircle2, color: 'success' },
  received: { icon: Inbox, color: 'accent' },
  edit: { icon: Edit3, color: 'brand' },
  approve: { icon: ShieldCheck, color: 'success' },
  report: { icon: BarChart3, color: 'info' },
};

const BADGE_VARIANT = {
  Draft: 'default',
  'Under review': 'info',
  Pending: 'warning',
  'In queue': 'warning',
  'In workflow': 'warning',
  Returned: 'warning',
  Rejected: 'danger',
  Published: 'success',
  Approved: 'success',
  'To Admin': 'info',
  'To publish': 'info',
  Edited: 'default',
  Report: 'info',
};

/**
 * ActivityFeed — dated list of things that happened recently.
 *
 * @param {object} props
 * @param {Array} props.items
 * @param {boolean} [props.isLoading]
 * @param {string} [props.title='Recent Activity']
 */
export default function ActivityFeed({
  items = [],
  isLoading = false,
  title = 'Recent Activity',
}) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        {!isLoading && items.length > 0 && (
          <Badge>{items.length}</Badge>
        )}
      </Card.Header>
      <div className={styles.list}>
        {isLoading && items.length === 0 ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Actions on records will appear here."
            size="sm"
          />
        ) : (
          items.map((item) => {
            const meta = TYPE_META[item.type] || TYPE_META.draft;
            const Icon = meta.icon;
            return (
              <div key={item.id} className={styles.item}>
                <div className={styles.iconCol} data-color={meta.color}>
                  <Icon size={14} />
                </div>
                <div className={styles.body}>
                  <div className={styles.head}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.badge && (
                      <Badge
                        size="sm"
                        variant={BADGE_VARIANT[item.badge] || 'default'}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <div className={styles.description}>{item.description}</div>
                  <div className={styles.at}>{item.at}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function SkeletonList() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.item}>
          <Skeleton variant="circle" width={28} height={28} />
          <div className={styles.body} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width="70%" height={12} />
            <Skeleton width="90%" height={10} />
            <Skeleton width={80} height={9} />
          </div>
        </div>
      ))}
    </>
  );
}
