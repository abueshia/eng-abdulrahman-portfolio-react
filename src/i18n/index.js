/**
 * i18next bootstrap.
 *
 * - Both locale bundles are imported statically: they are tiny, and it makes
 *   language switching instant (no network round-trip, no Suspense flash).
 * - Detection order is URL path → localStorage → Arabic. Browser language is
 *   deliberately NOT consulted so Arabic remains the true default. The
 *   localStorage step happens in `main.jsx` (it rewrites the URL), so by the
 *   time i18next starts the URL alone decides. No detector plugin needed,
 *   which also keeps this module safe to import during prerendering (Node).
 * - `<html lang/dir>` is updated on every language change, from one place.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getDirection,
  getLocaleFromPath,
} from '@/config/routes';
import ar from './locales/ar.json';
import en from './locales/en.json';

/**
 * Reflects the active locale on the document root so CSS (`:root[lang=ar]`),
 * Tailwind `rtl:`/`ltr:` variants and assistive technology all agree.
 * @param {string} locale
 */
export function applyDocumentLocale(locale) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = locale;
  root.dir = getDirection(locale);
}

const initialLocale =
  typeof window === 'undefined' ? DEFAULT_LOCALE : getLocaleFromPath(window.location.pathname);

i18n.use(initReactI18next).init({
  lng: initialLocale,
  resources: { ar: { translation: ar }, en: { translation: en } },
  supportedLngs: SUPPORTED_LOCALES,
  fallbackLng: DEFAULT_LOCALE,
  load: 'languageOnly',
  nonExplicitSupportedLngs: false,
  interpolation: { escapeValue: false }, // React already escapes output.
  returnNull: false,
  react: { useSuspense: false },
});

applyDocumentLocale(i18n.resolvedLanguage ?? DEFAULT_LOCALE);
i18n.on('languageChanged', applyDocumentLocale);

export default i18n;
