import Badge from '@components/Badge';
import { STATUS_LABEL, STATUS_BADGE_VARIANT } from '../schema';

/**
 * StatusBadge — pass a status enum value, get a labelled badge with the
 * right color mapping. Used in tables, filters, and the detail page.
 *
 * @param {object} props
 * @param {string} props.status
 * @param {'sm' | 'md'} [props.size='sm']
 */
export default function StatusBadge({ status, size = 'sm' }) {
  const variant = STATUS_BADGE_VARIANT[status] || 'default';
  const label = STATUS_LABEL[status] || status;
  return (
    <Badge variant={variant} size={size} dot>
      {label}
    </Badge>
  );
}
