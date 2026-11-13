import { useState } from 'react';
import { Landmark, MapPin } from 'lucide-react';
import styles from './ResultCard.module.css';
import { publicImageSrc, formatUpdatedAt } from '../utils';

/**
 * ResultCard — one record in the results grid. Clickable; fires onSelect.
 * Falls back to a warm gradient with an icon when the image fails to load.
 *
 * The meta chip is BHS `state` OR antiquity `provenance` — the two are
 * mutually exclusive by record type, so we render whichever the payload
 * carries. Long provenance strings truncate with an ellipsis; the full
 * value stays available in the modal.
 */
export default function ResultCard({ record, onSelect }) {
  const [failed, setFailed] = useState(false);
  const src = publicImageSrc(record);
  const locus = record.state || record.provenance;

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => onSelect(record)}
      aria-label={`View ${record.title}`}
    >
      <div className={styles.imgWrap}>
        {failed || !src ? (
          <div className={styles.imgFallback} aria-hidden="true">
            <Landmark size={40} />
          </div>
        ) : (
          <img
            src={src}
            alt={record.title}
            className={styles.img}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{record.title}</h3>
        <div className={styles.meta}>
          <span className={styles.ref}>{record.reference_number}</span>
          {locus && (
            <span className={styles.locus} title={locus}>
              <MapPin size={12} aria-hidden="true" />
              <span className={styles.locusText}>{locus}</span>
            </span>
          )}
        </div>
        <div className={styles.updated}>
          Updated {formatUpdatedAt(record.updated_at)}
        </div>
      </div>
    </button>
  );
}