/**
 * Runs `callback` once the main thread is idle (after first paint and
 * hydration), with a deadline so it never waits forever.
 * @param {() => void} callback
 * @param {{ timeout?: number }} [options]
 * @returns {() => void} Cancels the pending callback.
 */
export function onIdle(callback, { timeout = 1500 } = {}) {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(() => callback(), { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 200);
  return () => window.clearTimeout(id);
}
