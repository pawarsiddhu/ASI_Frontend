import { useEffect, useState } from 'react';

/**
 * useDebounce — returns the input value after it hasn't changed for `delay` ms.
 * Great for wiring search inputs to API queries without hammering the server.
 *
 * @template T
 * @param {T} value
 * @param {number} [delay=300]
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
