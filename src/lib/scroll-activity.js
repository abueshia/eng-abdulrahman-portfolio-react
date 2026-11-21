/**
 * Shared "is the page scrolling right now?" signal for continuous canvas
 * layers, so they can split the frame budget instead of competing for it:
 * the service mesh only animates (below the hero) while the page moves, and
 * the WebGL ambient field rests while it does.
 *
 * One passive scroll listener for the whole app, attached on first use.
 * `active` flips to true on the first scroll event and back to false once
 * no scroll event has arrived for `IDLE_MS`.
 */

const IDLE_MS = 180;

let active = false;
let timer = 0;
let attached = false;
/** @type {Set<(active: boolean) => void>} */
const listeners = new Set();

function emit() {
  for (const listener of listeners) listener(active);
}

function settle() {
  timer = 0;
  active = false;
  emit();
}

function onScroll() {
  window.clearTimeout(timer);
  timer = window.setTimeout(settle, IDLE_MS);
  if (active) return;
  active = true;
  emit();
}

function attach() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener('scroll', onScroll, { passive: true });
}

/** @returns {boolean} */
export function isScrolling() {
  attach();
  return active;
}

/**
 * @param {(active: boolean) => void} listener Called when scrolling starts or settles.
 * @returns {() => void} Unsubscribes.
 */
export function onScrollActivity(listener) {
  if (typeof window === 'undefined') return () => {};
  attach();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
