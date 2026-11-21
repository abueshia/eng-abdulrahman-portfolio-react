import { toApiError } from './errors';

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
