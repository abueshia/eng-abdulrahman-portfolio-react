/**
 * Shared motion vocabulary. Mirrors the CSS tokens in `styles/tokens.css`
 * and the GSAP eases registered in `lib/gsap.js`, so CSS, motion and GSAP
 * animations share one feel. Nothing moves linearly: every ease carries
 * weight (a hold, an arrival, a settle).
 */

/** Cubic-bezier tuples usable by `motion` (GSAP has the same names registered). */
export const EASE = Object.freeze({
  /** "ember": heavy arrival, long settle. */
  outExpo: [0.16, 1, 0.3, 1],
  outQuart: [0.25, 1, 0.5, 1],
  inOutQuart: [0.76, 0, 0.24, 1],
  spring: [0.34, 1.56, 0.64, 1],
  /** Holds, then opens decisively (camera slit, curtain). */
  shutter: [0.7, 0, 0.15, 1],
  /** Fast, crisp response. */
  snap: [0.5, 0, 0, 1],
  /** Slow ambient movement (light, depth layers). */
  drift: [0.45, 0.05, 0.25, 1],
});

/** Durations in seconds (motion/GSAP use seconds). */
export const DURATION = Object.freeze({
  fast: 0.16,
  base: 0.32,
  slow: 0.64,
  cinematic: 1.1,
});
