import styles from './Badge.module.css';

/**
 * Badge — inline status pill.
 * Used everywhere status is shown: record state, role indicator, count pills.
 *
 * @param {object} props
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'|'accent'} [props.variant='default']
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean} [props.dot]  // show a leading colored dot instead of full pill
 */
function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...rest
}) {
  const classes = [
    styles.badge,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    dot ? styles.dotStyle : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...rest}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}

export default Badge;
