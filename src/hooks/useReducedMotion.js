import { useMediaQuery } from './useMediaQuery';

/**
 * True when the user asked the OS to minimise motion. Every JS-driven
 * animation (GSAP, motion, canvas loops, Lenis) must consult this.
 * @returns {boolean}
 */
export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
