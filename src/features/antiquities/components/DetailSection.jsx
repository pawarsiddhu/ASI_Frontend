import Card from '@components/Card';
import DetailField from './DetailField';
import styles from './DetailSection.module.css';

/**
 * DetailSection — one card per section of the detail page.
 *
 * Renders fields in a responsive 2-column grid; wide fields span both.
 * When the config provides an `icon` (a Lucide component), it renders in a
 * tinted badge next to the section title — adds visual anchoring that the
 * demo reviewers asked for ("plain, no imagery, hard to scan").
 */
export default function DetailSection({ title, fields, record, icon: Icon }) {
  return (
    <Card className={styles.card}>
      <Card.Header className={styles.header}>
        <div className={styles.titleRow}>
          {Icon && (
            <span className={styles.iconBadge} aria-hidden="true">
              <Icon size={16} />
            </span>
          )}
          <Card.Title>{title}</Card.Title>
        </div>
      </Card.Header>
      <Card.Body>
        <dl className={styles.grid}>
          {fields.map((field) => (
            <DetailField
              key={field.label}
              label={field.label}
              value={field.get(record)}
              wide={field.wide}
              mono={field.mono}
              long={field.long}
            />
          ))}
        </dl>
      </Card.Body>
    </Card>
  );
}
