import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';

import styles from './StoryPlayer.module.css';

/** "Stories" button + menu. Lives in the map toolbar. */
export function StoryMenu({ stories, onStart }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={styles.menuWrap} ref={ref}>
      <button
        type="button"
        className={styles.menuBtn}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Stories"
      >
        <BookOpen size={15} /> <span>Stories</span>
      </button>
      {open && (
        <ul className={styles.menu} role="menu">
          {stories.map((s) => (
            <li key={s.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={styles.menuItem}
                onClick={() => { setOpen(false); onStart(s.id); }}
              >
                <strong>{s.title}</strong>
                <span>{s.blurb}</span>
                <small>{s.steps.length} steps{s.demoNote ? ` · ${s.demoNote}` : ''}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The step card shown over the map while a story runs. */
export function StoryCard({ story, step, text, onPrev, onNext, onExit }) {
  const s = story.steps[step];
  const last = step === story.steps.length - 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft' && step > 0) onPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrev, step]);

  return (
    <section className={styles.card} aria-live="polite" aria-label={`Story: ${story.title}`}>
      <header className={styles.head}>
        <span className={styles.eyebrow}><BookOpen size={12} /> {story.title}</span>
        <button type="button" className={styles.exit} onClick={onExit} aria-label="Exit story"><X size={15} /></button>
      </header>
      <div className={styles.progress} aria-hidden="true">
        {story.steps.map((_, i) => <span key={i} className={i <= step ? styles.barOn : styles.bar} />)}
      </div>
      <h3 className={styles.title}>{s.title}</h3>
      <p className={styles.text}>{text}</p>
      <p className={styles.draft}>Draft narrative for demo — pending ASI review.</p>
      <footer className={styles.foot}>
        <span className={styles.count}>{step + 1} / {story.steps.length}</span>
        <div className={styles.nav}>
          <button type="button" className={styles.navBtn} onClick={onPrev} disabled={step === 0}>
            <ChevronLeft size={15} /> Back
          </button>
          <button type="button" className={styles.navPrimary} onClick={last ? onExit : onNext}>
            {last ? 'Finish' : <>Next <ChevronRight size={15} /></>}
          </button>
        </div>
      </footer>
    </section>
  );
}
