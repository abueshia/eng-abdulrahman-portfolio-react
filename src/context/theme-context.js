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

/** Theme assumed by prerendered HTML (the pre-paint script corrects it before paint). */
export const SERVER_THEME = /** @type {Theme} */ ('dark');

/** @type {import('react').Context<ThemeContextValue | null>} */
export const ThemeContext = createContext(null);

/**
 * Resolves the initial theme.
 *
 * Priority: explicit saved choice → OS `prefers-color-scheme: light` → dark.
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
  if (saved === 'dark' || saved === 'light') return saved;

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
