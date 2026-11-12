import { useEffect, useState } from 'react';
import { X, MapPin, Landmark, Calendar, Hash, Compass } from 'lucide-react';
import styles from './ResultDetailModal.module.css';
import { publicImageSrc, formatUpdatedAt } from '../utils';

/**
 * ResultDetailModal — click-through detail from a card.
 *
 * There is no public detail endpoint yet; this modal displays exactly the
 * fields the list endpoint returns, at a larger size. Both BHS `state`
 * and antiquity `provenance` are rendered (whichever the record carries).
 */
export default function ResultDetailModal({ record, onClose }) {
  const [failed, setFailed] = useState(false);
  const src = publicImageSrc(record);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!record) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
    >
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className={styles.imgWrap}>
          {failed || !src ? (
            <div className={styles.imgFallback} aria-hidden="true">
              <Landmark size={64} />
            </div>
          ) : (
            <img
              src={src}
              alt={record.title}
              className={styles.img}
              onError={() => setFailed(true)}
            />
          )}
        </div>

        <div className={styles.body}>
          <h2 id="result-modal-title" className={styles.title}>
            {record.title}
          </h2>

          <dl className={styles.meta}>
            <div className={styles.metaRow}>
              <dt><Hash size={13} aria-hidden="true" />Reference</dt>
              <dd className={styles.mono}>{record.reference_number}</dd>
            </div>
            {record.state && (
              <div className={styles.metaRow}>
                <dt><MapPin size={13} aria-hidden="true" />State</dt>
                <dd>{record.state}</dd>
              </div>
            )}
            {record.provenance && (
              <div className={styles.metaRow}>
                <dt><Compass size={13} aria-hidden="true" />Provenance</dt>
                <dd>{record.provenance}</dd>
              </div>
            )}
            <div className={styles.metaRow}>
              <dt><Calendar size={13} aria-hidden="true" />Last updated</dt>
              <dd>{formatUpdatedAt(record.updated_at)}</dd>
            </div>
          </dl>

          <div className={styles.note}>
            Published to the national register. Additional fields are held in
            the internal record and are not disclosed in the public view.
          </div>
        </div>
      </div>
    </div>
  );
}