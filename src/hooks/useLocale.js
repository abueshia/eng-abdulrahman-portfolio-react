import { useContext } from 'react';

import { LocaleContext } from '@/context/locale-context';

/**
 * Access the active locale, text direction and locale-aware helpers.
 * @returns {import('@/context/locale-context').LocaleContextValue}
 * @throws {Error} When used outside `<LocaleProvider>`.
 */
export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within <LocaleProvider>.');
  return ctx;
}
