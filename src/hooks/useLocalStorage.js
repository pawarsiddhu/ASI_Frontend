import { useCallback, useState } from 'react';

/**
 * useLocalStorage — useState that persists to localStorage.
 * Falls back to initialValue if storage is unavailable or JSON parse fails.
 *
 * @template T
 * @param {string} key
 * @param {T} initialValue
 * @returns {[T, (v: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback(
    (v) => {
      setValue((prev) => {
        const next = typeof v === 'function' ? v(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key]
  );

  return [value, set];
}
