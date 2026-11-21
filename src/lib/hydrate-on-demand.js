/**
 * Hydration on demand for prerendered, lazily loaded regions.
 *
 * A home section is a `React.lazy` chunk inside `<Suspense>`. While its chunk
 * has not loaded, React keeps the prerendered HTML exactly as it is (visible,
 * readable, crawlable, find-in-page works) and hydrates it once the chunk
 * arrives. Loading every section chunk at start-up therefore means hydrating
 * the whole ~3 000-node page at once, which on a mid-range phone is seconds
 * of main-thread work (measured: most of the mobile Total Blocking Time).
 *
 * `whenNeeded(selector)` delays the chunk until the region is about to be
 * seen (one viewport ahead) or the visitor first interacts (pointer, touch,
 * key: an interaction may change state above the region, and a boundary that
 * is still dehydrated would then have to re-render on the client).
 *
 * It resolves immediately when there is nothing to wait for: on the server
 * (prerendering), when the region is not in the DOM (client-side navigation,
 * fresh render, hidden section), and without IntersectionObserver. It also
 * resolves when the region is removed from the DOM (see `watchRemovals`).
 */

import { onIdle } from './idle';

let released = false;
/** Pending waits, each with the prerendered element it watches. @type {Map<() => void, Element>} */
const waiting = new Map();

/**
 * First interaction: every pending region is released, one per idle slot
 * (nearest to the viewport first). Releasing them all in the same task loaded
 * and hydrated the whole page at once on the first click, which is exactly
 * when the visitor expects a response (a navbar jump stuttered on it).
 */
function releaseAll() {
  released = true;
  const viewport = window.innerHeight;
  const queue = [...waiting]
    .map(([done, element]) => {
      const rect = element.getBoundingClientRect();
      const distance = rect.bottom < 0 ? -rect.bottom : Math.max(0, rect.top - viewport);
      return { done, distance };
    })
    .sort((a, b) => a.distance - b.distance)
    .map((entry) => entry.done);
  const next = () => {
    const done = queue.shift();
    if (!done) return;
    done();
    if (queue.length) onIdle(next, { timeout: 400 });
  };
  next();
}

let listening = false;
function listenForIntent() {
  if (listening) return;
  listening = true;
  const options = { capture: true, passive: true, once: true };
  for (const type of ['pointerdown', 'touchstart', 'keydown']) {
    window.addEventListener(type, releaseAll, options);
  }
}

/*
 * React may give up on the server HTML of a boundary that has not hydrated
 * yet: when something above it changes first (theme or reduced-motion store,
 * a refetched query), it deletes that markup and renders the boundary on the
 * client. The client render waits for this very chunk, while the
 * IntersectionObserver keeps watching the deleted element and never fires:
 * a deadlock that left the page empty below the hero. So a wait also ends as
 * soon as its element leaves the document.
 */
/** @type {MutationObserver | null} */
let removals = null;
function watchRemovals() {
  if (removals || typeof MutationObserver === 'undefined') return;
  removals = new MutationObserver(() => {
    for (const [done, element] of [...waiting]) {
      if (!element.isConnected) done();
    }
    if (waiting.size === 0) {
      removals?.disconnect();
      removals = null;
    }
  });
  removals.observe(document.documentElement, { childList: true, subtree: true });
}

/**
 * @param {string} selector The prerendered region, e.g. "#stats".
 * @param {{ rootMargin?: string }} [options]
 * @returns {Promise<void>}
 */
export function whenNeeded(selector, { rootMargin = '100% 0px' } = {}) {
  if (typeof window === 'undefined' || released) return Promise.resolve();
  const element = document.querySelector(selector);
  if (!element || typeof IntersectionObserver === 'undefined') return Promise.resolve();
  listenForIntent();
  return new Promise((resolve) => {
    const done = () => {
      observer.disconnect();
      waiting.delete(done);
      resolve();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) done();
      },
      { rootMargin },
    );
    observer.observe(element);
    waiting.set(done, element);
    watchRemovals();
  });
}
