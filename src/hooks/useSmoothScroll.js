import { useCallback, useContext } from 'react';

import { LenisContext } from '@/context/lenis-context';
import { useReducedMotion } from './useReducedMotion';

/**
 * @typedef {Object} ScrollOptions
 * @property {boolean} [immediate=false] Jump without animation.
 * @property {number} [offset=0]         Pixel offset (negative = stop above the target).
 */

/** Beyond this distance (in viewports) a smooth scroll starts with a cut. */
const FAR = 1.5;
/** How much of the trip (in viewports) is still glided after the cut. */
const GLIDE = 0.75;

/**
 * Document-space top of a scroll target, or null when it is not in the DOM.
 * @param {string | number | HTMLElement} target
 * @param {number} offset
 * @returns {number | null}
 */
function targetTop(target, offset) {
  if (typeof target === 'number') return target + offset;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  return el ? el.getBoundingClientRect().top + window.scrollY + offset : null;
}

/**
 * Programmatic scrolling that goes through Lenis when active, and falls back
 * to native scrolling otherwise.
 *
 * Far targets (a navbar link from the hero to Contact) are not glided all the
 * way: every section passed on the way would load its chunk, hydrate, build
 * its GSAP director and run its scrubbed scenes mid-flight, which is what made
 * those jumps stutter. The page cuts to just before the target instead and
 * glides the last stretch, so the arrival still reads as motion.
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
      const top = targetTop(target, offset);
      if (!jump && top !== null) {
        const viewport = window.innerHeight;
        const distance = top - window.scrollY;
        if (Math.abs(distance) > viewport * FAR) {
          const lead = top - Math.sign(distance) * viewport * GLIDE;
          if (lenis) lenis.scrollTo(lead, { immediate: true, force: true });
          else window.scrollTo({ top: lead, behavior: 'auto' });
        }
      }
      if (lenis) {
        lenis.scrollTo(target, { immediate: jump, offset, force: true });
        return;
      }
      if (top !== null) window.scrollTo({ top, behavior: jump ? 'auto' : 'smooth' });
    },
    [lenisRef, reduced],
  );

  return { lenisRef, scrollTo };
}
