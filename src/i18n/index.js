/**
 * i18next bootstrap.
 *
 * - Each base locale bundle is its own chunk, loaded with `loadLocale()`:
 *   the browser awaits only the page's language before hydrating (the
 *   prerendered HTML carries a modulepreload for it, so there is no extra
 *   round-trip), and the other language is preloaded on idle so switching
 *   stays instant. The prerenderer and the test suite load both up front.
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

/** @type {Record<string, () => Promise<{ default: Record<string, unknown> }>>} */
const LOADERS = {
  ar: () => import('./locales/ar.json'),
  en: () => import('./locales/en.json'),
};

/** @type {Map<string, Promise<void>>} */
const loading = new Map();

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
  resources: {},
  partialBundledLanguages: true,
  supportedLngs: SUPPORTED_LOCALES,
  fallbackLng: DEFAULT_LOCALE,
  load: 'languageOnly',
  nonExplicitSupportedLngs: false,
  interpolation: { escapeValue: false }, // React already escapes output.
  returnNull: false,
  react: { useSuspense: false },
});

// The initial language is known from the URL even before its strings load.
applyDocumentLocale(initialLocale);
i18n.on('languageChanged', applyDocumentLocale);

/** @type {Set<string>} */
const loaded = new Set();

/**
 * Whether a language's base strings are registered (synchronous check).
 * @param {string} locale
 */
export const isLocaleLoaded = (locale) => loaded.has(locale);

/**
 * Registers a language's base strings (once). Deep-merged without
 * overwriting, so it composes with the lazily registered feature bundles
 * (`sections.js`, `work.js`).
 * @param {string} locale
 * @returns {Promise<void>}
 */
export function loadLocale(locale) {
  const load = LOADERS[locale];
  if (!load) return Promise.resolve();
  if (!loading.has(locale)) {
    loading.set(
      locale,
      load().then((module) => {
        i18n.addResourceBundle(locale, 'translation', module.default, true, false);
        loaded.add(locale);
      }),
    );
  }
  return /** @type {Promise<void>} */ (loading.get(locale));
}

/**
 * Loads a language if needed, then activates it. Synchronous (like a plain
 * `changeLanguage`) when the strings are already registered.
 * @param {string} locale
 * @returns {Promise<unknown>}
 */
export function changeLocale(locale) {
  const activate = () => (i18n.language === locale ? undefined : i18n.changeLanguage(locale));
  if (isLocaleLoaded(locale)) return Promise.resolve(activate());
  return loadLocale(locale).then(activate);
}

export default i18n;
