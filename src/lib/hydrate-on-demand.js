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
 * fresh render, hidden section), and without IntersectionObserver.
 */

let released = false;
/** @type {Set<() => void>} */
const waiting = new Set();

function releaseAll() {
  released = true;
  for (const resolve of [...waiting]) resolve();
  waiting.clear();
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
    waiting.add(done);
  });
}
