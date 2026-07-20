import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, Send, AlertCircle } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';

import FormSection, { FormRow } from './form/FormSection';
import FormField from './form/FormField';
import { antiquityFormConfig, getInitialFormValues } from './form/formConfig';
import { validateForm } from './form/validation';
import ImageUpload from './components/ImageUpload';
import WorkflowActionModal from './components/WorkflowActionModal';
import { STATUS } from './schema';
import { useCircles } from '@features/circles';

import styles from './AntiquityForm.module.css';

/**
 * AntiquityForm — the shared form component. Handles ALL client-side form
 * concerns so pages stay thin:
 *   - controlled inputs + validation
 *   - dirty tracking + beforeunload
 *   - error summary + focus-first-invalid on failed submit
 *   - images
 *   - Save + optional "Save & Forward" (with the Phase 3 workflow modal)
 *
 * Pages inject the mutations via callbacks so the same form works for both
 * "creating a new record" and "editing an existing one".
 *
 * Circle dropdown options are sourced live from GET /circles (via
 * useCircles). formConfig's static options are overridden at render time
 * for the `circle` field — the config's role is to declare the field, the
 * hook owns the values.
 */
export default function AntiquityForm({
  mode = 'create', // 'create' | 'edit'
  initialValues,
  initialImage = null,
  onSubmit, // (values, image) => Promise<record>
  onForward, // (id, comment) => Promise<record>   (optional)
  submitLabel,
  showForward = true,
  currentStatus,
  onCancel,
  readOnly = false,
}) {
  const toast = useToast();
  const {
    options: circleOptions,
    isLoading: circlesLoading,
    isFallback: circlesFallback,
  } = useCircles();

  const seed = useMemo(
    () => ({ ...getInitialFormValues(), ...(initialValues || {}) }),
    [initialValues]
  );
  const [values, setValues] = useState(seed);
  const [image, setImage] = useState(initialImage);
  const [errors, setErrors] = useState({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [savedRecord, setSavedRecord] = useState(null);
  const errorSummaryRef = useRef(null);

  // Original snapshot for dirty tracking. Re-seed if the parent supplies fresh
  // values (e.g. edit page finished loading).
  const originalRef = useRef({ values: seed, image: initialImage });
  useEffect(() => {
    setValues(seed);
    setImage(initialImage);
    originalRef.current = { values: seed, image: initialImage };
    setErrors({});
    setAttemptedSubmit(false);
  }, [seed, initialImage]);

  const isDirty =
    !readOnly &&
    (Object.keys(values).some(
      (k) => values[k] !== originalRef.current.values[k]
    ) ||
      image !== originalRef.current.image);

  // beforeunload protection
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _drop, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateAndFocus = () => {
    const { errors: next, isValid, firstErrorField } = validateForm(values);
    setErrors(next);
    setAttemptedSubmit(true);
    if (!isValid) {
      toast.error('Please fix the highlighted fields.');
      requestAnimationFrame(() => {
        errorSummaryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        if (firstErrorField) {
          const el =
            document.getElementById(firstErrorField) ??
            document.getElementsByName(firstErrorField)[0];
          el?.focus?.();
        }
      });
    }
    return isValid;
  };

  const doSubmit = async () => {
    setSaving(true);
    try {
      const record = await onSubmit(values, image);
      originalRef.current = { values, image };
      toast.success(
        mode === 'create'
          ? `Saved as draft — ${record.key_no || record.title || `#${record.id}`}`
          : 'Changes saved.'
      );
      return record;
    } catch (err) {
      // Backend surfaces `{ message, errors }` via the RTK Query error shape.
      const msg = err?.data?.message || 'Could not save the record.';
      toast.error(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!validateAndFocus()) return;
    try {
      await doSubmit();
      onCancel?.('saved'); // pages typically navigate away on save
    } catch {
      /* toast already shown */
    }
  };

  const handleSaveAndForward = async () => {
    if (!validateAndFocus()) return;
    try {
      const record = await doSubmit();
      // Open the workflow modal to collect the forward comment
      setSavedRecord(record);
      setForwardOpen(true);
    } catch {
      /* toast already shown */
    }
  };

  const handleForwardSubmit = async (comment) => {
    if (!savedRecord) return;
    await onForward(savedRecord.id, comment);
    onCancel?.('forwarded');
  };

  const errorCount = Object.keys(errors).length;

  // Only draft / returned records can be forwarded from this form.
  // For records already in review, editing is enough (workflow actions live
  // on the detail page).
  const canOfferForward =
    showForward &&
    !!onForward &&
    (mode === 'create' ||
      currentStatus === STATUS.DRAFT ||
      currentStatus === STATUS.RETURNED);

  /**
   * Inject dynamic circle options into the `circle` field. formConfig ships
   * a static options array (harmless fallback); we override with the live
   * list from /circles here so operators can pick from the real backend
   * enum — including circles that didn't exist when the config was written.
   *
   * While loading we disable the field and show a placeholder so the user
   * doesn't accidentally submit an empty circle.
   */
  const resolveField = (field) => {
    if (field.name !== 'circle') return field;
    return {
      ...field,
      options: circleOptions,
      disabled: circlesLoading,
      placeholder: circlesLoading
        ? 'Loading circles…'
        : field.placeholder,
      helperText: circlesFallback
        ? 'Showing offline circle list — server is unreachable.'
        : field.helperText,
    };
  };

  return (
    <>
      {/* Error summary — surfaces after first failed submit */}
      {attemptedSubmit && errorCount > 0 && (
        <Card variant="flat" className={styles.errorSummary} ref={errorSummaryRef}>
          <div className={styles.errorSummaryInner}>
            <AlertCircle size={18} />
            <div>
              <strong>
                Please fix {errorCount} field{errorCount === 1 ? '' : 's'}
              </strong>
              <p>Scroll down to the highlighted fields and complete them.</p>
            </div>
            <Badge variant="danger">{errorCount}</Badge>
          </div>
        </Card>
      )}

      {/* Sections */}
      {antiquityFormConfig.sections.map((section) => (
        <FormSection
          key={section.id}
          title={section.title}
          description={section.description}
        >
          {section.fields.map((field) => {
            const resolved = resolveField(field);
            return (
              <FormRow key={resolved.name} fullWidth={resolved.fullWidth}>
                <FormField
                  field={resolved}
                  value={values[resolved.name]}
                  onChange={(v) => setField(resolved.name, v)}
                  error={errors[resolved.name]}
                  disabled={readOnly || saving || resolved.disabled}
                />
              </FormRow>
            );
          })}
        </FormSection>
      ))}

      {/* Image (single file — backend accepts one per record) */}
      <ImageUpload
        image={image}
        onChange={setImage}
        disabled={readOnly || saving}
      />

      {/* Footer actions */}
      <div className={styles.footerActions}>
        {onCancel && (
          <Button
            variant="ghost"
            onClick={() => {
              if (
                isDirty &&
                !window.confirm(
                  'Discard changes? Unsaved edits will be lost.'
                )
              )
                return;
              onCancel('cancel');
            }}
            disabled={saving}
          >
            Cancel
          </Button>
        )}

        <div className={styles.primaryActions}>
          <Button
            variant={canOfferForward ? 'secondary' : 'primary'}
            leftIcon={<Save size={14} />}
            onClick={handleSave}
            loading={saving && !forwardOpen}
            disabled={readOnly}
          >
            {submitLabel || (mode === 'create' ? 'Save as Draft' : 'Save changes')}
          </Button>

          {canOfferForward && (
            <Button
              leftIcon={<Send size={14} />}
              onClick={handleSaveAndForward}
              loading={saving && !forwardOpen}
              disabled={readOnly}
            >
              Save & Forward
            </Button>
          )}
        </div>
      </div>

      {/* Forward modal (Phase 3 workflow modal, forward variant) */}
      {savedRecord && (
        <WorkflowActionModal
          action="forward"
          open={forwardOpen}
          onClose={() => {
            setForwardOpen(false);
            // If the user closes without forwarding, we've still saved. Navigate away.
            onCancel?.('saved');
          }}
          record={savedRecord}
          nextStatus={STATUS.SUPERVISOR_REVIEW}
          onSubmit={handleForwardSubmit}
        />
      )}
    </>
  );
}
