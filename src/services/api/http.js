import i18n from '@/i18n';
import { DEFAULT_LOCALE } from '@/config/routes';
import { createApiClient } from './client';

/**
 * App-wide HTTP client. Every request carries the active UI language
 * (`?lang=` + `Accept-Language`) so translated fields come back localised.
 */
export const http = createApiClient({
  getLanguage: () => i18n.resolvedLanguage || DEFAULT_LOCALE,
});
