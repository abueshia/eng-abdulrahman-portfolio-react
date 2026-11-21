import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

import { applyTheme, readTheme, subscribeTheme } from '@/lib/theme';
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
 * subscribes to it through `lib/theme.js`, the same store the canvas layers use.
 *
 * Why `useSyncExternalStore`: prerendered HTML is always produced with the
 * server snapshot (`dark`). During hydration React renders that same snapshot,
 * then re-renders with the real one, so a light-mode visitor never triggers a
 * hydration mismatch.
 */
const getServerSnapshot = () => SERVER_THEME;

/**
 * Provides the colour theme and persists explicit user choices.
 * @param {{ children: import('react').ReactNode }} props
 */
export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribeTheme, resolveInitialTheme, getServerSnapshot);

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

  // Reads the document, not the last render: a burst of clicks that lands
  // before React re-renders still alternates correctly.
  const toggleTheme = useCallback(
    () => setTheme(readTheme() === 'dark' ? 'light' : 'dark'),
    [setTheme],
  );

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
