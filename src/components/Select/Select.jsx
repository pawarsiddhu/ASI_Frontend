import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

/**
 * Select — native select with custom styling. Accessible by default.
 * Native is intentional: keyboard nav, screen readers, mobile UI all just work.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.helperText]
 * @param {string} [props.error]
 * @param {boolean} [props.required]
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.placeholder]
 * @param {Array<{value: string, label: string, disabled?: boolean}>} [props.options]
 */
const Select = forwardRef(function Select(
  {
    label,
    helperText,
    error,
    required = false,
    size = 'md',
    placeholder,
    options = [],
    id: idProp,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const wrapperClasses = [
    styles.wrapper,
    styles[`size-${size}`],
    error ? styles.hasError : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required} aria-hidden="true">*</span>}
        </label>
      )}
      <div className={wrapperClasses}>
        <select
          ref={ref}
          id={id}
          className={styles.select}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={required || undefined}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <span className={styles.chevron} aria-hidden="true">
          <ChevronDown size={size === 'sm' ? 14 : 16} />
        </span>
      </div>
      {error && (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Select;
