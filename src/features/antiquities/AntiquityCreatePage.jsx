import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';

import FormSection, { FormRow } from './form/FormSection';
import FormField from './form/FormField';
import {
  antiquityFormConfig,
  getInitialFormValues,
} from './form/formConfig';
import { validateForm } from './form/validation';
import { useCreateAntiquityMutation } from './antiquitiesApi';

import styles from './AntiquityCreatePage.module.css';

/**
 * AntiquityCreatePage — new antiquity record.
 *
 * Flow:
 *   1. User fills fields → local state updates
 *   2. Client-side validation on submit, or blur (Phase 2b)
 *   3. Save as Draft → POST /api/antiquities → toast + redirect to list
 *   4. Cancel → confirm if dirty → back to list
 *
 * Deferred to Phase 2b:
 *   - Save & Forward (with comment modal + status transition)
 *   - Field-level real-time validation on blur
 *   - Image upload UI
 */
export default function AntiquityCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [values, setValues] = useState(getInitialFormValues);
  const [errors, setErrors] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const errorSummaryRef = useRef(null);

  const [createAntiquity, { isLoading: isSaving }] =
    useCreateAntiquityMutation();

  // Track dirty state to protect against accidental navigation loss.
  const initial = useRef(getInitialFormValues());
  const isDirty = Object.keys(values).some(
    (k) => values[k] !== initial.current[k]
  );

  // beforeunload protection when the form is dirty.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ---- handlers ----
  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear this field's error as soon as the user edits it.
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSaveDraft = async () => {
    setAttemptedSubmit(true);
    const { errors: nextErrors, isValid, firstErrorField } =
      validateForm(values);
    setErrors(nextErrors);

    if (!isValid) {
      toast.error('Please fix the highlighted fields.');
      // Scroll the first invalid field into view
      requestAnimationFrame(() => {
        const el = document.querySelector(
          `[id$="-error"]:not([hidden])`
        );
        if (el) {
          errorSummaryRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
        // Focus first field with error
        if (firstErrorField) {
          const field = document.getElementById(firstErrorField)
            ?? document.getElementsByName(firstErrorField)[0];
          field?.focus?.();
        }
      });
      return;
    }

    try {
      const created = await createAntiquity(values).unwrap();
      toast.success(
        `Saved as draft — ${created.accessionNo || created.id}`
      );
      // Reset dirty tracking so leaving doesn't warn
      initial.current = { ...values };
      navigate('/records/antiquities');
    } catch (err) {
      const msg =
        err?.data?.message || 'Could not save the record. Please try again.';
      toast.error(msg);
    }
  };

  const handleCancel = () => {
    if (
      isDirty &&
      !window.confirm(
        'Discard this record? Unsaved changes will be lost.'
      )
    ) {
      return;
    }
    navigate('/records/antiquities');
  };

  const errorCount = Object.keys(errors).length;

  return (
    <div className={styles.wrapper}>
      {/* -------- Header -------- */}
      <div className={styles.pageHeader}>
        <div>
          <Link to="/records/antiquities" className={styles.backLink}>
            <ArrowLeft size={12} />
            <span>Back to Antiquities</span>
          </Link>
          <h1 className={styles.title}>New Antiquity Record</h1>
          <p className={styles.subtitle}>
            Fill in what you know. Required fields are marked with{' '}
            <span className={styles.reqStar}>*</span>. You can save as draft
            and complete later.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDraft}
            loading={isSaving}
            leftIcon={<Save size={14} />}
          >
            Save as Draft
          </Button>
        </div>
      </div>

      {/* -------- Error summary (shows after failed submit) -------- */}
      {attemptedSubmit && errorCount > 0 && (
        <Card variant="flat" className={styles.errorSummary} ref={errorSummaryRef}>
          <div className={styles.errorSummaryInner}>
            <AlertCircle size={18} />
            <div>
              <strong>Please fix {errorCount} field{errorCount === 1 ? '' : 's'}</strong>
              <p>Scroll down to the highlighted fields and complete them.</p>
            </div>
            <Badge variant="danger">{errorCount}</Badge>
          </div>
        </Card>
      )}

      {/* -------- Sections -------- */}
      {antiquityFormConfig.sections.map((section) => (
        <FormSection
          key={section.id}
          title={section.title}
          description={section.description}
        >
          {section.fields.map((field) => (
            <FormRow key={field.name} fullWidth={field.fullWidth}>
              <FormField
                field={field}
                value={values[field.name]}
                onChange={(v) => setField(field.name, v)}
                error={errors[field.name]}
              />
            </FormRow>
          ))}
        </FormSection>
      ))}

      {/* -------- Images placeholder (Phase 2b) -------- */}
      <Card>
        <Card.Header>
          <Card.Title>Images</Card.Title>
          <Badge>Coming in Phase 2b</Badge>
        </Card.Header>
        <Card.Body>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Image upload UI (drag-drop, thumbnail preview, reorder) ships in the
            next phase. This record can still be saved without images and images
            can be added later on the Edit page.
          </p>
        </Card.Body>
      </Card>

      {/* -------- Footer actions (mirrored) -------- */}
      <div className={styles.footerActions}>
        <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveDraft}
          loading={isSaving}
          leftIcon={<Save size={14} />}
        >
          Save as Draft
        </Button>
      </div>
    </div>
  );
}
