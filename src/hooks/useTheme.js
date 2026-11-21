import { useContext, useMemo, useSyncExternalStore } from 'react';

import { SERVER_THEME, ThemeContext, resolveInitialTheme } from '@/context/theme-context';
import { subscribeTheme } from '@/lib/theme';

const getServerSnapshot = () => SERVER_THEME;

/**
 * Access the current colour theme and its setters.
 *
 * The theme is read here, from the `<html data-theme>` store, not from the
 * context: the provider's value stays constant so that the post-hydration
 * switch to a light theme never reaches sections that have not hydrated yet
 * (see `ThemeProvider`).
 *
 * @returns {import('@/context/theme-context').ThemeContextValue}
 * @throws {Error} When used outside `<ThemeProvider>`.
 */
export function useTheme() {
  const actions = useContext(ThemeContext);
  if (!actions) throw new Error('useTheme must be used within <ThemeProvider>.');
  const theme = useSyncExternalStore(subscribeTheme, resolveInitialTheme, getServerSnapshot);
  return useMemo(() => ({ theme, ...actions }), [theme, actions]);
}
