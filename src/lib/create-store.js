/**
 * Minimal external store (the `useSyncExternalStore` contract).
 *
 * Used for state that is written outside React (scroll trackers, loaders,
 * canvas loops) and read both by React and by per-frame code, without
 * re-rendering the tree on every write.
 *
 * @template T
 * @param {T} initial
 */
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();

  return {
    /** @returns {T} */
    get: () => state,
    /** @param {T | ((prev: T) => T)} next */
    set(next) {
      const value = typeof next === 'function' ? /** @type {(prev: T) => T} */ (next)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((listener) => listener());
    },
    /** @param {() => void} listener */
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
