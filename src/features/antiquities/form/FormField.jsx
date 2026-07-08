import Input from '@components/Input';
import Select from '@components/Select';
import Textarea from '@components/Textarea';

/**
 * FormField — dispatches on `field.type` and renders the appropriate control.
 *
 * Every value comes in via `value` + `onChange(newValue)`. The renderer knows
 * how to unwrap events for each input type so the parent form state stays
 * simple: `{ fieldName: value }`.
 *
 * Supported types: text, textarea, select, number, date
 *
 * @param {object} props
 * @param {object} props.field    — a field config from formConfig.js
 * @param {any} props.value
 * @param {(next: any) => void} props.onChange
 * @param {string} [props.error]  — error message, if any
 */
export default function FormField({ field, value, onChange, error }) {
  const commonProps = {
    label: field.label,
    required: field.required,
    helperText: error ? undefined : field.helperText,
    error,
  };

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          {...commonProps}
          rows={field.rows || 4}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <Select
          {...commonProps}
          placeholder={field.placeholder || 'Select…'}
          options={field.options}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <Input
          {...commonProps}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step || 'any'}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? '' : Number(raw));
          }}
        />
      );

    case 'date':
      return (
        <Input
          {...commonProps}
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'text':
    default:
      return (
        <Input
          {...commonProps}
          type="text"
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.maxLength}
        />
      );
  }
}
