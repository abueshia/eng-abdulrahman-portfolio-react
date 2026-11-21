/**
 * Pauses the looping CSS animations of page regions that are off screen.
 *
 * Decorative loops (marquees, orbit packets, pulses, rings) kept running in
 * every section at once. Several of them animate SVG paint properties
 * (`stroke-dashoffset`, SVG opacity), which cannot run on the compositor, so
 * the main thread produced a full frame (style, paint, layerize) 60 times a
 * second even with the page at rest. Nobody sees an off-screen loop, so it
 * is paused while its region is out of view and resumed when it returns.
 *
 * No attribute is written on the regions (they may still be dehydrated
 * server HTML, and React must find them untouched): the animations are
 * paused through the Web Animations API. Only CSS animations are touched
 * (WAAPI moves such as FLIP, and GSAP, are not), and only the ones paused
 * here are resumed.
 *
 * Moving an element in the DOM (GSAP re-pins the hero on every refresh)
 * recreates its CSS animations as new, running ones while its visibility
 * does not change, so off-screen regions are swept again whenever scrolling
 * settles and whenever the layout changes.
 */

import { EVENTS, on } from './events';
import { onScrollActivity } from './scroll-activity';

const REGIONS = 'main section[id], footer';

/**
 * @param {ParentNode} [root]
 * @returns {() => void} Stops watching and resumes everything it paused.
 */
export function pauseOffscreenAnimations(root = document) {
  if (typeof IntersectionObserver === 'undefined' || typeof Element === 'undefined') {
    return () => {};
  }
  if (typeof Element.prototype.getAnimations !== 'function') return () => {};

  /** @type {WeakSet<Animation>} */
  const paused = new WeakSet();
  /** @type {Set<Animation>} */
  const pausedList = new Set();
  /** @type {WeakSet<Element>} */
  const watched = new WeakSet();
  /** @type {Set<Element>} */
  const offscreen = new Set();

  /** @param {Element} region */
  const loops = (region) =>
    region
      .getAnimations({ subtree: true })
      .filter(
        (animation) =>
          typeof CSSAnimation !== 'undefined' &&
          animation instanceof CSSAnimation &&
          animation.effect?.getTiming().iterations === Infinity,
      );

  /** @param {Element} region */
  const pause = (region) => {
    for (const animation of loops(region)) {
      if (animation.playState !== 'running') continue;
      animation.pause();
      paused.add(animation);
      pausedList.add(animation);
    }
  };
  const sweep = () => {
    for (const region of offscreen) {
      if (region.isConnected) pause(region);
      else offscreen.delete(region);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          offscreen.delete(entry.target);
          for (const animation of loops(entry.target)) {
            if (!paused.has(animation)) continue;
            paused.delete(animation);
            pausedList.delete(animation);
            animation.play();
          }
        } else {
          offscreen.add(entry.target);
          pause(entry.target);
        }
      }
    },
    { rootMargin: '15% 0px' },
  );
  const offScroll = onScrollActivity((active) => {
    if (!active) sweep();
  });
  const offLayout = on(EVENTS.layout, sweep);

  const scan = () => {
    root.querySelectorAll(REGIONS).forEach((region) => {
      if (watched.has(region)) return;
      watched.add(region);
      observer.observe(region);
    });
  };
  scan();

  // Regions rendered later (client-side navigation, lazy footer): watch them too.
  let frame = 0;
  const mutations = new MutationObserver(() => {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    }
  });
  mutations.observe(document.body, { childList: true, subtree: true });

  return () => {
    cancelAnimationFrame(frame);
    offScroll();
    offLayout();
    mutations.disconnect();
    observer.disconnect();
    for (const animation of pausedList) animation.play();
    pausedList.clear();
  };
}
