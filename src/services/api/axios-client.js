import axios from 'axios';

import { env } from '@/config/env';
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
 * Creates a configured axios instance.
 *
 * Why a factory: tests can build isolated clients (custom language, adapter)
 * without touching the app-wide singleton.
 *
 * @param {Object} [options]
 * @param {string} [options.baseURL]
 * @param {boolean} [options.useMock]
 * @param {() => string} [options.getLanguage] Resolves the language sent with each request.
 * @returns {import('axios').AxiosInstance}
 */
export function createApiClient({
  baseURL = env.apiUrl,
  useMock = env.useMock,
  getLanguage = () => DEFAULT_LOCALE,
} = {}) {
  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    // The mock/live switch happens at the transport layer: services, envelope
    // parsing and error handling are identical in both modes. The adapter is
    // imported lazily so mock data never ships in the main bundle.
    ...(useMock ? { adapter: lazyMockAdapter } : {}),
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
