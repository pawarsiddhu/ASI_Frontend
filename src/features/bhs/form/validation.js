import { getAllBHSFields } from './formConfig';

/**
 * validateBHSForm — walks the BHS form config, returns an errors map.
 *
 * Rules:
 *   - required fields must be non-empty
 *   - number fields must be numeric; latitude/longitude must be in valid range
 *   - text length must be <= maxLength if provided
 */
export function validateBHSForm(values) {
  const errors = {};
  const fields = getAllBHSFields();

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

    if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (Number.isNaN(num)) {
        errors[field.name] = 'Must be a number.';
        continue;
      }
      if (field.name === 'latitude' && (num < -90 || num > 90)) {
        errors[field.name] = 'Latitude must be between -90 and 90.';
        continue;
      }
      if (field.name === 'longitude' && (num < -180 || num > 180)) {
        errors[field.name] = 'Longitude must be between -180 and 180.';
        continue;
      }
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
