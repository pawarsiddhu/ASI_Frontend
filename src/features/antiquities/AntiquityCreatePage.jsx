import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import AntiquityForm from './AntiquityForm';
import {
  useCreateAntiquityMutation,
  useForwardAntiquityMutation,
} from './antiquitiesApi';
import { useToast } from '@components/Toast';

import styles from './AntiquityCreatePage.module.css';

/**
 * Auto-generates a `key_no` in the shape KN-YYYY-XXXXXX where the suffix is a
 * time+random-based short code. Collisions are astronomically unlikely for a
 * POC — the backend also enforces uniqueness with a 409 on duplicate, so a
 * (theoretical) clash would surface cleanly.
 */
function generateKeyNo() {
  const year = new Date().getFullYear();
  // 6 chars of base36 = ~2 billion possibilities; the leading two digits are
  // the seconds-of-day so keys stay roughly chronologically sortable.
  const sec = Math.floor((Date.now() / 1000) % 86400).toString(36).padStart(4, '0');
  const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
  return `KN-${year}-${(sec + rand).toUpperCase()}`;
}

/**
 * AntiquityCreatePage — thin wrapper.
 * All form state, validation, dirty-tracking, and image handling live in
 * <AntiquityForm />. This page wires the mutations and navigation only.
 *
 * The backend requires an image on POST /records — validation lives here
 * (rather than in the form config) because it's a submission-time check,
 * not a per-field rule: the image lives outside the form-values shape.
 *
 * `key_no` is auto-generated at submission — the operator never sees or
 * types it, per POC UX decision.
 */
export default function AntiquityCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [createAntiquity] = useCreateAntiquityMutation();
  const [forwardAntiquity] = useForwardAntiquityMutation();

  const handleSubmit = async (values, image) => {
    if (!image) {
      toast.error('Please attach an image before saving.');
      // Throwing here keeps the form open — matches the field-error UX.
      throw new Error('image required');
    }
    // Inject the auto-generated key_no here rather than in the form so it's
    // fresh at every submission attempt (not stale from a prior open).
    const valuesWithKey = { ...values, key_no: generateKeyNo() };
    return await createAntiquity({ values: valuesWithKey, image }).unwrap();
  };

  const handleForward = async (id, comment) => {
    return await forwardAntiquity({ id, comment }).unwrap();
  };

  const handleExit = () => navigate('/records/antiquities');

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <Link to="/records/antiquities" className={styles.backLink}>
            <ArrowLeft size={12} />
            <span>Back to Antiquities</span>
          </Link>
          <h1 className={styles.title}>New Antiquity Record</h1>
          <p className={styles.subtitle}>
            Fill in what you know. Required fields are marked with{' '}
            <span className={styles.reqStar}>*</span>. An image is required.
            A unique key number will be assigned automatically on save.
          </p>
        </div>
      </div>

      <AntiquityForm
        mode="create"
        onSubmit={handleSubmit}
        onForward={handleForward}
        onCancel={handleExit}
      />
    </div>
  );
}
