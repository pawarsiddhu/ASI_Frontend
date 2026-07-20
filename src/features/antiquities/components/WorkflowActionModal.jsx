import { useEffect, useState } from 'react';
import { Send, Undo2, XCircle, AlertTriangle } from 'lucide-react';

import Modal from '@components/Modal';
import Button from '@components/Button';
import Textarea from '@components/Textarea';
import { useToast } from '@components/Toast';
import { STATUS_LABEL } from '../schema';
import styles from './WorkflowActionModal.module.css';

/**
 * WorkflowActionModal — a single modal for Forward, Return, and Reject actions.
 *
 * Each variant differs only in copy, icon, button tone, and the mutation used.
 * Comment is REQUIRED for all three (per SoW: workflow actions need justification).
 * Reject additionally shows a "this is permanent" warning.
 *
 * @param {object} props
 * @param {'forward'|'return'|'reject'} props.action
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.record - the antiquity record
 * @param {string} props.nextStatus - the target status after this action succeeds
 * @param {(comment: string) => Promise<any>} props.onSubmit - action mutation caller
 */

const VARIANT_META = {
  forward: {
    title: 'Forward for review',
    icon: Send,
    submitLabel: 'Forward',
    submitVariant: 'primary',
    placeholder: 'Note for the next reviewer (e.g. checked provenance, all fields verified)…',
    helper: 'Your note will be visible to the next reviewer in the audit trail.',
    successMsg: 'Record forwarded.',
    minLength: 4,
  },
  return: {
    title: 'Return for correction',
    icon: Undo2,
    submitLabel: 'Return',
    submitVariant: 'secondary',
    placeholder: 'What needs correcting? Be specific — the previous approver will see this.',
    helper: 'The record moves back one workflow level. Your comment is required.',
    successMsg: 'Record returned for correction.',
    minLength: 6,
  },
  reject: {
    title: 'Reject record',
    icon: XCircle,
    submitLabel: 'Reject',
    submitVariant: 'danger',
    placeholder: 'Reason for rejection. This is permanent and visible in the audit trail.',
    helper: 'Rejected records cannot be reopened. Reason is required.',
    successMsg: 'Record rejected.',
    minLength: 10,
  },
};

export default function WorkflowActionModal({
  action,
  open,
  onClose,
  record,
  nextStatus,
  onSubmit,
}) {
  const meta = VARIANT_META[action];
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Reset state whenever the modal opens
  useEffect(() => {
    if (open) {
      setComment('');
      setError('');
      setSubmitting(false);
    }
  }, [open]);

  if (!meta) return null;

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    if (trimmed.length < meta.minLength) {
      setError(
        `Please provide at least ${meta.minLength} characters explaining your ${action}.`
      );
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(trimmed);
      toast.success(meta.successMsg);
      onClose();
    } catch (err) {
      const msg =
        err?.data?.message ||
        `Could not ${action} the record. Please try again.`;
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = meta.icon;

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={meta.title}
      size="md"
    >
      <Modal.Body>
        <div className={styles.heading}>
          <div className={`${styles.iconBadge} ${styles[`iconBadge_${action}`]}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className={styles.recordName}>{record.title || `#${record.id}`}</p>
            <p className={styles.recordMeta}>
              <code>{record.key_no || record.accession_number || `#${record.id}`}</code> ·{' '}
              {STATUS_LABEL[record.status]}
            </p>
          </div>
        </div>

        {nextStatus && action !== 'reject' && (
          <div className={styles.transition}>
            <span className={styles.transLabel}>Will move to:</span>
            <span className={styles.transTarget}>
              {STATUS_LABEL[nextStatus]}
            </span>
          </div>
        )}

        {action === 'reject' && (
          <div className={styles.warning}>
            <AlertTriangle size={16} />
            <span>
              Rejection is <strong>permanent</strong>. The record cannot be
              re-forwarded once rejected.
            </span>
          </div>
        )}

        <div className={styles.commentBlock}>
          <Textarea
            label={
              action === 'reject'
                ? 'Reason for rejection'
                : action === 'return'
                ? 'What needs correcting?'
                : 'Note for next reviewer'
            }
            required
            rows={5}
            placeholder={meta.placeholder}
            helperText={!error ? meta.helper : undefined}
            error={error}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              if (error) setError('');
            }}
            disabled={submitting}
            maxLength={2000}
          />
          <p className={styles.counter}>
            {comment.length}/2000 characters
          </p>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          variant={meta.submitVariant}
          onClick={handleSubmit}
          loading={submitting}
          leftIcon={<Icon size={14} />}
        >
          {meta.submitLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
