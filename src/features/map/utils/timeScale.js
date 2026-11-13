/**
 * Piecewise time scale: each era from the periods master gets equal width,
 * so short, record-dense eras aren't squashed by the long Harappan span.
 * Shared by the time slider and the detail card's era strip.
 */
export const UNITS_PER_ERA = 100;

export function makeScale(periods) {
  const eras = [...periods].sort((a, b) => a.start_year - b.start_year);
  const total = eras.length * UNITS_PER_ERA;
  const toPos = (y) => {
    if (y <= eras[0].start_year) return 0;
    for (let i = 0; i < eras.length; i += 1) {
      const e = eras[i];
      if (y <= e.end_year) return i * UNITS_PER_ERA + (UNITS_PER_ERA * (y - e.start_year)) / (e.end_year - e.start_year);
    }
    return total;
  };
  const toYear = (pos) => {
    const i = Math.min(eras.length - 1, Math.max(0, Math.floor(pos / UNITS_PER_ERA)));
    const e = eras[i];
    const frac = (pos - i * UNITS_PER_ERA) / UNITS_PER_ERA;
    return Math.round(e.start_year + frac * (e.end_year - e.start_year));
  };
  return { eras, total, toPos, toYear };
}

