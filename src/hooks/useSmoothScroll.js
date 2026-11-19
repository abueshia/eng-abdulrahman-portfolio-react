import { useCallback, useContext } from 'react';

import { LenisContext } from '@/context/lenis-context';
import { useReducedMotion } from './useReducedMotion';

/**
 * @typedef {Object} ScrollOptions
 * @property {boolean} [immediate=false] Jump without animation.
 * @property {number} [offset=0]         Pixel offset (negative = stop above the target).
 */

/**
 * Programmatic scrolling that goes through Lenis when active, and falls back
 * to native scrolling otherwise.
 *
 * @returns {{
 *   lenisRef: import('react').RefObject<import('lenis').default | null>,
 *   scrollTo: (target: string | number | HTMLElement, options?: ScrollOptions) => void,
 * }}
 */
export function useSmoothScroll() {
  const lenisRef = useContext(LenisContext);
  const reduced = useReducedMotion();

  const scrollTo = useCallback(
    (target, { immediate = false, offset = 0 } = {}) => {
      const jump = immediate || reduced;
      const lenis = lenisRef.current;
      if (lenis) {
        lenis.scrollTo(target, { immediate: jump, offset, force: true });
        return;
      }
      const behavior = jump ? 'auto' : 'smooth';
      if (typeof target === 'number') {
        window.scrollTo({ top: target + offset, behavior });
        return;
      }
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      if (el) {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY + offset,
          behavior,
        });
      }
    },
    [lenisRef, reduced],
  );

  return { lenisRef, scrollTo };
}
