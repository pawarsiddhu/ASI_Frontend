import styles from './DetailField.module.css';

/**
 * DetailField — a single labeled value on the detail page.
 * Reads as a definition-list pair: dt = label, dd = value.
 *
 * Modifiers via the config:
 *   - wide: spans full row
 *   - mono: renders value as monospace (IDs, accession numbers)
 *   - long: multi-line value (provenance, remarks) with proper wrapping
 */
export default function DetailField({ label, value, wide, mono, long }) {
  const classes = [
    styles.field,
    wide ? styles.wide : '',
    mono ? styles.mono : '',
    long ? styles.long : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
