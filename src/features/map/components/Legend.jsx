import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { THEME_OPTIONS, MUSEUM_COLOR, DISPERSAL_COLOR } from '../utils/themes';
import styles from './Legend.module.css';

/**
 * Legend — only lists values present in the current result, with counts,
 * so it doubles as a quick distribution summary.
 */
export default function Legend({ theme, records, layers }) {
  const [open, setOpen] = useState(true);
  const counts = {};
  records.forEach((r) => {
    const k = theme.key(r);
    counts[k] = (counts[k] || 0) + 1;
  });
  const items = theme.legend.filter((l) => counts[l.value]);
  const unknown = counts.null || counts.undefined || 0;
  const themeLabel = THEME_OPTIONS.find((t) => t.value === theme.id)?.label;

  return (
    <div className={styles.legend}>
      <button type="button" className={styles.head} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>Colour: {themeLabel}</span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {open && (
        <>
          <ul className={styles.list}>
            {items.map((l) => (
              <li key={l.value}>
                <span className={styles.dot} style={{ background: l.color }} />
                <span className={styles.name}>
                  {l.label}
                  {theme.id === 'category' && <em>{l.group === 'BHS' ? ' · site' : ' · object'}</em>}
                </span>
                <span className={styles.count}>{counts[l.value]}</span>
              </li>
            ))}
            {unknown > 0 && (
              <li>
                <span className={styles.dot} style={{ background: '#A8A5A0' }} />
                <span className={styles.name}>Not applicable</span>
                <span className={styles.count}>{unknown}</span>
              </li>
            )}
            {items.length === 0 && unknown === 0 && <li className={styles.empty}>No records in view</li>}
          </ul>
          <div className={styles.symbols}>
            {layers.showBhs && (
              <span><i className={styles.symSite} /> Site</span>
            )}
            {layers.showAnt && layers.antMode === 'found' && (
              <span><i className={styles.symObj} /> Antiquity findspot</span>
            )}
            {layers.showAnt && (layers.antMode === 'held' || layers.dispersal) && (
              <span><i className={styles.symMuseum} style={{ background: MUSEUM_COLOR }} /> Museum (count)</span>
            )}
            {layers.showAnt && layers.dispersal && (
              <span><i className={styles.symLine} style={{ borderColor: DISPERSAL_COLOR }} /> Moved &gt; 5 km</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
