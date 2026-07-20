import { useEffect, useState } from 'react';
import { ShieldCheck, CloudOff, RefreshCw } from 'lucide-react';

import Modal from '@components/Modal';
import Button from '@components/Button';
import Textarea from '@components/Textarea';
import { useToast } from '@components/Toast';
import styles from './PublishModal.module.css';

/**
 * PublishModal — SUPERADMIN publish flow.
 *
 * The earlier version had a "success step" that rendered a made-up TX hash,
 * IPFS CID, block number and network label. Those were mock-only inventions
 * that never came from the real backend, and displaying them alongside the
 * real ledger metadata on the detail page would have been misleading. That
 * step has been removed.
 *
 * New flow:
 *
 *   CONFIRM
 *     User reads a short explanation of what publish does + writes an
 *     optional note. "Publish" hits POST /records/:id/publish.
 *
 *   On 200 (success):
 *     Modal closes, a toast confirms, the detail page's RTK Query cache is
 *     invalidated so the record refetches with its real `blockchain_tx`
 *     populated. The Trust Anchor sidebar card then renders the real
 *     ledger metadata — no fake numbers ever hit the UI.
 *
 *   On 503 (ledger unreachable):
 *     Modal transitions to the UNAVAILABLE step — record is untouched on
 *     the backend, safe to retry. The step surfaces a Retry button that
 *     re-fires the same POST. This is the only error state that gets its
 *     own screen because it's the one the operator can actually recover
 *     from without leaving the page.
 *
 *   On any other error (403 / 404 / 409 / network):
 *     Inline error message on the confirm step. The buttons stay the same
 *     — Cancel closes, Publish retries.
 *
 * The onPublish prop is expected to `.unwrap()` the RTK mutation so
 * network errors bubble up here as thrown values with `.status` and
 * `.data.message`.
 */
export default function PublishModal({ open, onClose, record, onPublish }) {
  const [step, setStep] = useState('confirm'); // 'confirm' | 'unavailable'
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  // Reset local state whenever the modal opens. If the user cancelled mid-flow
  // and reopens, they get a fresh confirm step — not a stale unavailable
  // banner from the previous attempt.
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setComment('');
      setSubmitting(false);
      setError('');
    }
  }, [open]);

  const handlePublish = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onPublish(comment.trim() || undefined);
      toast.success('Record published and anchored on ledger.');
      onClose();
    } catch (err) {
      // Distinct handling for 503 — that's the state the user can retry
      // from without any prep. Everything else is an inline error on the
      // confirm step, so the user can adjust the note or cancel.
      if (err?.status === 503) {
        setStep('unavailable');
      } else {
        const msg =
          err?.data?.message ||
          'Could not publish the record. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Backdrop / Esc closing is disabled during in-flight submits to prevent
  // dropping a request mid-anchor. On the unavailable step it's fine to
  // click away — the record is untouched.
  const canDismiss = !submitting;

  return (
    <Modal
      open={open}
      onClose={canDismiss ? onClose : () => {}}
      title={step === 'confirm' ? 'Publish record' : 'Ledger unreachable'}
      size="md"
      closeOnBackdrop={canDismiss}
    >
      {step === 'confirm' ? (
        <ConfirmStep
          record={record}
          comment={comment}
          onCommentChange={setComment}
          onPublish={handlePublish}
          onCancel={onClose}
          submitting={submitting}
          error={error}
        />
      ) : (
        <UnavailableStep
          onRetry={() => {
            // Retry from the unavailable step lands back on the confirm
            // step's submission path — same body, same expectations.
            setStep('confirm');
            handlePublish();
          }}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Step: Confirm
// ---------------------------------------------------------------------------
function ConfirmStep({
  record,
  comment,
  onCommentChange,
  onPublish,
  onCancel,
  submitting,
  error,
}) {
  return (
    <>
      <Modal.Body>
        <div className={styles.confirmHead}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className={styles.recordName}>
              {record?.title || `#${record?.id}`}
            </p>
            <p className={styles.recordMeta}>
              <code>
                {record?.key_no || record?.accession_number || `#${record?.id}`}
              </code>
            </p>
          </div>
        </div>

        <p className={styles.leadCopy}>Publishing this record will:</p>
        <ul className={styles.stepsList}>
          <li>
            <span className={styles.stepDot}>1</span>
            <span>
              Anchor the record and its image on the ASI permissioned Fabric
              ledger, producing an immutable transaction id.
            </span>
          </li>
          <li>
            <span className={styles.stepDot}>2</span>
            <span>
              Mark the record <strong>published</strong> — it becomes the
              authoritative version and cannot be edited from the workflow.
            </span>
          </li>
          <li>
            <span className={styles.stepDot}>3</span>
            <span>
              Enable one-click <em>Verify</em> on the detail page so any
              reviewer can re-check integrity at any time.
            </span>
          </li>
        </ul>

        <Textarea
          label="Publish note (optional)"
          rows={3}
          placeholder="Optional note for the audit trail (e.g. Final review complete)"
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          disabled={submitting}
          maxLength={500}
        />

        {error && <p className={styles.errorLine}>{error}</p>}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={onPublish}
          loading={submitting}
          leftIcon={<ShieldCheck size={14} />}
        >
          {submitting ? 'Anchoring to ledger…' : 'Publish record'}
        </Button>
      </Modal.Footer>
    </>
  );
}

// ---------------------------------------------------------------------------
// Step: Unavailable (503)
// ---------------------------------------------------------------------------
function UnavailableStep({ onRetry, onClose }) {
  return (
    <>
      <Modal.Body>
        <div className={styles.unavailableHead}>
          <div className={styles.unavailableIcon}>
            <CloudOff size={28} />
          </div>
          <h3 className={styles.unavailableTitle}>
            The ledger gateway is not responding
          </h3>
          <p className={styles.unavailableSub}>
            The record has <strong>not</strong> been changed. Publish is safe
            to retry — no partial state was written.
          </p>
        </div>

        <ul className={styles.unavailableList}>
          <li>The Fabric gateway may be restarting or unreachable.</li>
          <li>Retry in a few moments to try anchoring again.</li>
          <li>
            If the issue persists, contact the system administrator to check
            the ledger service.
          </li>
        </ul>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onRetry} leftIcon={<RefreshCw size={14} />}>
          Retry publish
        </Button>
      </Modal.Footer>
    </>
  );
}
