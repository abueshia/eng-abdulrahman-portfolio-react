/**
 * Storage helpers that never throw.
 *
 * Why: Safari private mode, disabled cookies, or sandboxed iframes can make
 * `localStorage` access throw. Preferences are a nicety, not a requirement.
 */

/**
 * @param {'local' | 'session'} area
 * @returns {Storage | null}
 */
function getArea(area) {
  try {
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {'local' | 'session'} [area='local']
 * @returns {string | null}
 */
export function readStorage(key, area = 'local') {
  try {
    return getArea(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {string} value
 * @param {'local' | 'session'} [area='local']
 */
export function writeStorage(key, value, area = 'local') {
  try {
    getArea(area)?.setItem(key, value);
  } catch {
    /* ignore quota / privacy errors */
  }
}
