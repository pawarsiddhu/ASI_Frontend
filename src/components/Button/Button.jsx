import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

/**
 * Button — the workhorse. All clickable actions use this.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'danger'|'ghost'|'link'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth]
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {'button'|'submit'|'reset'} [props.type='button']
 * @param {React.ReactNode} props.children
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    type = 'button',
    className = '',
    children,
    ...rest
  },
  ref
) {
  const classes = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
        </span>
      )}
      {!loading && leftIcon && (
        <span className={styles.icon} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {!loading && rightIcon && (
        <span className={styles.icon} aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

export default Button;
