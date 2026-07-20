import { FileText, ShieldCheck, Clock3, AlertTriangle } from 'lucide-react';
import StatCard from '@components/StatCard';
import { STATUS } from '@features/antiquities/schema';
import styles from './ReportKPIs.module.css';

/**
 * ReportKPIs — 4 summary cards computed from the report's totals object.
 *
 * - Total: everything in the current filter
 * - Published: shipped records
 * - In Review: everything mid-workflow (supervisor_review + admin_review + publish_queue)
 * - Attention Needed: returned + rejected
 */
export default function ReportKPIs({ totals, isLoading }) {
  const inReview =
    (totals?.[STATUS.SUPERVISOR_REVIEW] || 0) +
    (totals?.[STATUS.ADMIN_REVIEW] || 0) +
    (totals?.[STATUS.PUBLISH_QUEUE] || 0);
  const attention =
    (totals?.[STATUS.RETURNED] || 0) + (totals?.[STATUS.REJECTED] || 0);

  return (
    <div className={styles.grid}>
      <StatCard
        icon={<FileText size={16} />}
        label="Total records"
        value={totals?.all || 0}
        isLoading={isLoading}
      />
      <StatCard
        icon={<ShieldCheck size={16} />}
        label="Published"
        value={totals?.[STATUS.PUBLISHED] || 0}
        isLoading={isLoading}
        iconColor="success"
      />
      <StatCard
        icon={<Clock3 size={16} />}
        label="In review"
        value={inReview}
        isLoading={isLoading}
        iconColor="info"
      />
      <StatCard
        icon={<AlertTriangle size={16} />}
        label="Needs attention"
        value={attention}
        isLoading={isLoading}
        iconColor={attention > 0 ? 'warning' : 'brand'}
      />
    </div>
  );
}
