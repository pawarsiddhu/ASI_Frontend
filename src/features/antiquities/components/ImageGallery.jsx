import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, ZoomIn, X } from 'lucide-react';
import styles from './ImageGallery.module.css';

/**
 * ImageGallery — record image hero.
 *
 * Reworked after the demo feedback that things were "not in proportion" and
 * the page felt "plain". Instead of wrapping the image in a titled card
 * (which showed a noisy "Images (1 of 1)" header when there's only ever one
 * image per record in POC), we render it as a proper hero: big, framed with
 * a soft gradient backdrop, click to zoom.
 *
 * Multi-image code is retained behind a length check in case the backend
 * lifts the single-image constraint later — we just won't hit it today.
 *
 * Keyboard: ← / → to navigate (when multi-image), Esc to close zoom.
 */
export default function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const stripRef = useRef(null);

  useEffect(() => {
    if (active >= images.length && images.length > 0) setActive(0);
  }, [images.length, active]);

  useEffect(() => {
    const handler = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA'
      )
        return;
      if (zoomOpen && e.key === 'Escape') {
        setZoomOpen(false);
        return;
      }
      if (images.length < 2) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((i) => (i - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((i) => (i + 1) % images.length);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [images.length, zoomOpen]);

  // Empty state — still a proper visual block, not a tiny "no images" line.
  // Matches the hero height so the page layout doesn't collapse.
  if (!images.length) {
    return (
      <div className={`${styles.hero} ${styles.heroEmpty}`}>
        <div className={styles.emptyInner}>
          <ImageOff size={40} strokeWidth={1.5} />
          <p className={styles.emptyMsg}>No image uploaded for this record</p>
        </div>
      </div>
    );
  }

  const isMulti = images.length > 1;
  const goPrev = () =>
    setActive((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setActive((i) => (i + 1) % images.length);

  return (
    <>
      <figure className={styles.hero}>
        <button
          type="button"
          className={styles.heroImage}
          onClick={() => setZoomOpen(true)}
          aria-label="Zoom image"
        >
          <img src={images[active]} alt={`Record image ${active + 1}`} />

          {/* Zoom affordance appears on hover — signals "click to enlarge" */}
          <span className={styles.zoomHint}>
            <ZoomIn size={14} />
            <span>Click to zoom</span>
          </span>
        </button>

        {isMulti && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={goPrev}
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={goNext}
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </button>
            <div className={styles.counter}>
              {active + 1} / {images.length}
            </div>
          </>
        )}
      </figure>

      {isMulti && (
        <div className={styles.strip} ref={stripRef} role="tablist">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`Show image ${i + 1}`}
              className={`${styles.thumb} ${
                i === active ? styles.thumbActive : ''
              }`}
              onClick={() => setActive(i)}
            >
              <img src={img} alt="" />
            </button>
          ))}
        </div>
      )}

      {zoomOpen && (
        <div
          className={styles.lightbox}
          onClick={() => setZoomOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Zoomed image"
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setZoomOpen(false)}
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <img
            src={images[active]}
            alt={`Image ${active + 1} fullscreen`}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
