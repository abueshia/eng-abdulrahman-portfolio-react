/**
 * Helpers for authoring bilingual mock records.
 *
 * Source records store translatable fields as `{ ar, en }`. The mock adapter
 * flattens them to the requested language, exactly like Laravel API Resources
 * do on the real backend.
 */

/**
 * @template T
 * @param {T} ar
 * @param {T} en
 * @returns {{ ar: T, en: T }}
 */
export const t = (ar, en) => ({ ar, en });

/**
 * Resolves a placeholder image path. Real media will come from the API's
 * storage URLs; components must handle missing files gracefully.
 * @param {string} path
 */
export const media = (path) => `/images/${path}`;

/**
 * Marker for every value that still waits for the owner's real data.
 * `npm run data:todo` lists all remaining occurrences; nothing carrying this
 * marker may ship to production.
 */
export const TODO_REAL_DATA = 'TODO_REAL_DATA';
