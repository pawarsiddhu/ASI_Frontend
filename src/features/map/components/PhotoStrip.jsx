import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import styles from './PhotoStrip.module.css';

/**
 * PhotoStrip — a small gallery at the top of the detail card.
 * Images that fail to load are dropped; if none load, nothing renders.
 * `representative` marks a generic category image (not the actual object).
 */
export default function PhotoStrip({ images = [], alt, representative }) {
  const [broken, setBroken] = useState(() => new Set());
  const [i, setI] = useState(0);

  useEffect(() => {
    setBroken(new Set());
    setI(0);
  }, [images]);

  const ok = images.filter((src) => !broken.has(src));
  if (!ok.length) return null;
  const idx = Math.min(i, ok.length - 1);
  const src = ok[idx];

  return (
    <figure className={styles.strip}>
      <img
        key={src}
        src={src}
        alt={representative ? `Representative example: ${alt}` : alt}
        className={styles.img}
        onError={() => setBroken((b) => new Set(b).add(src))}
      />
      {ok.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.nav} ${styles.prev}`}
            onClick={() => setI((n) => (n - 1 + ok.length) % ok.length)}
            aria-label="Previous photo"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={`${styles.nav} ${styles.next}`}
            onClick={() => setI((n) => (n + 1) % ok.length)}
            aria-label="Next photo"
          >
            <ChevronRight size={16} />
          </button>
          <div className={styles.dots} aria-hidden="true">
            {ok.map((s, n) => <span key={s} className={n === idx ? styles.dotOn : styles.dot} />)}
          </div>
        </>
      )}
      {representative && (
        <figcaption className={styles.caption}>Representative image — not this object</figcaption>
      )}
    </figure>
  );
}
