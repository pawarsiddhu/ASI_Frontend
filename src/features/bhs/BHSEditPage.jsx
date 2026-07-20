import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';

import Card from '@components/Card';
import Button from '@components/Button';
import Spinner from '@components/Spinner';
import EmptyState from '@components/EmptyState';

import BHSForm from './BHSForm';
import {
  useGetBHSQuery,
  useUpdateBHSMutation,
  useForwardBHSMutation,
} from './bhsApi';
import { STATUS } from './schema';
import { imageSrc } from '@utils/imageSrc';

import styles from './BHSEditPage.module.css';

/**
 * BHSEditPage — mirrors AntiquityEditPage. Fetches the record, hydrates
 * BHSForm, submits via PUT /records/:id. See AntiquityEditPage for the
 * shared reasoning about image handling.
 */
export default function BHSEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: record, isLoading, isError, refetch } = useGetBHSQuery(id);
  const [updateBHS] = useUpdateBHSMutation();
  const [forwardBHS] = useForwardBHSMutation();

  const backTo = id ? `/records/bhs/${id}` : '/records/bhs';

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
    const payload = { id: record.id, values };
    if (image) payload.image = image;
    return await updateBHS(payload).unwrap();
  };

  const handleForward = async (recordId, comment) => {
    return await forwardBHS({ id: recordId, comment }).unwrap();
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
          <h1 className={styles.title}>Edit Built Heritage Record</h1>
          <p className={styles.subtitle}>
            <code className={styles.code}>
              {record.bh_code || `#${record.id}`}
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

      <BHSForm
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
