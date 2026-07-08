import Card from '@components/Card';
import styles from './FormSection.module.css';

/**
 * FormSection — a titled group of fields inside the form.
 * Fields are laid out in a responsive 2-column grid by default; individual
 * fields can span both columns via `field.fullWidth: true`.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {React.ReactNode} props.children
 */
export default function FormSection({ title, description, children }) {
  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>{title}</Card.Title>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>
      </Card.Header>
      <div className={styles.grid}>{children}</div>
    </Card>
  );
}

/**
 * FormRow — wraps a single field in the grid, honoring full-width fields.
 */
export function FormRow({ fullWidth, children }) {
  return (
    <div className={fullWidth ? styles.rowFull : styles.row}>{children}</div>
  );
}
