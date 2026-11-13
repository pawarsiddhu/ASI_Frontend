import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

import { formatYear } from '../utils/geo';
import { makeScale, UNITS_PER_ERA } from '../utils/timeScale';
import styles from './TimeSlider.module.css';

/**
 * TimeSlider — dual-handle year window with a histogram of matching records.
 *
 * The scale is PIECEWISE: each era from the periods master gets equal width.
 * A linear year scale would give the Harappan era (2,000 years, few records)
 * more room than everything from 0 CE to 1947 — useless for browsing.
 *
 * Play sweeps a one-era-wide window forward through time.
 */


export default function TimeSlider({ periods, from, to, onChange, records, colorForPeriod }) {
  const scale = useMemo(() => makeScale(periods), [periods]);
  const [playing, setPlaying] = useState(false);
  const fromPos = scale.toPos(from);
  const toPos = scale.toPos(to);
  const isFull = fromPos <= 0 && toPos >= scale.total;

  // ---- histogram: how many matching records are "alive" in each bin ----
  const BINS = 64;
  const bins = useMemo(() => {
    const counts = new Array(BINS).fill(0);
    const w = scale.total / BINS;
    records.forEach((r) => {
      if (r.date_start == null) return;
      const a = Math.floor(scale.toPos(r.date_start) / w);
      const b = Math.min(BINS - 1, Math.floor(scale.toPos(r.date_end ?? r.date_start) / w));
      for (let i = Math.max(0, a); i <= b; i += 1) counts[i] += 1;
    });
    return counts;
  }, [records, scale]);
  const maxBin = Math.max(1, ...bins);

  // ---- play: slide a one-era window forward ----
  const playRef = useRef({ from: fromPos, width: UNITS_PER_ERA });
  useEffect(() => {
    if (!playing) return undefined;
    const width = isFull ? UNITS_PER_ERA : Math.max(20, toPos - fromPos);
    playRef.current = { from: isFull ? 0 : fromPos, width };
    const id = setInterval(() => {
      const next = playRef.current.from + 3;
      if (next + playRef.current.width > scale.total) {
        setPlaying(false);
        return;
      }
      playRef.current.from = next;
      onChange(scale.toYear(next), scale.toYear(next + playRef.current.width));
    }, 90);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const setFromPos = (p) => onChange(scale.toYear(Math.min(p, toPos - 2)), to);
  const setToPos = (p) => onChange(from, scale.toYear(Math.max(p, fromPos + 2)));

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div className={styles.label}>
          <span className={styles.eyebrow}>Time window</span>
          <strong>{isFull ? 'All periods' : `${formatYear(from)} → ${formatYear(to)}`}</strong>
        </div>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause time animation' : 'Play through time'}
            title={playing ? 'Pause' : 'Play through time'}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => { setPlaying(false); onChange(scale.toYear(0), scale.toYear(scale.total)); }}
            disabled={isFull}
            aria-label="Reset time window"
            title="Reset"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <div className={styles.track}>
        <div className={styles.hist} aria-hidden="true">
          {bins.map((c, i) => {
            const pos = ((i + 0.5) * scale.total) / BINS;
            const active = pos >= fromPos && pos <= toPos;
            return (
              <span
                key={i}
                className={active ? styles.barOn : styles.bar}
                style={{ height: `${(c / maxBin) * 100}%` }}
              />
            );
          })}
        </div>

        <div className={styles.rangeWrap}>
          <div
            className={styles.window}
            style={{ left: `${(fromPos / scale.total) * 100}%`, width: `${((toPos - fromPos) / scale.total) * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={scale.total}
            value={fromPos}
            onChange={(e) => setFromPos(Number(e.target.value))}
            className={styles.range}
            aria-label="Window start year"
            aria-valuetext={formatYear(from)}
          />
          <input
            type="range"
            min={0}
            max={scale.total}
            value={toPos}
            onChange={(e) => setToPos(Number(e.target.value))}
            className={styles.range}
            aria-label="Window end year"
            aria-valuetext={formatYear(to)}
          />
        </div>

        <div className={styles.eras}>
          {scale.eras.map((e) => (
            <button
              type="button"
              key={e.id}
              className={styles.era}
              style={{ '--era-color': colorForPeriod(e.id) }}
              onClick={() => { setPlaying(false); onChange(e.start_year, e.end_year); }}
              title={`${e.name}: ${formatYear(e.start_year)} – ${formatYear(e.end_year)}`}
              aria-label={`Set time window to ${e.name}`}
            >
              {e.name.replace(/ \(.*\)/, '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
