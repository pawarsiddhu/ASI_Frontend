import { STATUS } from './schema';
import { ROLES } from '@utils/constants';

/**
 * Detail-page action availability.
 *
 * The permissions matrix in @utils/permissions answers "can this role do X at all".
 * This file answers the follow-up: "can this role do X on THIS specific record
 * at THIS specific status, and is the record actually at their approval stage?"
 *
 * Returned actions are surfaced by <DetailActionBar>. If a role can't take any
 * workflow action on a record, the bar shows nothing (except Edit if allowed).
 *
 * @param {object} args
 * @param {string} args.role - user's role
 * @param {string} args.userId - user's id (for owner checks)
 * @param {object} args.record - the antiquity record
 * @param {(perm: string) => boolean} args.can - permission checker
 * @returns {{
 *   canEdit: boolean,
 *   canForward: boolean,
 *   canReturn: boolean,
 *   canReject: boolean,
 *   canPublish: boolean,
 *   isCurrentReviewer: boolean,
 *   isOwner: boolean,
 *   isTerminal: boolean,
 * }}
 */
export function getDetailActions({ role, userId, record, can }) {
  // Backend records carry `created_by` as an integer user id. The old shape
  // was `recordedBy: { id, name }` — no longer.
  const isOwner = record.created_by != null && record.created_by === userId;
  const isTerminal =
    record.status === STATUS.PUBLISHED || record.status === STATUS.REJECTED;

  // ---- Who is the "current reviewer" for this status? ----
  // Applies to workflow actions (forward/return/reject). If the current user
  // isn't the reviewer at this stage, we don't offer workflow actions —
  // they're just looking at someone else's work.
  const stageReviewer = {
    [STATUS.DRAFT]: ROLES.OPERATOR,
    [STATUS.RETURNED]: ROLES.OPERATOR,
    [STATUS.SUPERVISOR_REVIEW]: ROLES.SUPERVISOR,
    [STATUS.ADMIN_REVIEW]: ROLES.ADMIN,
    [STATUS.PUBLISH_QUEUE]: ROLES.SUPERADMIN,
  }[record.status];

  const isCurrentReviewer = stageReviewer === role;

  // ---- Edit ----
  //
  // Enabled now that the backend exposes PUT /records/:id.
  // Rules must mirror `assertCanEdit` in the backend service so the UI never
  // shows a button that would 403:
  //
  //   OPERATOR   : own record, status DRAFT or RETURNED
  //   ADMIN      : any record, status PENDING_ADMIN
  //   SUPERADMIN : any record, status PENDING_SUPERADMIN
  //   SUPERVISOR : never (they review; they don't edit)
  //   RD         : never (read-only oversight)
  //   TERMINAL (PUBLISHED / REJECTED) : never for anyone
  let canEdit = false;
  if (!isTerminal) {
    if (role === ROLES.OPERATOR) {
      canEdit =
        isOwner &&
        (record.status === STATUS.DRAFT || record.status === STATUS.RETURNED);
    } else if (role === ROLES.ADMIN) {
      canEdit = record.status === STATUS.ADMIN_REVIEW;
    } else if (role === ROLES.SUPERADMIN) {
      canEdit = record.status === STATUS.PUBLISH_QUEUE;
    }
  }

  // ---- Forward ----
  // Only from draft/returned (Operator) or supervisor_review (Supervisor) or
  // admin_review (Admin). Publish_queue uses Publish, not Forward.
  // Draft/returned forwarding happens on the Edit page (Save & Forward),
  // not the detail page — so we only show Forward here for the reviewer stages.
  const canForward =
    can('record.forward') &&
    isCurrentReviewer &&
    (record.status === STATUS.SUPERVISOR_REVIEW ||
      record.status === STATUS.ADMIN_REVIEW);

  // ---- Return ----
  // From supervisor_review, admin_review, or publish_queue — by the reviewer at that stage.
  const canReturn =
    can('record.return') &&
    isCurrentReviewer &&
    (record.status === STATUS.SUPERVISOR_REVIEW ||
      record.status === STATUS.ADMIN_REVIEW ||
      record.status === STATUS.PUBLISH_QUEUE);

  // ---- Reject ----
  // Same stages as return. Terminal action.
  const canReject =
    can('record.reject') &&
    isCurrentReviewer &&
    (record.status === STATUS.SUPERVISOR_REVIEW ||
      record.status === STATUS.ADMIN_REVIEW ||
      record.status === STATUS.PUBLISH_QUEUE);

  // ---- Publish ----
  // Only Super Admin, only from publish_queue.
  const canPublish =
    can('record.publish') && record.status === STATUS.PUBLISH_QUEUE;

  return {
    canEdit,
    canForward,
    canReturn,
    canReject,
    canPublish,
    isCurrentReviewer,
    isOwner,
    isTerminal,
  };
}
