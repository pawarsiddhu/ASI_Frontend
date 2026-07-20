import Input from '@components/Input';
import Select from '@components/Select';
import Textarea from '@components/Textarea';
import { LocationMapPicker } from '@components/LocationMap';

/**
 * FormField — dispatches on `field.type` and renders the appropriate control.
 *
 * Every value comes in via `value` + `onChange(newValue)`. The renderer knows
 * how to unwrap events for each input type so the parent form state stays
 * simple: `{ fieldName: value }`.
 *
 * Supported types: text, textarea, select, number, date, map
 *
 * The `map` type is a multi-field control — it reads and writes latitude,
 * longitude, and (when configured) state + district from reverse geocoding.
 * For those cases the parent passes in `values` and `setField` so the map
 * can address multiple fields by the names declared on the field config
 * (`latField`, `lngField`, `stateField`, `districtField`).
 *
 * `field.readOnly: true` on a text/select/textarea/date/number renders the
 * field as disabled — used for the state and district fields when they are
 * auto-populated from the map pin.
 */
export default function FormField({
  field,
  value,
  onChange,
  error,
  disabled,
  values,
  setField,
}) {
  const effectiveDisabled = disabled || field.readOnly;

  const commonProps = {
    label: field.label,
    required: field.required,
    helperText: error ? undefined : field.helperText,
    error,
    disabled: effectiveDisabled,
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

    case 'map': {
      // Read both coords from the shared form state so the map reflects any
      // change — including the user typing into the sibling lat/lng number
      // inputs. Emit both back through setField so the same inputs update.
      // When stateField/districtField are configured, we also mirror the
      // reverse-geocode result into those fields.
      const latName = field.latField || 'latitude';
      const lngName = field.lngField || 'longitude';
      const stateName = field.stateField;
      const districtName = field.districtField;
      const lat = values?.[latName];
      const lng = values?.[lngName];
      return (
        <LocationMapPicker
          latitude={lat}
          longitude={lng}
          disabled={disabled}
          label={field.label}
          helperText={field.helperText}
          onChange={({ latitude, longitude }) => {
            setField?.(latName, latitude);
            setField?.(lngName, longitude);
          }}
          onLocationResolved={({ state, district }) => {
            if (stateName) setField?.(stateName, state);
            if (districtName) setField?.(districtName, district);
          }}
        />
      );
    }

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
