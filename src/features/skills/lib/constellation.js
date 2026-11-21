/**
 * Tech constellation geometry: pure and deterministic (prerendered as SVG,
 * identical on the client, testable).
 *
 * One core, one circular orbit per category (inner = first). Nodes are
 * spread evenly on their orbit, each orbit rotated by its own offset so the
 * clusters interleave instead of lining up. A node's radius and brightness
 * encode proficiency (radius grows with its square, so mastery reads at a
 * glance and middling skills stay modest).
 *
 * Coordinates live in a 1000 × 1000 box centred on the core.
 */

export const VIEWBOX = '-500 -500 1000 1000';
export const CORE_RADIUS = 58;
const FIRST_ORBIT = 122;
const ORBIT_GAP = 68;

const clamp01 = (/** @type {number} */ v) => Math.min(1, Math.max(0, v));
const round = (/** @type {number} */ v) => Math.round(v * 100) / 100;

/**
 * @typedef {{ slug: string, name: string, proficiency?: number, years?: number }} Tech
 * @typedef {{ category: string, name: string, technologies: Tech[] }} TechGroup
 *
 * @typedef {Object} StarNode
 * @property {string} slug
 * @property {string} name
 * @property {number} x
 * @property {number} y
 * @property {number} size   Dot radius.
 * @property {number} glow   0–1 brightness.
 * @property {number} lx     Label anchor point.
 * @property {number} ly
 * @property {'start' | 'end'} anchor
 *
 * @typedef {{ category: string, name: string, r: number, nodes: StarNode[] }} Orbit
 */

/**
 * @param {number} proficiency 0–100
 * @returns {{ size: number, glow: number }}
 */
export function encodeProficiency(proficiency) {
  const p = clamp01((proficiency ?? 0) / 100);
  return { size: round(3.5 + p * p * 8.5), glow: round(0.28 + p * 0.72) };
}

/**
 * @param {TechGroup[]} groups
 * @returns {Orbit[]}
 */
export function layoutConstellation(groups) {
  return groups.map((group, k) => {
    const r = FIRST_ORBIT + k * ORBIT_GAP;
    const count = Math.max(1, group.technologies.length);
    const offset = -Math.PI / 2 + k * 0.92;
    return {
      category: group.category,
      name: group.name,
      r,
      nodes: group.technologies.map((tech, i) => {
        const angle = offset + (i / count) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const { size, glow } = encodeProficiency(tech.proficiency ?? 0);
        const reach = r + size + 10;
        return {
          slug: tech.slug,
          name: tech.name,
          x: round(cos * r),
          y: round(sin * r),
          size,
          glow,
          lx: round(cos * reach),
          ly: round(sin * reach + 4),
          anchor: cos >= 0 ? 'start' : 'end',
        };
      }),
    };
  });
}

/**
 * Index of the tab to show after a horizontal swipe, honouring reading
 * direction (in RTL, swiping left goes back). Null when the gesture is not
 * a deliberate horizontal swipe.
 * @param {{ dx: number, dy: number, index: number, count: number, rtl: boolean, threshold?: number }} input
 * @returns {number | null}
 */
export function swipeTarget({ dx, dy, index, count, rtl, threshold = 48 }) {
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.4) return null;
  const forward = rtl ? dx > 0 : dx < 0;
  const next = index + (forward ? 1 : -1);
  return next < 0 || next >= count ? null : next;
}
