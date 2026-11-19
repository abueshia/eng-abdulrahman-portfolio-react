import { createContext } from 'react';

/**
 * @typedef {Object} LocaleContextValue
 * @property {import('@/config/routes').Locale} locale  Active locale (derived from the URL).
 * @property {'rtl' | 'ltr'} dir
 * @property {boolean} isRTL
 * @property {(path?: string) => string} localize       Prefixes a locale-agnostic path.
 * @property {(target?: import('@/config/routes').Locale) => void} switchLocale
 */

/** @type {import('react').Context<LocaleContextValue | null>} */
export const LocaleContext = createContext(null);
