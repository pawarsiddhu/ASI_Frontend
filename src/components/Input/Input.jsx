import { forwardRef, useId } from 'react';
import styles from './Input.module.css';

/**
 * Input — text field with label, helper text, and error state.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.helperText]
 * @param {string} [props.error]
 * @param {boolean} [props.required]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    required = false,
    leftIcon,
    rightIcon,
    size = 'md',
    id: idProp,
    className = '',
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
    leftIcon ? styles.hasLeftIcon : '',
    rightIcon ? styles.hasRightIcon : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <div className={wrapperClasses}>
        {leftIcon && (
          <span className={styles.leftIcon} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={styles.input}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-required={required || undefined}
          {...rest}
        />
        {rightIcon && (
          <span className={styles.rightIcon} aria-hidden="true">
            {rightIcon}
          </span>
        )}
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

export default Input;
