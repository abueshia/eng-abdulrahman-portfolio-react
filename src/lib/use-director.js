/**
 * Lifecycle for section "directors" (lazy GSAP modules). Import ONLY from
 * `features/*\/fx/*Director.jsx`: it pulls GSAP, which must never reach the
 * initial bundle.
 *
 * The contract every director gets for free (lessons from the hero):
 *  - Setup waits for the real fonts (word and glyph boxes must be measured
 *    with them), and a setup that resolves after cleanup never runs.
 *  - Everything is created synchronously inside one `gsap.context`, and the
 *    cleanup reverts it in full (tweens, ScrollTriggers, SplitText, inline
 *    styles), plus any extra teardown registered with `onCleanup` (rAF loops,
 *    listeners, matchMedia). React StrictMode runs setup → cleanup → setup in
 *    development; the second run must find the DOM exactly as rendered.
 *  - Triggers are refreshed in page order (see `sectionTrigger`), so a section
 *    whose director loads late never measures the page before the sections
 *    above it.
 */
import { useEffect } from 'react';

import { EVENTS, emit } from '@/lib/events';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * ScrollTrigger defaults for a home section. `order` is the section's place
 * on the page (hero = 0): triggers higher up refresh first, because their
 * spacing (sticky scenes) moves everything below them.
 * @param {number} order
 */
export const sectionTrigger = (order) => ({ refreshPriority: -order });

/**
 * @param {(api: { onCleanup: (fn: () => void) => void, scope: HTMLElement }) => void} build
 * @param {{ target: string, deps?: unknown[] }} options `target`: the section id (GSAP scope).
 */
export function useDirector(build, { target, deps = [] }) {
  useEffect(() => {
    const scope = document.getElementById(target);
    if (!scope) return undefined;
    let disposed = false;
    /** @type {gsap.Context | undefined} */
    let context;
    /** @type {Array<() => void>} */
    const cleanups = [];
    const onCleanup = (/** @type {() => void} */ fn) => cleanups.push(fn);

    const run = () => {
      if (disposed) return;
      context = gsap.context(() => build({ onCleanup, scope }), scope);
      scope.dataset.fx = 'on';
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      emit(EVENTS.layout);
    };
    if (!document.fonts || document.fonts.status === 'loaded') run();
    else document.fonts.ready.then(run);

    return () => {
      disposed = true;
      cleanups
        .splice(0)
        .reverse()
        .forEach((fn) => fn());
      context?.revert();
      delete scope.dataset.fx;
      ScrollTrigger.refresh();
      emit(EVENTS.layout);
    };
    // `build` is intentionally excluded: directors pass a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...deps]);
}
