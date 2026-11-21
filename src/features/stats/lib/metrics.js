/**
 * Pure helpers for the observability board (no DOM, no browser APIs: they
 * run in the prerenderer and the browser alike).
 *
 * Honesty rule: a panel only draws what its data supports. A metric whose
 * value is missing or zero is a "No data" panel (dashed flat baseline), never
 * a made-up curve, so sample figures can never pass for real ones.
 */

/**
 * @typedef {Object} Metric
 * @property {string} key
 * @property {number} value
 * @property {string} [suffix]
 * @property {string} label
 */

/** Rows in an odometer reel: two full cycles, 0–9 then 0–9. */
export const REEL_ROWS = 20;

/**
 * @param {Metric | undefined} metric
 * @returns {boolean} Whether the panel has a value worth plotting.
 */
export const hasData = (metric) =>
  Boolean(metric) && Number.isFinite(metric?.value) && /** @type {Metric} */ (metric).value > 0;

/**
 * Digits of a non-negative integer, most significant first.
 * @param {number} value
 * @returns {number[]}
 */
export const digitsOf = (value) =>
  String(Math.max(0, Math.floor(value)))
    .split('')
    .map(Number);

/**
 * Final position of an odometer reel, as a percentage of the reel's height
 * (for `yPercent`). Every column rolls through one full cycle before landing,
 * so even a "0" digit visibly turns.
 * @param {number} digit 0–9
 * @returns {number} Negative percentage.
 */
export const reelOffset = (digit) => -((10 + digit) / REEL_ROWS) * 100;

/**
 * A stepped cumulative series for a count that grows by whole units over time
 * (years of experience, projects shipped…): one step per unit, capped so big
 * counts still draw a readable line.
 * @param {number} value
 * @param {number} [maxSteps=12]
 * @returns {number[]} Normalised 0–1 levels, first is 0, last is 1.
 */
export function stepSeries(value, maxSteps = 12) {
  const steps = Math.max(1, Math.min(maxSteps, Math.floor(value)));
  return Array.from({ length: steps + 1 }, (_, i) => i / steps);
}

/**
 * SVG paths for a sparkline in a `width × height` box (y grows downwards).
 * With data: a stepped line and its filled area. Without: a flat baseline.
 * @param {number[] | null} series Normalised levels, or null for "No data".
 * @param {{ width?: number, height?: number, pad?: number }} [box]
 * @returns {{ line: string, area: string | null }}
 */
export function sparkPaths(series, { width = 240, height = 64, pad = 4 } = {}) {
  const bottom = height - pad;
  if (!series || series.length < 2) {
    return { line: `M0 ${bottom} H${width}`, area: null };
  }
  const top = pad;
  const stepWidth = width / (series.length - 1);
  const y = (/** @type {number} */ level) => +(bottom - level * (bottom - top)).toFixed(2);
  let line = `M0 ${y(series[0])}`;
  for (let i = 1; i < series.length; i += 1) {
    const x = +(i * stepWidth).toFixed(2);
    // Hold the level, then rise: a step for every unit gained.
    line += ` H${x} V${y(series[i])}`;
  }
  return { line, area: `${line} V${height} H0 Z` };
}
