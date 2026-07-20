import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, AlertCircle, RefreshCw, Printer } from 'lucide-react';

import Button from '@components/Button';
import Spinner from '@components/Spinner';
import Skeleton from '@components/Skeleton';
import EmptyState from '@components/EmptyState';

import { useAuth } from '@hooks/useAuth';
import {
  useGetAntiquityQuery,
  useGetRecordHistoryQuery,
  useForwardAntiquityMutation,
  useReturnAntiquityMutation,
  useRejectAntiquityMutation,
  usePublishAntiquityMutation,
} from './antiquitiesApi';
import { STATUS, CIRCLE } from './schema';
import { antiquityDetailConfig, fmtDate } from './detailConfig';
import { getDetailActions } from './detailPermissions';

import StatusPill from '@features/dashboard/components/StatusPill';
import RecordImageMat from './components/RecordImageMat';
import MetadataSections from './components/MetadataSections';
import WorkflowStepper from './components/WorkflowStepper';
import TrustAnchorCard from './components/TrustAnchorCard';
import DetailActionBar from './components/DetailActionBar';
import WorkflowActionModal from './components/WorkflowActionModal';
import PublishModal from './components/PublishModal';

import styles from './AntiquityDetailPage.module.css';

// Workflow transitions — used by the modals to preview the target status.
const NEXT_ON_FORWARD = {
  [STATUS.SUPERVISOR_REVIEW]: STATUS.ADMIN_REVIEW,
  [STATUS.ADMIN_REVIEW]: STATUS.PUBLISH_QUEUE,
};

const NEXT_ON_RETURN = {
  [STATUS.SUPERVISOR_REVIEW]: STATUS.RETURNED,
  [STATUS.ADMIN_REVIEW]: STATUS.SUPERVISOR_REVIEW,
  [STATUS.PUBLISH_QUEUE]: STATUS.ADMIN_REVIEW,
};

/**
 * AntiquityDetailPage — the record's home page.
 *
 * Layout:
 *   [ breadcrumb → title → metadata line ]              [ status pill ]
 *   ─────────────────────────────────────────────────────────────────
 *   [ image (matted) + metadata sections   ]  [ trust anchor card    ]
 *   [                                       ]  [ workflow history    ]
 *   ─────────────────────────────────────────────────────────────────
 *   [ status pill + status text          ] [ role-conditional actions ]  (sticky bar)
 *
 * The visual character comes from a few things doing quiet work together:
 * the matted image with an italic Georgia caption, the sectioned metadata
 * with serif subheadings, the gold-accented trust anchor card, and the
 * colored left borders on the workflow event timeline. No single element
 * shouts; the composition tells the story.
 */
export default function AntiquityDetailPage() {
  const { id } = useParams();
  const { user, role, can } = useAuth();

  const [forwardOpen, setForwardOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const { data: record, isLoading, isError, refetch } = useGetAntiquityQuery(id);

  const { data: history } = useGetRecordHistoryQuery(id, { skip: !record });

  const [forwardAntiquity] = useForwardAntiquityMutation();
  const [returnAntiquity] = useReturnAntiquityMutation();
  const [rejectAntiquity] = useRejectAntiquityMutation();
  const [publishAntiquity] = usePublishAntiquityMutation();

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className={styles.page}>
        <Breadcrumb />
        <Skeleton width={340} height={28} />
        <div style={{ height: 6 }} />
        <Skeleton width={220} height={14} />
        <div style={{ height: 24 }} />
        <Spinner centered label="Loading record" />
      </div>
    );
  }

  // ---- Error / not found ----
  if (isError || !record) {
    return (
      <div className={styles.page}>
        <Breadcrumb />
        <EmptyState
          icon={<AlertCircle size={32} />}
          title="Could not load this record"
          description={
            isError
              ? 'The record could not be fetched. It may have been deleted or your session may have expired.'
              : 'Record not found.'
          }
          action={
            <Button leftIcon={<RefreshCw size={14} />} onClick={refetch}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const actions = getDetailActions({ role, userId: user?.id, record, can });

  const doForward = (comment) =>
    forwardAntiquity({ id: record.id, comment }).unwrap();
  const doReturn = (comment) =>
    returnAntiquity({ id: record.id, comment }).unwrap();
  const doReject = (comment) =>
    rejectAntiquity({ id: record.id, comment }).unwrap();
  const doPublish = (comment) =>
    publishAntiquity({ id: record.id, comment }).unwrap();

  return (
    <div className={styles.page}>
      {/* ---- Header ---- */}
      <Breadcrumb />

      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>
            {record.title || 'Untitled record'}
          </h1>
          <div className={styles.subMeta}>
            <code className={styles.key}>
              {record.key_no || `#${record.id}`}
            </code>
            <span className={styles.sep}>·</span>
            <span>{CIRCLE[record.circle]?.name || record.circle || '—'}</span>
            {record.created_at && (
              <>
                <span className={styles.sep}>·</span>
                <span>Recorded {fmtDate(record.created_at)}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.headerRight} data-print-hide>
          <StatusPill status={record.status} />
          <button
            type="button"
            className={styles.printBtn}
            onClick={() => window.print()}
            aria-label="Print record"
            title="Print"
          >
            <Printer size={14} />
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      {/* ---- Workflow stepper (full width, above the grid) ---- */}
      <WorkflowStepper record={record} history={history || []} />

      {/* ---- Two-column body when the record has a Trust Anchor, single otherwise ---- */}
      {record.status === STATUS.PUBLISHED && record.blockchain_tx ? (
        <div className={styles.grid}>
          <div className={styles.content}>
            <RecordImageMat record={record} />
            <div style={{ height: 'var(--space-6)' }} />
            <MetadataSections
              config={antiquityDetailConfig}
              record={record}
            />
          </div>

          <aside className={styles.sidebar}>
            <TrustAnchorCard record={record} />
          </aside>
        </div>
      ) : (
        <div className={styles.content}>
          <RecordImageMat record={record} />
          <div style={{ height: 'var(--space-6)' }} />
          <MetadataSections
            config={antiquityDetailConfig}
            record={record}
          />
        </div>
      )}

      {/* ---- Sticky action bar ---- */}
      <div data-print-hide>
        <DetailActionBar
          record={record}
          actions={actions}
          onForward={() => setForwardOpen(true)}
          onReturn={() => setReturnOpen(true)}
          onReject={() => setRejectOpen(true)}
          onPublish={() => setPublishOpen(true)}
        />
      </div>

      {/* ---- Modals ---- */}
      <WorkflowActionModal
        action="forward"
        open={forwardOpen}
        onClose={() => setForwardOpen(false)}
        record={record}
        nextStatus={NEXT_ON_FORWARD[record.status]}
        onSubmit={doForward}
      />
      <WorkflowActionModal
        action="return"
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        record={record}
        nextStatus={NEXT_ON_RETURN[record.status]}
        onSubmit={doReturn}
      />
      <WorkflowActionModal
        action="reject"
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        record={record}
        nextStatus={STATUS.REJECTED}
        onSubmit={doReject}
      />
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        record={record}
        onPublish={doPublish}
      />
    </div>
  );
}

/** Small breadcrumb strip above the title. Sentence-case link, chevron, page name. */
function Breadcrumb() {
  return (
    <div className={styles.breadcrumb}>
      <Link to="/records/antiquities" className={styles.breadcrumbLink}>
        All antiquities
      </Link>
      <ChevronRight size={12} className={styles.breadcrumbSep} />
      <span>Record</span>
    </div>
  );
}
