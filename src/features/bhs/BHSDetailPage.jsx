import { Fragment, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RotateCw, Printer } from 'lucide-react';

import Card from '@components/Card';
import Button from '@components/Button';
import Spinner from '@components/Spinner';
import Skeleton from '@components/Skeleton';
import EmptyState from '@components/EmptyState';
import { LocationMapView } from '@components/LocationMap';

import { useAuth } from '@hooks/useAuth';
import {
  useGetBHSQuery,
  useGetBHSHistoryQuery,
  useForwardBHSMutation,
  useReturnBHSMutation,
  useRejectBHSMutation,
  usePublishBHSMutation,
} from './bhsApi';
import { STATUS, CIRCLE } from './schema';
import { bhsDetailConfig } from './detailConfig';
// Permissions matrix is type-agnostic — same workflow, same rules for both types.
import { getDetailActions } from '@features/antiquities/detailPermissions';
import { imageSrc } from '@utils/imageSrc';

// Shared UI components — type-agnostic, imported from antiquities feature.
import DetailSection from '@features/antiquities/components/DetailSection';
import ImageGallery from '@features/antiquities/components/ImageGallery';
import WorkflowStepper from '@features/antiquities/components/WorkflowStepper';
import DetailActionBar from '@features/antiquities/components/DetailActionBar';
import WorkflowActionModal from '@features/antiquities/components/WorkflowActionModal';
import PublishModal from '@features/antiquities/components/PublishModal';
import TrustAnchorCard from '@features/antiquities/components/TrustAnchorCard';
import StatusBadge from '@features/antiquities/components/StatusBadge';

import styles from './BHSDetailPage.module.css';

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
 * Small helper: renders the config-driven detail sections, and when it reaches
 * the Location section it appends a map viewer directly below it. Keeps the
 * two layout branches (published/sidebar vs full-width) DRY.
 */
function DetailSectionsWithMap({ record }) {
  return (
    <>
      {bhsDetailConfig.sections.map((section) => (
        <Fragment key={section.id}>
          <DetailSection
            title={section.title}
            icon={section.icon}
            fields={section.fields}
            record={record}
          />
          {section.id === 'location' && (
            <Card>
              <Card.Body>
                <LocationMapView
                  latitude={record.latitude}
                  longitude={record.longitude}
                  title={record.title}
                />
              </Card.Body>
            </Card>
          )}
        </Fragment>
      ))}
    </>
  );
}

export default function BHSDetailPage() {
  const { id } = useParams();
  const { user, role, can } = useAuth();

  const [forwardOpen, setForwardOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const { data: record, isLoading, isError, refetch } = useGetBHSQuery(id);

  const {
    data: history,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
  } = useGetBHSHistoryQuery(id, { skip: !record });

  const [forwardBHS] = useForwardBHSMutation();
  const [returnBHS] = useReturnBHSMutation();
  const [rejectBHS] = useRejectBHSMutation();
  const [publishBHS] = usePublishBHSMutation();

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <Link to="/records/bhs" className={styles.backLink}>
              <ArrowLeft size={12} />
              <span>Back to Built Heritage</span>
            </Link>
            <Skeleton width={280} height={24} />
            <div style={{ height: 8 }} />
            <Skeleton width={180} height={14} />
          </div>
        </div>
        <Card>
          <Card.Body>
            <Spinner centered label="Loading record" />
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className={styles.wrapper}>
        <Link to="/records/bhs" className={styles.backLink}>
          <ArrowLeft size={12} />
          <span>Back to Built Heritage</span>
        </Link>
        <Card>
          <Card.Body>
            <EmptyState
              icon={<AlertCircle size={28} />}
              title="Could not load this record"
              description={
                isError
                  ? 'The record could not be fetched. It may have been deleted or your session may have expired.'
                  : 'Record not found.'
              }
              action={
                <Button
                  variant="secondary"
                  leftIcon={<RotateCw size={14} />}
                  onClick={refetch}
                >
                  Retry
                </Button>
              }
            />
          </Card.Body>
        </Card>
      </div>
    );
  }

  const actions = getDetailActions({ role, userId: user?.id, record, can });

  const doForward = (comment) =>
    forwardBHS({ id: record.id, comment }).unwrap();
  const doReturn = (comment) =>
    returnBHS({ id: record.id, comment }).unwrap();
  const doReject = (comment) =>
    rejectBHS({ id: record.id, comment }).unwrap();
  const doPublish = (comment) =>
    publishBHS({ id: record.id, comment }).unwrap();

  const isPublished = record.status === STATUS.PUBLISHED;
  const isRejected = record.status === STATUS.REJECTED;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div className={styles.headerMain}>
          <Link to="/records/bhs" className={styles.backLink} data-print-hide>
            <ArrowLeft size={12} />
            <span>Back to Built Heritage</span>
          </Link>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{record.title || 'Untitled record'}</h1>
            <StatusBadge status={record.status} />
          </div>
          <div className={styles.subMeta}>
            <code className={styles.accessionCode}>
              {record.bh_code || `#${record.id}`}
            </code>
            <span className={styles.metaSep}>·</span>
            <span>{CIRCLE[record.circle]?.name || record.circle || '—'}</span>
            {record.state && (
              <>
                <span className={styles.metaSep}>·</span>
                <span>{record.state}</span>
              </>
            )}
            {record.created_by != null && (
              <>
                <span className={styles.metaSep}>·</span>
                <span>Recorded by user #{record.created_by}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.headerActions} data-print-hide>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer size={12} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </div>

      {isRejected && (
        <div className={styles.terminalBanner + ' ' + styles.terminalReject}>
          <AlertCircle size={16} />
          <span>
            This record has been <strong>rejected</strong>. It cannot be edited
            or reopened. See the workflow stepper above for the rejection stage
            and reviewer notes.
          </span>
        </div>
      )}

      <WorkflowStepper record={record} history={history || []} />

      {isPublished && record.blockchain_tx ? (
        <div className={styles.grid}>
          <div className={styles.content}>
            <ImageGallery images={imageSrc(record) ? [imageSrc(record)] : []} />
            <DetailSectionsWithMap record={record} />
          </div>
          <aside className={styles.sidebar}>
            <TrustAnchorCard record={record} />
          </aside>
        </div>
      ) : (
        <div className={styles.contentFull}>
          <ImageGallery images={imageSrc(record) ? [imageSrc(record)] : []} />
          <DetailSectionsWithMap record={record} />
        </div>
      )}

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
