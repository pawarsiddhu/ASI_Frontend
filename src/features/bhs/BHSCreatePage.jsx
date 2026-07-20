import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import BHSForm from './BHSForm';
import { useCreateBHSMutation, useForwardBHSMutation } from './bhsApi';
import { useToast } from '@components/Toast';

import styles from './BHSCreatePage.module.css';

/**
 * Auto-generate a BH code in the shape BH-<CIRCLE>-<SHORT>.
 * The circle prefix makes the code loosely traceable ("this record came from
 * the Mumbai circle"). Suffix is short base36 for uniqueness. Backend
 * enforces uniqueness with 409, so a theoretical collision surfaces cleanly.
 */
function generateBHCode(circle) {
  const prefix = circle ? circle.slice(0, 3).toUpperCase() : 'GEN';
  const sec = Math.floor((Date.now() / 1000) % 86400)
    .toString(36)
    .padStart(4, '0');
  const rand = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0');
  return `BH-${prefix}-${(sec + rand).toUpperCase()}`;
}

/**
 * BHSCreatePage — mirrors AntiquityCreatePage.
 * Auto-generates bh_code at submission time so operator never types it.
 * Image required (backend enforces multipart image field).
 */
export default function BHSCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [createBHS] = useCreateBHSMutation();
  const [forwardBHS] = useForwardBHSMutation();

  const handleSubmit = async (values, image) => {
    if (!image) {
      toast.error('Please attach an image before saving.');
      throw new Error('image required');
    }
    const valuesWithCode = {
      ...values,
      bh_code: generateBHCode(values.circle),
    };
    return await createBHS({ values: valuesWithCode, image }).unwrap();
  };

  const handleForward = async (id, comment) => {
    return await forwardBHS({ id, comment }).unwrap();
  };

  const handleExit = () => navigate('/records/bhs');

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <Link to="/records/bhs" className={styles.backLink}>
            <ArrowLeft size={12} />
            <span>Back to Built Heritage</span>
          </Link>
          <h1 className={styles.title}>New Built Heritage Record</h1>
          <p className={styles.subtitle}>
            Document an immovable heritage site. Required fields are marked
            with <span className={styles.reqStar}>*</span>. An image is required.
            A unique BH code will be assigned automatically on save.
          </p>
        </div>
      </div>

      <BHSForm
        mode="create"
        onSubmit={handleSubmit}
        onForward={handleForward}
        onCancel={handleExit}
      />
    </div>
  );
}
