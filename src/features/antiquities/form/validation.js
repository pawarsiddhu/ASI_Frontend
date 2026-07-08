import { getAllFields } from './formConfig';

/**
 * validateForm — walks the form config, returns an errors map.
 *
 * Rules today (kept simple for Phase 2):
 *   - required fields must be non-empty
 *   - numbers must be >= min if provided
 *   - text length must be <= maxLength if provided
 *
 * Phase 2b can add pattern-based rules (accession number format, etc.)
 *
 * @param {Record<string, any>} values
 * @returns {{ errors: Record<string, string>, isValid: boolean, firstErrorField?: string }}
 */
export function validateForm(values) {
  const errors = {};
  const fields = getAllFields();

  for (const field of fields) {
    const value = values[field.name];

    if (field.required) {
      const empty =
        value === '' ||
        value === null ||
        value === undefined ||
        (typeof value === 'string' && value.trim() === '');
      if (empty) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }
    }

    if (
      field.type === 'number' &&
      value !== '' &&
      value !== null &&
      typeof value === 'number' &&
      field.min !== undefined &&
      value < field.min
    ) {
      errors[field.name] = `Must be at least ${field.min}.`;
    }

    if (
      typeof value === 'string' &&
      field.maxLength &&
      value.length > field.maxLength
    ) {
      errors[field.name] = `Maximum ${field.maxLength} characters.`;
    }
  }

  const firstErrorField = Object.keys(errors)[0];
  return { errors, isValid: Object.keys(errors).length === 0, firstErrorField };
}
