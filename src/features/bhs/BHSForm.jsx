import { useEffect, useMemo, useRef, useState } from 'react';
import { Save, Send, AlertCircle } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';

// Form primitives + workflow modal are type-agnostic — import from antiquities.
import FormSection, { FormRow } from '@features/antiquities/form/FormSection';
import FormField from '@features/antiquities/form/FormField';
import ImageUpload from '@features/antiquities/components/ImageUpload';
import WorkflowActionModal from '@features/antiquities/components/WorkflowActionModal';

import { bhsFormConfig, getInitialBHSFormValues } from './form/formConfig';
import { validateBHSForm } from './form/validation';
import { STATUS } from './schema';
import { useCircles } from '@features/circles';

import styles from './BHSForm.module.css';

/**
 * BHSForm — mirrors AntiquityForm shape for consistency. Handles form state,
 * validation, dirty-tracking, images, and the Save & Forward flow. Pages
 * inject mutations via callbacks.
 *
 * lat/lng inputs come out of number fields as strings if the user typed; we
 * coerce to Number at submission so the backend gets JSON-friendly values
 * (multipart will string-ify them again, but this keeps our client model tidy).
 *
 * NOTE: The Location section includes a `map` pseudo-field that reads/writes
 * `latitude` and `longitude`. To let it write both at once, we pass the full
 * `values` object and the `setField` setter through FormField. Other field
 * types simply ignore those props.
 *
 * Circle dropdown options are sourced live from GET /circles via useCircles —
 * same treatment as AntiquityForm. See resolveField below.
 */
export default function BHSForm({
  mode = 'create',
  initialValues,
  initialImage = null,
  onSubmit,
  onForward,
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
    () => ({ ...getInitialBHSFormValues(), ...(initialValues || {}) }),
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
    const { errors: next, isValid, firstErrorField } = validateBHSForm(values);
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
      // Coerce lat/lng to numbers if the number-input handed us strings.
      const submitValues = {
        ...values,
        latitude:
          values.latitude === '' ? '' : Number(values.latitude),
        longitude:
          values.longitude === '' ? '' : Number(values.longitude),
      };
      const record = await onSubmit(submitValues, image);
      originalRef.current = { values, image };
      toast.success(
        mode === 'create'
          ? `Saved as draft — ${record.bh_code || record.title || `#${record.id}`}`
          : 'Changes saved.'
      );
      return record;
    } catch (err) {
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
      onCancel?.('saved');
    } catch {
      /* toast shown */
    }
  };

  const handleSaveAndForward = async () => {
    if (!validateAndFocus()) return;
    try {
      const record = await doSubmit();
      setSavedRecord(record);
      setForwardOpen(true);
    } catch {
      /* toast shown */
    }
  };

  const handleForwardSubmit = async (comment) => {
    if (!savedRecord) return;
    await onForward(savedRecord.id, comment);
    onCancel?.('forwarded');
  };

  const errorCount = Object.keys(errors).length;

  const canOfferForward =
    showForward &&
    !!onForward &&
    (mode === 'create' ||
      currentStatus === STATUS.DRAFT ||
      currentStatus === STATUS.RETURNED);

  /**
   * Inject dynamic circle options into the `circle` field. formConfig ships
   * a static options array; we override with the live list from /circles.
   * Other field types (including the `map` pseudo-field) pass through
   * unchanged.
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

      {bhsFormConfig.sections.map((section) => (
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
                  values={values}
                  setField={setField}
                />
              </FormRow>
            );
          })}
        </FormSection>
      ))}

      <ImageUpload
        image={image}
        onChange={setImage}
        disabled={readOnly || saving}
      />

      <div className={styles.footerActions}>
        {onCancel && (
          <Button
            variant="ghost"
            onClick={() => {
              if (
                isDirty &&
                !window.confirm('Discard changes? Unsaved edits will be lost.')
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

      {savedRecord && (
        <WorkflowActionModal
          action="forward"
          open={forwardOpen}
          onClose={() => {
            setForwardOpen(false);
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
