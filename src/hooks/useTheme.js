import { useContext } from 'react';

import { ThemeContext } from '@/context/theme-context';

/**
 * Access the current colour theme and its setters.
 * @returns {import('@/context/theme-context').ThemeContextValue}
 * @throws {Error} When used outside `<ThemeProvider>`.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>.');
  return ctx;
}
