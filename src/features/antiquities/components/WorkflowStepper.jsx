import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  CircleDashed,
  X,
  Undo2,
  Pencil,
  Circle,
  User,
  Eye,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { STATUS } from '@features/antiquities/schema';
import styles from './WorkflowStepper.module.css';

/**
 * WorkflowStepper — horizontal stage bar shown at the top of the record
 * detail page, between the header and the content grid.
 *
 * Replaces the sidebar timeline the reviewer disliked. Reads as a checkout-
 * style progress indicator: reviewer sees at a glance where the record is in
 * its journey and who has touched it.
 *
 * Design decisions:
 *   - 5 stages in the "happy path" — Created → Supervisor → Admin →
 *     SuperAdmin → Published. This is the canonical ASI approval flow.
 *   - RETURNED is not its own stage; it's a state annotation on the stage
 *     the record was at when it was returned. Rendered as a "returned" arrow
 *     hanging below that stage.
 *   - REJECTED replaces the terminal stage. If the record was rejected at
 *     ADMIN level, the ADMIN stage takes a red "rejected" treatment and
 *     downstream stages fade out.
 *   - Clicking any completed stage expands a note panel below the stepper
 *     showing the note left at that step (if any). This is where reviewers
 *     see the "please attach dimensions" kind of feedback.
 *   - EDIT events do NOT get their own stage — they don't change workflow
 *     position. Instead the current-stage node grows a small pencil badge
 *     when the record has been edited since it arrived at that stage.
 *
 * Props:
 *   @param {object} record - the record itself. We derive current stage from
 *     record.status + record.current_level.
 *   @param {Array} history - array of HistoryRow objects from
 *     GET /records/:id/history, oldest first.
 */

const STAGES = [
  { key: 'CREATED',    label: 'Created',       role: 'OPERATOR',   icon: User },
  { key: 'SUPERVISOR', label: 'Supervisor',    role: 'SUPERVISOR', icon: Eye },
  { key: 'ADMIN',      label: 'Admin',         role: 'ADMIN',      icon: ShieldCheck },
  { key: 'SUPERADMIN', label: 'Super Admin',   role: 'SUPERADMIN', icon: Crown },
  { key: 'PUBLISHED',  label: 'Published',     role: 'SUPERADMIN', icon: Check },
];

// Map record.status → the "current" stage index in STAGES.
// A record at PENDING_SUPERVISOR means "moved past Created, waiting at Supervisor".
const STATUS_TO_STAGE_INDEX = {
  [STATUS.DRAFT]:              0, // still at Created
  [STATUS.SUPERVISOR_REVIEW]:  1,
  [STATUS.ADMIN_REVIEW]:       2,
  [STATUS.PUBLISH_QUEUE]:      3,
  [STATUS.PUBLISHED]:          5, // terminal-success — every stage reads as complete
  [STATUS.RETURNED]:           0, // sits back at Created (the operator has it)
  [STATUS.REJECTED]:          -1, // handled specially
};

// Small role -> avatar-color mapping so the stage node color hints who owns it.
const ROLE_TINT = {
  OPERATOR:   'operator',
  SUPERVISOR: 'supervisor',
  ADMIN:      'admin',
  SUPERADMIN: 'superadmin',
};

export default function WorkflowStepper({ record, history = [] }) {
  const [selectedStage, setSelectedStage] = useState(null);

  const currentIndex = STATUS_TO_STAGE_INDEX[record.status] ?? 0;
  const isRejected = record.status === STATUS.REJECTED;
  const isReturned = record.status === STATUS.RETURNED;

  // For rejected records, find the level it was rejected at so we can
  // highlight that stage in red rather than the top of the flow.
  const rejectionStageIndex = useMemo(() => {
    if (!isRejected) return -1;
    const rejectRow = [...history].reverse().find((h) => h.action === 'REJECT');
    if (!rejectRow) return 1;
    // The rejecter is at from_level; that's the stage that gets the red X.
    const map = { SUPERVISOR: 1, ADMIN: 2, SUPERADMIN: 3 };
    return map[rejectRow.from_level] ?? 1;
  }, [isRejected, history]);

  // Notes for each stage — pulled from history rows. Multiple rows may map
  // to the same stage (e.g. two FORWARDs from Supervisor after a return);
  // we keep them all and show them as a small list when the stage is clicked.
  const notesByStage = useMemo(() => {
    const out = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    for (const row of history) {
      if (!row.note) continue;
      // Stage where the action happened (from_level).
      const map = { OPERATOR: 0, SUPERVISOR: 1, ADMIN: 2, SUPERADMIN: 3 };
      const idx = map[row.from_level];
      if (idx !== undefined) {
        out[idx].push(row);
      }
    }
    return out;
  }, [history]);

  // Timestamp for each stage — the latest history row that involved that stage.
  const timestampByStage = useMemo(() => {
    const out = {};
    for (const row of history) {
      const map = { OPERATOR: 0, SUPERVISOR: 1, ADMIN: 2, SUPERADMIN: 3 };
      const idx = map[row.from_level];
      if (idx !== undefined) out[idx] = row.created_at;
    }
    // Published stage gets the PUBLISH row's timestamp.
    const pub = [...history].reverse().find((h) => h.action === 'PUBLISH');
    if (pub) out[4] = pub.created_at;
    return out;
  }, [history]);

  return (
    <div className={styles.wrapper}>
      <ol className={styles.rail}>
        {STAGES.map((stage, i) => {
          const isRejectStage = isRejected && i === rejectionStageIndex;
          const isTerminalAfterReject = isRejected && i > rejectionStageIndex;

          let state;
          if (isRejectStage) state = 'rejected';
          else if (isTerminalAfterReject) state = 'aborted';
          else if (i < currentIndex) state = 'complete';
          else if (i === currentIndex && !isRejected) state = 'current';
          else state = 'pending';

          const notes = notesByStage[i] || [];
          const timestamp = timestampByStage[i];

          return (
            <li key={stage.key} className={styles.stageWrap}>
              <StageNode
                stage={stage}
                state={state}
                index={i}
                totalNotes={notes.length}
                timestamp={timestamp}
                isReturned={isReturned && i === 0}
                selected={selectedStage === i}
                onClick={() =>
                  setSelectedStage((cur) => (cur === i ? null : i))
                }
              />
              {i < STAGES.length - 1 && (
                <div
                  className={`${styles.connector} ${styles[`connector_${state}`] || ''}`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      {selectedStage !== null && (
        <StageDetail
          stage={STAGES[selectedStage]}
          notes={notesByStage[selectedStage] || []}
          timestamp={timestampByStage[selectedStage]}
          onClose={() => setSelectedStage(null)}
        />
      )}

      {/* Returned-badge callout — sits below the stepper if the record is
          returned, since the stepper alone can't fully convey that state.
          Contains the actual return note for immediate visibility. */}
      {isReturned && <ReturnedCallout history={history} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StageNode — one stage circle + label + optional metadata
// ---------------------------------------------------------------------------
function StageNode({
  stage,
  state,
  index,
  totalNotes,
  timestamp,
  isReturned,
  selected,
  onClick,
}) {
  const StageIcon = stage.icon;
  const NodeIcon =
    state === 'complete'  ? Check :
    state === 'current'   ? Clock :
    state === 'rejected'  ? X :
    state === 'aborted'   ? CircleDashed :
                            StageIcon;

  return (
    <button
      type="button"
      className={[
        styles.stageBtn,
        styles[`stage_${state}`] || '',
        selected ? styles.stageSelected : '',
      ].join(' ')}
      onClick={onClick}
      aria-current={state === 'current' ? 'step' : undefined}
      aria-label={`${stage.label} (${state})`}
    >
      <span
        className={styles.node}
        data-tint={ROLE_TINT[stage.role] || 'operator'}
      >
        <NodeIcon size={16} strokeWidth={2.5} />
      </span>
      <span className={styles.stageBody}>
        <span className={styles.stageLabel}>{stage.label}</span>
        <span className={styles.stageMeta}>
          {state === 'current' && (isReturned ? 'Returned — needs correction' : 'In progress')}
          {state === 'complete' && (timestamp ? fmtRelative(timestamp) : 'Done')}
          {state === 'rejected' && 'Rejected here'}
          {state === 'aborted' && 'Not reached'}
          {state === 'pending' && 'Waiting'}
        </span>
        {totalNotes > 0 && (
          <span className={styles.notesBadge}>
            {totalNotes} note{totalNotes === 1 ? '' : 's'}
          </span>
        )}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// StageDetail — expanded panel below the stepper showing notes at a stage
// ---------------------------------------------------------------------------
function StageDetail({ stage, notes, timestamp, onClose }) {
  return (
    <div className={styles.detail}>
      <div className={styles.detailHead}>
        <div>
          <div className={styles.detailStage}>{stage.label}</div>
          {timestamp && (
            <div className={styles.detailTs}>{fmtFullDateTime(timestamp)}</div>
          )}
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close notes"
        >
          <X size={14} />
        </button>
      </div>

      {notes.length === 0 ? (
        <p className={styles.detailEmpty}>
          No notes were left at this stage.
        </p>
      ) : (
        <ul className={styles.noteList}>
          {notes.map((n) => (
            <li key={n.id} className={styles.noteItem}>
              <div className={styles.noteHead}>
                <span className={styles.noteAction} data-action={n.action}>
                  {ACTION_LABEL[n.action] || n.action}
                </span>
                <span className={styles.noteBy}>
                  by {n.actor_role || 'System'}
                </span>
                <span className={styles.noteTime}>
                  {fmtRelative(n.created_at)}
                </span>
              </div>
              <blockquote className={styles.noteQuote}>{n.note}</blockquote>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReturnedCallout — persistent notice when record is in RETURNED state
// ---------------------------------------------------------------------------
function ReturnedCallout({ history }) {
  // Find the most recent RETURN event — that carries the reviewer's note.
  const latestReturn = useMemo(
    () => [...history].reverse().find((h) => h.action === 'RETURN'),
    [history]
  );
  if (!latestReturn) return null;

  return (
    <div className={styles.returnedCallout}>
      <Undo2 size={16} className={styles.returnedIcon} />
      <div className={styles.returnedBody}>
        <div className={styles.returnedTitle}>
          Returned by {latestReturn.actor_role || 'reviewer'}
          <span className={styles.returnedSep}>·</span>
          <span className={styles.returnedTs}>
            {fmtRelative(latestReturn.created_at)}
          </span>
        </div>
        {latestReturn.note && (
          <blockquote className={styles.returnedNote}>
            {latestReturn.note}
          </blockquote>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utils
// ---------------------------------------------------------------------------
const ACTION_LABEL = {
  CREATE:  'Created',
  FORWARD: 'Forwarded',
  RETURN:  'Returned',
  REJECT:  'Rejected',
  PUBLISH: 'Published',
  EDIT:    'Edited',
};

const DT_FMT = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function fmtFullDateTime(iso) {
  if (!iso) return '';
  return DT_FMT.format(new Date(iso));
}

function fmtRelative(iso) {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}
