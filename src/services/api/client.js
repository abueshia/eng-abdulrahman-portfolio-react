import axios from 'axios';

import { env } from '@/config/env';
import { DEFAULT_LOCALE } from '@/config/routes';
import { toApiError } from './errors';

/**
 * Loads the mock adapter on first use (separate chunk).
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
const lazyMockAdapter = async (config) => {
  const { mockAdapter } = await import('./mock/adapter');
  return mockAdapter(config);
};

/**
 * @template T
 * @typedef {Object} ApiResult
 * @property {T} data
 * @property {string} message
 * @property {number} code
 * @property {Pagination | undefined} pagination
 */

/**
 * @typedef {Object} Pagination
 * @property {number} current_page
 * @property {number} per_page
 * @property {number} total
 * @property {number} last_page
 */

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

/**
 * @typedef {Object} RequestOptions
 * @property {AbortSignal} [signal]  Cancels the request (TanStack Query passes one).
 * @property {string} [lang]         Forces the response language.
 */

/**
 * Builds an axios request config from service options and query params.
 * @param {RequestOptions} [options]
 * @param {Record<string, unknown>} [params]
 * @returns {import('axios').AxiosRequestConfig}
 */
export function requestConfig({ signal, lang } = {}, params = {}) {
  return { signal, params: { ...params, ...(lang ? { lang } : {}) } };
}

/**
 * Executes a request and unwraps the Laravel envelope
 * `{ code, success, message, data, pagination? }`.
 *
 * @template T
 * @param {Promise<import('axios').AxiosResponse>} promise
 * @returns {Promise<ApiResult<T>>}
 * @throws {import('./errors').ApiError}
 */
export async function unwrap(promise) {
  let response;
  try {
    response = await promise;
  } catch (error) {
    throw toApiError(error);
  }
  const body = response.data;
  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw toApiError({ message: 'Malformed API response', response });
  }
  if (body.success === false) {
    throw toApiError({ response: { status: body.code ?? response.status, data: body } });
  }
  return {
    data: body.data,
    message: body.message ?? '',
    code: body.code ?? response.status,
    pagination: body.pagination,
  };
}
