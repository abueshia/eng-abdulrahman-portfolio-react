/**
 * App-wide DOM events for decoupled effects (no React context, no re-renders).
 * Payloads travel in `CustomEvent.detail`.
 */
export const EVENTS = Object.freeze({
  /**
   * Layout changed (pinning, lazy sections): scroll-position consumers
   * re-measure. Also emitted on every ScrollTrigger refresh, so a listener
   * must never call `ScrollTrigger.refresh()` in response (that loop re-ran a
   * full refresh every frame and pinned the CPU).
   */
  layout: 'portfolio:layout',
  /** Case-file records moved (filter enter/exit settled): their triggers re-measure. */
  casesMoved: 'portfolio:cases-moved',
  /** The secret terminal command: the system "goes down", then reboots. */
  outage: 'portfolio:outage',
  /** The page-transition curtain fully covers the viewport (safe to reset scroll). */
  covered: 'portfolio:covered',
});

/**
 * @param {string} name
 * @param {unknown} [detail]
 */
export function emit(name, detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/**
 * @param {string} name
 * @param {(detail: any) => void} handler
 * @returns {() => void} Unsubscribe.
 */
export function on(name, handler) {
  if (typeof window === 'undefined') return () => {};
  const listener = (/** @type {Event} */ event) =>
    handler(/** @type {CustomEvent} */ (event).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}
