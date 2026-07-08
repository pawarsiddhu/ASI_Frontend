import styles from './Skeleton.module.css';

/**
 * Skeleton — loading placeholder with a subtle shimmer.
 * Use during data fetches so the UI doesn't jump when content arrives.
 *
 * @param {object} props
 * @param {string | number} [props.width='100%']
 * @param {string | number} [props.height=14]
 * @param {'text' | 'circle' | 'rect'} [props.variant='text']
 * @param {string} [props.className]
 */
export default function Skeleton({
  width = '100%',
  height = 14,
  variant = 'text',
  className = '',
  style,
  ...rest
}) {
  const classes = [styles.skeleton, styles[`variant-${variant}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}
