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
      instance = new Lenis({ lerp: 0.1, anchors: false });
      lenisRef.current = instance;
      frame = requestAnimationFrame(function raf(time) {
        instance?.raf(time);
        frame = requestAnimationFrame(raf);
      });
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
