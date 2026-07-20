import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import Card from '@components/Card';
import Button from '@components/Button';
import Spinner from '@components/Spinner';
import EmptyState from '@components/EmptyState';
import { useToast } from '@components/Toast';

import AntiquityForm from './AntiquityForm';
import {
  useGetAntiquityQuery,
  useUpdateAntiquityMutation,
  useForwardAntiquityMutation,
} from './antiquitiesApi';
import { STATUS } from './schema';
import { imageSrc } from '@utils/imageSrc';

import styles from './AntiquityEditPage.module.css';

/**
 * AntiquityEditPage — hydrates the shared AntiquityForm with the record from
 * GET /records/:id and submits changes via PUT /records/:id.
 *
 * The image slot in the form starts EMPTY, not with the existing image. Two
 * reasons:
 *   1. The uploaded File object can't be reconstructed from a URL — the
 *      form's image state is meant for freshly-picked files, not display.
 *   2. The backend keeps the existing image_path when no new file is sent,
 *      so leaving the slot empty is exactly what we want unless the user
 *      chooses to replace the picture.
 * The current image is shown in the sidebar/preview elsewhere on the detail
 * page — this edit page is deliberately focused on field changes.
 *
 * For RETURNED records, we pass `onForward` so the user can save-and-forward
 * in one step (the returning-operator flow). For records at PENDING_ADMIN
 * or PENDING_SUPERADMIN (Admin/SuperAdmin editing at their own level), we
 * don't offer forward — those roles use the workflow buttons on the detail
 * page instead.
 */
export default function AntiquityEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: record, isLoading, isError, refetch } = useGetAntiquityQuery(id);
  const [updateAntiquity] = useUpdateAntiquityMutation();
  const [forwardAntiquity] = useForwardAntiquityMutation();

  const backTo = id ? `/records/antiquities/${id}` : '/records/antiquities';

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <Card><Card.Body><Spinner centered label="Loading record" /></Card.Body></Card>
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div className={styles.wrapper}>
        <Link to={backTo} className={styles.backLink}>
          <ArrowLeft size={12} /><span>Back</span>
        </Link>
        <Card>
          <Card.Body>
            <EmptyState
              icon={<AlertCircle size={28} />}
              title="Could not load this record"
              description="It may have been deleted or your session may have expired."
              action={<Button variant="secondary" onClick={refetch}>Retry</Button>}
            />
          </Card.Body>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (values, image) => {
    // The form always hands us an image (from ImageUpload); it's a File
    // when the user picked one, or null when they didn't. Only send the
    // file part when non-null, so the backend keeps the existing image.
    const payload = { id: record.id, values };
    if (image) payload.image = image;
    return await updateAntiquity(payload).unwrap();
  };

  const handleForward = async (recordId, comment) => {
    return await forwardAntiquity({ id: recordId, comment }).unwrap();
  };

  const handleExit = () => navigate(backTo);

  const canForwardAfterSave =
    record.status === STATUS.RETURNED || record.status === STATUS.DRAFT;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <Link to={backTo} className={styles.backLink}>
            <ArrowLeft size={12} />
            <span>Back to record</span>
          </Link>
          <h1 className={styles.title}>Edit Antiquity Record</h1>
          <p className={styles.subtitle}>
            <code className={styles.code}>
              {record.key_no || `#${record.id}`}
            </code>
            <span className={styles.sep}>·</span>
            <span>{record.title}</span>
            {record.status === STATUS.RETURNED && (
              <span className={styles.returnedFlag}>
                Returned — please address the reviewer's note in the audit trail
              </span>
            )}
          </p>
        </div>
      </div>

      <AntiquityForm
        mode="edit"
        initialValues={record}
        initialImage={null}
        currentStatus={record.status}
        currentImageUrl={imageSrc(record) || null}
        onSubmit={handleSubmit}
        onForward={canForwardAfterSave ? handleForward : undefined}
        onCancel={handleExit}
      />
    </div>
  );
}
