import { Loader2 } from 'lucide-react';
import styles from './Spinner.module.css';

/**
 * Spinner — loading indicator. Use with an accessible label.
 *
 * @param {object} props
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {string} [props.label='Loading']
 * @param {boolean} [props.centered]  // fills parent, centers itself
 */
function Spinner({ size = 'md', label = 'Loading', centered = false, className = '' }) {
  const px = size === 'sm' ? 16 : size === 'lg' ? 32 : 22;

  const classes = [
    styles.spinner,
    centered ? styles.centered : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="status" aria-live="polite">
      <Loader2 size={px} className={styles.icon} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default Spinner;
