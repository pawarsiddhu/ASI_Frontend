import { STATUS, STATUS_LABEL } from '@features/antiquities/schema';
import styles from './StatusPill.module.css';

/**
 * StatusPill — small uppercase pill for a record's workflow status.
 *
 * Uses the ASI status color mapping (teal = success/moved forward or published,
 * amber = returned, danger = rejected, neutral = draft, brand = in-review).
 * Consistent across hero list, detail page, and any tables.
 */
const TONE = {
  [STATUS.DRAFT]: 'neutral',
  [STATUS.SUPERVISOR_REVIEW]: 'brand',
  [STATUS.ADMIN_REVIEW]: 'brand',
  [STATUS.PUBLISH_QUEUE]: 'brand',
  [STATUS.PUBLISHED]: 'success',
  [STATUS.RETURNED]: 'warning',
  [STATUS.REJECTED]: 'danger',
};

const SHORT_LABEL = {
  [STATUS.DRAFT]: 'DRAFT',
  [STATUS.SUPERVISOR_REVIEW]: 'AT SUPERVISOR',
  [STATUS.ADMIN_REVIEW]: 'AT ADMIN',
  [STATUS.PUBLISH_QUEUE]: 'AT SUPERADMIN',
  [STATUS.PUBLISHED]: 'PUBLISHED',
  [STATUS.RETURNED]: 'RETURNED',
  [STATUS.REJECTED]: 'REJECTED',
};

export default function StatusPill({ status, compact = false }) {
  const tone = TONE[status] || 'neutral';
  const label = compact
    ? SHORT_LABEL[status] || status
    : (SHORT_LABEL[status] || STATUS_LABEL[status] || status);

  return (
    <span
      className={styles.pill}
      data-tone={tone}
    >
      {label}
    </span>
  );
}
