import { useEffect, useRef } from 'react';

/**
 * useClickOutside — attach the returned ref to a container element.
 * When a click lands outside it (or user presses Escape), `handler` runs.
 *
 * @param {(event: MouseEvent | KeyboardEvent) => void} handler
 * @returns {React.MutableRefObject<HTMLElement | null>}
 *
 * @example
 *   const ref = useClickOutside(() => setOpen(false));
 *   return <div ref={ref}>...</div>;
 */
export function useClickOutside(handler) {
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handler(e);
      }
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') handler(e);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [handler]);

  return ref;
}
