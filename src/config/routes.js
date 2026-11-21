/**
 * Locale & route configuration.
 *
 * URL strategy: Arabic (default) lives at the root (`/projects/x`), English is
 * prefixed (`/en/projects/x`). Distinct URLs per language are what make
 * `hreflang` alternates meaningful to search engines.
 */

/** @typedef {'ar' | 'en'} Locale */

export const DEFAULT_LOCALE = /** @type {Locale} */ ('ar');
export const SUPPORTED_LOCALES = /** @type {Locale[]} */ (['ar', 'en']);
export const RTL_LOCALES = new Set(['ar']);
/**
 * Explicit language choice. Renamed from `portfolio.locale`, which also
 * stored merely viewed languages: old values are ignored, so every visitor
 * starts in Arabic again until they actually pick a language.
 */
export const LOCALE_STORAGE_KEY = 'portfolio.lang';

/** Section anchors on the home page, in render order. */
export const SECTION_IDS = Object.freeze({
  hero: 'hero',
  stats: 'stats',
  about: 'about',
  skills: 'skills',
  experience: 'experience',
  projects: 'projects',
  services: 'services',
  credentials: 'credentials',
  testimonials: 'testimonials',
  faq: 'faq',
  contact: 'contact',
});

/**
 * @param {string} locale
 * @returns {'rtl' | 'ltr'}
 */
export const getDirection = (locale) => (RTL_LOCALES.has(locale) ? 'rtl' : 'ltr');

/**
 * @param {string | undefined | null} value
 * @returns {value is Locale}
 */
export const isSupportedLocale = (value) =>
  SUPPORTED_LOCALES.includes(/** @type {Locale} */ (value));

/**
 * Extracts the locale encoded in a pathname.
 * @param {string} pathname
 * @returns {Locale}
 */
export function getLocaleFromPath(pathname) {
  const first = pathname.split('/')[1];
  return isSupportedLocale(first) && first !== DEFAULT_LOCALE ? first : DEFAULT_LOCALE;
}

/**
 * Removes any locale prefix from a pathname.
 * @param {string} pathname
 * @returns {string} Path that always starts with "/".
 */
export function stripLocale(pathname) {
  const segments = pathname.split('/');
  if (isSupportedLocale(segments[1]) && segments[1] !== DEFAULT_LOCALE) segments.splice(1, 1);
  const path = segments.join('/') || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Builds a locale-aware path.
 * @param {Locale} locale
 * @param {string} [path='/'] Locale-agnostic path, e.g. "/projects/foo" or "/#contact".
 * @returns {string}
 */
export function localizePath(locale, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`.replace(/\/(?=[#?])/, '/');
}

/** Locale-agnostic route builders. Use with `localizePath`. */
export const paths = Object.freeze({
  home: () => '/',
  section: (/** @type {string} */ id) => `/#${id}`,
  projects: () => '/#projects',
  project: (/** @type {string} */ slug) => `/projects/${slug}`,
});
