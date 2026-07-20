import { useState } from 'react';
import { ZoomIn, Landmark, Gem } from 'lucide-react';
import { imageSrc } from '@utils/imageSrc';
import styles from './RecordImageMat.module.css';

/**
 * RecordImageMat — the "framed" record image on the detail page.
 *
 * Sits inside a warm cream mat with a subtle gold border, echoing the way
 * a museum object card presents an image. Below the image, a small italic
 * caption ("Field photograph, {circle} survey") and a zoom affordance.
 *
 * When there is no image (or it fails to load), a warm gradient placeholder
 * with a category-appropriate icon fills the same space — the layout never
 * collapses.
 */
export default function RecordImageMat({ record, caption, onEnlarge }) {
  const src = imageSrc(record);
  const [failed, setFailed] = useState(false);
  const isBhs = record?.type === 'BHS';
  const showImage = src && !failed;

  return (
    <figure className={styles.mat}>
      <div
        className={`${styles.frame} ${!showImage ? (isBhs ? styles.bhsFallback : styles.antiquityFallback) : ''}`}
      >
        {showImage ? (
          <img
            src={src}
            alt={record.title || 'Record image'}
            className={styles.img}
            onError={() => setFailed(true)}
          />
        ) : (
          <div className={styles.placeholder}>
            {isBhs ? (
              <Landmark size={64} aria-hidden="true" />
            ) : (
              <Gem size={64} aria-hidden="true" />
            )}
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.captionText}>
          {caption || defaultCaption(record)}
        </span>
        {showImage && onEnlarge && (
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={onEnlarge}
          >
            <ZoomIn size={13} />
            <span>Enlarge</span>
          </button>
        )}
      </figcaption>
    </figure>
  );
}

function defaultCaption(record) {
  const type = record?.type === 'BHS' ? 'Site' : 'Field';
  const circle = record?.circle
    ? ` — ${String(record.circle).charAt(0) + String(record.circle).slice(1).toLowerCase()} circle survey`
    : '';
  return `${type} photograph${circle}`;
}
