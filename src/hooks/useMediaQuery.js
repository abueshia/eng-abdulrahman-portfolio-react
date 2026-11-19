import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * Uses `useSyncExternalStore` so the value is tear-free under concurrent
 * rendering and correct on the very first render (no false → true flicker).
 *
 * @param {string} query e.g. "(min-width: 768px)"
 * @param {boolean} [serverFallback=false] Value when `matchMedia` is unavailable.
 * @returns {boolean}
 */
export function useMediaQuery(query, serverFallback = false) {
  const subscribe = useCallback(
    (/** @type {() => void} */ onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );

  const getSnapshot = () =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query).matches
      : serverFallback;

  return useSyncExternalStore(subscribe, getSnapshot, () => serverFallback);
}
