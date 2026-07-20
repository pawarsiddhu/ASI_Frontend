import { useNavigate } from 'react-router-dom';
import {
  Pencil,
  Send,
  Undo2,
  XCircle,
  ShieldCheck,
  Eye,
} from 'lucide-react';

import Button from '@components/Button';
import Badge from '@components/Badge';
import StatusBadge from './StatusBadge';
import styles from './DetailActionBar.module.css';

/**
 * DetailActionBar — sticky action bar at the bottom of the detail page.
 *
 * Shows only actions the user CAN take on THIS record at THIS status
 * (determined by getDetailActions upstream). If no actions apply, the bar
 * still appears but only shows the current status — this keeps the reader
 * oriented ("I'm just viewing").
 *
 * Layout:
 *   [status pill + record name]                [Edit] [Return] [Reject] [Forward | Publish]
 *
 * The primary action (Forward or Publish) is right-most and uses the primary
 * button variant to lead the eye.
 */
export default function DetailActionBar({
  record,
  actions,
  onForward,
  onReturn,
  onReject,
  onPublish,
}) {
  const navigate = useNavigate();

  const {
    canEdit,
    canForward,
    canReturn,
    canReject,
    canPublish,
    isCurrentReviewer,
    isTerminal,
  } = actions;

  const hasAnyAction =
    canEdit || canForward || canReturn || canReject || canPublish;

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <StatusBadge status={record.status} />
        {isTerminal && (
          <Badge size="sm" variant="default">
            Terminal
          </Badge>
        )}
        {!hasAnyAction && !isCurrentReviewer && !isTerminal && (
          <span className={styles.viewOnly}>
            <Eye size={12} />
            <span>View only — record is with another reviewer</span>
          </span>
        )}
      </div>

      <div className={styles.right}>
        {canEdit && (
          <Button
            variant="secondary"
            leftIcon={<Pencil size={14} />}
            onClick={() => navigate(`/records/antiquities/${record.id}/edit`)}
          >
            Edit
          </Button>
        )}

        {canReject && (
          <Button
            variant="danger"
            leftIcon={<XCircle size={14} />}
            onClick={onReject}
          >
            Reject
          </Button>
        )}

        {canReturn && (
          <Button
            variant="secondary"
            leftIcon={<Undo2 size={14} />}
            onClick={onReturn}
          >
            Return
          </Button>
        )}

        {canForward && (
          <Button
            variant="primary"
            leftIcon={<Send size={14} />}
            onClick={onForward}
          >
            Forward
          </Button>
        )}

        {canPublish && (
          <Button
            variant="primary"
            leftIcon={<ShieldCheck size={14} />}
            onClick={onPublish}
          >
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}
