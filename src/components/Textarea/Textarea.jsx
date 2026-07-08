import { forwardRef, useId } from 'react';
import styles from './Textarea.module.css';

/**
 * Textarea — mirrors Input's API: label + helper + error + ARIA.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.helperText]
 * @param {string} [props.error]
 * @param {boolean} [props.required]
 * @param {number} [props.rows=4]
 */
const Textarea = forwardRef(function Textarea(
  {
    label,
    helperText,
    error,
    required = false,
    rows = 4,
    id: idProp,
    className = '',
    ...rest
  },
  ref
) {
  const gid = useId();
  const id = idProp || gid;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const wrapperClasses = [
    styles.wrapper,
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
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={styles.textarea}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={required || undefined}
          {...rest}
        />
      </div>
      {error && <p id={errorId} className={styles.errorText} role="alert">{error}</p>}
      {!error && helperText && <p id={helperId} className={styles.helperText}>{helperText}</p>}
    </div>
  );
});

export default Textarea;
