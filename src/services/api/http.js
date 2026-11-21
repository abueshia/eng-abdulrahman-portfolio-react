import i18n from '@/i18n';
import { DEFAULT_LOCALE } from '@/config/routes';

/** @type {Promise<import('axios').AxiosInstance> | undefined} */
let instance;

/**
 * Creates the axios client on first use (separate chunk). Every request
 * carries the active UI language (`?lang=` + `Accept-Language`) so translated
 * fields come back localised.
 * @returns {Promise<import('axios').AxiosInstance>}
 */
function client() {
  instance ??= import('./axios-client').then(({ createApiClient }) =>
    createApiClient({ getLanguage: () => i18n.resolvedLanguage || DEFAULT_LOCALE }),
  );
  return instance;
}

/**
 * App-wide HTTP client: the subset of the axios API the services use.
 * Lazy because prerendered pages hydrate from embedded data, so most first
 * visits never send a request and should not download axios.
 */
export const http = {
  /**
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  get: (url, config) => client().then((c) => c.get(url, config)),
  /**
   * @param {string} url
   * @param {unknown} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  post: (url, data, config) => client().then((c) => c.post(url, data, config)),
};
