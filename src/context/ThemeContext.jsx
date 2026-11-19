import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { writeStorage } from '@/utils/storage';
import {
  SERVER_THEME,
  THEME_STORAGE_KEY,
  ThemeContext,
  resolveInitialTheme,
} from './theme-context';

/**
 * The theme lives on `<html data-theme>` (set before first paint by the inline
 * script in index.html), so the DOM attribute is the store and React only
 * subscribes to it.
 *
 * Why `useSyncExternalStore`: prerendered HTML is always produced with the
 * server snapshot (`dark`). During hydration React renders that same snapshot,
 * then re-renders with the real one, so a light-mode visitor never triggers a
 * hydration mismatch.
 */
const listeners = new Set();

/** @param {() => void} listener */
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getServerSnapshot = () => SERVER_THEME;

/**
 * Writes the theme to the document and browser chrome, then notifies subscribers.
 * @param {import('./theme-context').Theme} theme
 */
function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Keep the browser UI (mobile address bar) in tune with the canvas colour.
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', theme === 'dark' ? '#07080b' : '#f4f1ea');
  listeners.forEach((listener) => listener());
}

/**
 * Provides the colour theme and persists explicit user choices.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, resolveInitialTheme, getServerSnapshot);

  // Make sure the attribute exists even if the pre-paint script did not run
  // (tests, embedded previews). Never overwrite an existing value: during
  // hydration `theme` is the server snapshot, not the visitor's choice.
  useEffect(() => {
    if (!document.documentElement.dataset.theme) applyTheme(resolveInitialTheme());
  }, []);

  const setTheme = useCallback((/** @type {import('./theme-context').Theme} */ next) => {
    writeStorage(THEME_STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  );

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
