import { useCallback, useEffect, useMemo } from 'react';

import { applyTheme, readTheme } from '@/lib/theme';
import { writeStorage } from '@/utils/storage';
import { THEME_STORAGE_KEY, ThemeContext, resolveInitialTheme } from './theme-context';

/**
 * The theme lives on `<html data-theme>` (set before first paint by the inline
 * script in index.html), so the DOM attribute is the store: `useTheme()` reads
 * it through `useSyncExternalStore` (server snapshot `dark`, so a light-mode
 * visitor never triggers a hydration mismatch), the same store the canvas
 * layers use.
 *
 * Why the provider holds only the setters (stable): a context value that
 * changes right after hydration (dark snapshot → the visitor's light theme)
 * is propagated by React into every Suspense boundary below that has not
 * hydrated yet, and React then discards their prerendered HTML and renders
 * them on the client: the page went blank for a moment on load. Keeping the
 * value constant leaves those boundaries alone; only `useTheme()` callers
 * (already hydrated) re-render.
 */
export function ThemeProvider({ children }) {
  // Make sure the attribute exists even if the pre-paint script did not run
  // (tests, embedded previews). Never overwrite an existing value: during
  // hydration the rendered theme is the server snapshot, not the visitor's choice.
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

  const value = useMemo(() => ({ setTheme, toggleTheme }), [setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
