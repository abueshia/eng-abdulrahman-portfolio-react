import { useEffect, useRef } from 'react';

import { LenisContext } from '@/context/lenis-context';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Enables Lenis smooth scrolling for the whole document.
 *
 * Disabled entirely under `prefers-reduced-motion` (native scrolling is the
 * accessible choice there). Touch devices keep native momentum scrolling:
 * Lenis only smooths wheel input by default.
 *
 * The instance is shared through a ref (not state): consumers only need it
 * inside event handlers/effects, so publishing it must not re-render the app.
 *
 * Lenis is imported on mount (its own chunk) rather than statically: it only
 * smooths wheel input, so the first paint and hydration never need it. Lazy
 * directors start after idle + fonts, by which time the instance exists.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function SmoothScroll({ children }) {
  const reduced = useReducedMotion();
  const lenisRef = useRef(/** @type {import('lenis').default | null} */ (null));

  useEffect(() => {
    if (reduced) return undefined;
    let cancelled = false;
    let frame = 0;
    /** @type {import('lenis').default | null} */
    let instance = null;
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ lerp: 0.1, anchors: false });
      instance = lenis;
      lenisRef.current = lenis;

      // The loop sleeps while nothing scrolls: a perpetual rAF makes the
      // browser build a full frame (style, layerize, commit) 60 times a
      // second on a page at rest. Every Lenis scroll (wheel input included)
      // goes through `scrollTo`, so wrapping it wakes the loop.
      let idleFrames = 0;
      const tick = (/** @type {number} */ time) => {
        lenis.raf(time);
        idleFrames = lenis.isScrolling ? 0 : idleFrames + 1;
        frame = idleFrames > 20 ? 0 : requestAnimationFrame(tick);
      };
      const wake = () => {
        idleFrames = 0;
        if (frame) return;
        lenis.time = 0; // first frame after a nap advances by 0, not by the nap
        frame = requestAnimationFrame(tick);
      };
      const scrollTo = lenis.scrollTo.bind(lenis);
      lenis.scrollTo = (...args) => {
        wake();
        return scrollTo(...args);
      };
      lenis.on('virtual-scroll', wake);
      wake();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      instance?.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  return <LenisContext.Provider value={lenisRef}>{children}</LenisContext.Provider>;
}
