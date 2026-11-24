import axios from 'axios';

import { api, isLiveResource } from '@/config/api';
import { DEFAULT_LOCALE } from '@/config/routes';

/**
 * The axios-backed transport. Kept out of `client.js` so the envelope helpers
 * (`unwrap`, `requestConfig`) stay dependency-free: `http.js` imports this
 * module lazily, on the first real request. A prerendered page hydrates from
 * embedded data and never fetches, so axios is not part of the initial bundle.
 */

/**
 * Loads the mock adapter on first use (separate chunk).
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
const lazyMockAdapter = async (config) => {
  const { mockAdapter } = await import('./mock/adapter');
  return mockAdapter(config);
};

/**
 * First path segment of a request URL: "/projects/x?y" → "projects".
 * @param {string | undefined} url
 */
export const resourceOf = (url) =>
  String(url ?? '')
    .replace(/^[a-z]+:\/\/[^/]+/i, '')
    .replace(/^\/?(api\/v\d+\/)?/, '')
    .split(/[/?#]/)[0];

/**
 * Creates a configured axios instance.
 *
 * Why a factory: tests can build isolated clients (custom language, adapter)
 * without touching the app-wide singleton.
 *
 * @param {Object} [options]
 * @param {string} [options.baseURL]
 * @param {(resource: string) => boolean} [options.isLive] Whether a resource goes to the live API.
 * @param {() => string} [options.getLanguage] Resolves the language sent with each request.
 * @returns {import('axios').AxiosInstance}
 */
export function createApiClient({
  baseURL = api.url,
  isLive = isLiveResource,
  getLanguage = () => DEFAULT_LOCALE,
} = {}) {
  const liveAdapter = axios.getAdapter(axios.defaults.adapter);
  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    // No custom headers beyond what the API's CORS policy allows
    // (Content-Type, Accept, Accept-Language, X-Requested-With, If-None-Match).
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    // The mock/live switch happens per resource at the transport layer
    // (VITE_API_RESOURCES): services, envelope parsing and error handling are
    // identical in both modes. The mock adapter is a lazy chunk.
    adapter: (config) =>
      isLive(resourceOf(config.url)) ? liveAdapter(config) : lazyMockAdapter(config),
  });

  instance.interceptors.request.use((config) => {
    // An explicit `lang` param (passed by query hooks) wins over the global
    // i18n language; this keeps cache keys and payload language in lockstep.
    const lang = config.params?.lang ?? getLanguage();
    config.headers.set('Accept-Language', lang);
    config.params = { ...config.params, lang };
    return config;
  });

  return instance;
}
