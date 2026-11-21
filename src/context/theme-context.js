import { createContext } from 'react';

import { readStorage } from '@/utils/storage';

/**
 * @typedef {'dark' | 'light'} Theme
 * @typedef {Object} ThemeContextValue
 * @property {Theme} theme
 * @property {(theme: Theme) => void} setTheme
 * @property {() => void} toggleTheme
 */

export const THEME_STORAGE_KEY = 'portfolio.theme';

/**
 * The site's default theme, for every new visitor. Dark is the brand
 * (Ember × Ion on near-black), so the OS `prefers-color-scheme` is
 * deliberately NOT consulted: only an explicit choice switches to light.
 */
export const DEFAULT_THEME = /** @type {Theme} */ ('dark');

/** Theme assumed by prerendered HTML (the pre-paint script corrects it before paint). */
export const SERVER_THEME = DEFAULT_THEME;

/** @type {import('react').Context<ThemeContextValue | null>} */
export const ThemeContext = createContext(null);

/**
 * Resolves the initial theme.
 *
 * Priority: explicit saved choice (localStorage) → dark.
 * The inline script in `index.html` runs the same logic before first paint
 * (to avoid a flash), so the attribute it already set is preferred.
 *
 * Safe on the server: returns the prerender default (`dark`) without a DOM.
 *
 * @returns {Theme}
 */
export function resolveInitialTheme() {
  if (typeof document === 'undefined') return SERVER_THEME;
  const fromDom = document.documentElement.dataset.theme;
  if (fromDom === 'dark' || fromDom === 'light') return fromDom;

  const saved = readStorage(THEME_STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : DEFAULT_THEME;
}
