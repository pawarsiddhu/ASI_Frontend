import styles from './MetadataSections.module.css';

/**
 * MetadataSections — the grouped metadata display used on the detail page.
 *
 * Each section has a Georgia serif heading and a two-column label/value
 * grid inside. Hairline dividers between sections. This is the biggest
 * readability improvement over a flat field list: the eye lands on the
 * section it needs and reads only that.
 *
 * A slim caption strip beneath the sections carries the record's
 * boring-but-useful metadata (created / updated / recorded by).
 */
export default function MetadataSections({ config, record }) {
  const meta = typeof config.meta === 'function' ? config.meta(record) : [];

  return (
    <div className={styles.wrapper}>
      {config.sections.map((section, idx) => (
        <section
          key={section.id}
          className={styles.section}
          data-last={idx === config.sections.length - 1 ? 'true' : undefined}
        >
          <h2 className={styles.heading}>{section.title}</h2>
          <dl className={styles.grid}>
            {section.fields.map((field) => {
              const value = field.get(record);
              const empty = !value || value === '—';
              return (
                <div
                  key={field.label}
                  className={`${styles.pair} ${field.long ? styles.pairLong : ''}`}
                >
                  <dt className={styles.label}>{field.label}</dt>
                  <dd
                    className={`${styles.value} ${field.mono ? styles.valueMono : ''} ${empty ? styles.valueEmpty : ''}`}
                  >
                    {value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}

      {meta.length > 0 && (
        <div className={styles.metaStrip}>
          {meta.map((m) => (
            <div key={m.label} className={styles.metaCell}>
              <span className={styles.metaLabel}>{m.label}</span>
              <span className={styles.metaValue}>{m.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
