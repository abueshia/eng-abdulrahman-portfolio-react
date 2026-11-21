/**
 * Colour-theme store shared by React (ThemeProvider) and by everything that
 * paints outside the DOM (service-mesh canvas, WebGL field).
 * The `data-theme` attribute on <html> IS the state; this module only
 * changes it atomically and tells subscribers, synchronously.
 *
 * Atomic switch: CSS transitions are suppressed while the new theme's
 * styles are computed, so every element (and every canvas, notified in the
 * same call) changes in the same frame. Without this, elements with colour
 * transitions faded at different speeds and a burst of clicks left the page
 * half in one theme and half in the other; a `color` transition on <html>
 * also forced a full-document style recalculation on every frame of the fade.
 *
 * @typedef {'dark' | 'light'} Theme
 */

/** Browser-chrome colour (mobile address bar) per theme. */
export const THEME_CHROME = Object.freeze({ dark: '#07080b', light: '#f4f1ea' });

const SWITCHING_ATTR = 'data-theme-switching';
const listeners = new Set();
let release = 0;

/** @returns {Theme} The theme currently applied to the document. */
export const readTheme = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'
    ? 'light'
    : 'dark';

/**
 * @param {(theme: Theme) => void} listener Called synchronously after each switch.
 * @returns {() => void} Unsubscribe.
 */
export function subscribeTheme(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Applies a theme to the document, atomically, and notifies subscribers.
 * Safe to call many times in a row (rapid clicks): each call fully applies
 * its theme before returning, so there is never an intermediate state.
 * @param {Theme} theme
 */
export function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute(SWITCHING_ATTR, '');
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_CHROME[theme]);
  // Compute the new styles now, while transitions are off: nothing starts fading.
  void root.offsetWidth;
  cancelAnimationFrame(release);
  release = requestAnimationFrame(() => root.removeAttribute(SWITCHING_ATTR));
  listeners.forEach((listener) => listener(theme));
}
