import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import '@/i18n';
import {
  LOCALE_STORAGE_KEY,
  getDirection,
  getLocaleFromPath,
  localizePath,
  stripLocale,
} from '@/config/routes';
import { writeStorage } from '@/utils/storage';
import { LocaleContext } from './locale-context';

/**
 * Bridges the router and i18next.
 *
 * The URL is the single source of truth for the locale: switching language is
 * a client-side navigation to the equivalent URL (no reload), and i18next is
 * synced to whatever the URL says (this also covers back/forward navigation).
 *
 * Must be rendered inside a router.
 * @param {{ children: import('react').ReactNode }} props
 */
export function LocaleProvider({ children }) {
  const { i18n } = useTranslation();
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const locale = getLocaleFromPath(pathname);

  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
  }, [i18n, locale]);

  const localize = useCallback((path = '/') => localizePath(locale, path), [locale]);

  const switchLocale = useCallback(
    (target) => {
      const next = target ?? (locale === 'ar' ? 'en' : 'ar');
      if (next === locale) return;
      // Only an explicit switch is remembered (step 2 of the detection order,
      // applied by main.jsx on the next visit). Merely viewing an /en URL, e.g.
      // from a shared link, never takes Arabic away from the root URL.
      writeStorage(LOCALE_STORAGE_KEY, next);
      // Change the language first so the next screen renders translated
      // immediately, then move to the equivalent URL without scrolling.
      i18n.changeLanguage(next);
      navigate(`${localizePath(next, stripLocale(pathname))}${search}${hash}`, {
        preventScrollReset: true,
        state: { localeSwitch: true },
      });
    },
    [i18n, locale, navigate, pathname, search, hash],
  );

  const value = useMemo(() => {
    const dir = getDirection(locale);
    return { locale, dir, isRTL: dir === 'rtl', localize, switchLocale };
  }, [locale, localize, switchLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
