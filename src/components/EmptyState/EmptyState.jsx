import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

/**
 * EmptyState — placeholder when a list/table/search has no data.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon]  // defaults to Lucide Inbox
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action]  // e.g. a <Button> to create a new record
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
}) {
  const classes = [styles.wrapper, styles[`size-${size}`], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className={styles.iconWrap} aria-hidden="true">
        {icon ?? <Inbox size={size === 'sm' ? 28 : size === 'lg' ? 44 : 36} />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export default EmptyState;
