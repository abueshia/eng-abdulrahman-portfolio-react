/**
 * Shared motion vocabulary. Mirrors the CSS tokens in `styles/tokens.css` so
 * JS-driven (motion / GSAP) and CSS-driven animations feel identical.
 */

/** Cubic-bezier tuples usable by `motion` and convertible for GSAP. */
export const EASE = Object.freeze({
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
  spring: [0.34, 1.56, 0.64, 1],
});

/** Durations in seconds (motion/GSAP use seconds). */
export const DURATION = Object.freeze({
  fast: 0.16,
  base: 0.32,
  slow: 0.64,
  cinematic: 1.1,
});
