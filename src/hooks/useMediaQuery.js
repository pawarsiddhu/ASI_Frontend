import { useEffect, useState } from 'react';

/**
 * useMediaQuery — reactive media query matcher.
 *
 * @param {string} query — e.g. '(max-width: 767px)'
 * @returns {boolean} — true if the query currently matches
 *
 * @example
 *   const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query) {
  const getMatch = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    // Sync now (query might have changed since first render)
    setMatches(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
