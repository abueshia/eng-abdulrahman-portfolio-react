/**
 * Normalised API error.
 *
 * Every failure (network, timeout, 4xx/5xx, malformed envelope) is converted
 * into an `ApiError` so UI code handles one shape only.
 */
export class ApiError extends Error {
  /**
   * @param {Object} params
   * @param {string} params.message                     Human readable message (from the API when available).
   * @param {number} [params.status=0]                  HTTP status, 0 for network errors.
   * @param {Record<string, string[]>} [params.errors]  Laravel validation errors (422).
   * @param {unknown} [params.cause]
   */
  constructor({ message, status = 0, errors = {}, cause }) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }

  /** Throttled (429): wait before retrying (see `retryAfterSeconds`). */
  get isRateLimited() {
    return this.status === 429;
  }

  /** @returns {boolean} */
  get isValidation() {
    return this.status === 422;
  }

  /** @returns {boolean} */
  get isNotFound() {
    return this.status === 404;
  }

  /** @returns {boolean} */
  get isNetwork() {
    return this.status === 0;
  }
}

/**
 * Converts an axios error (or anything thrown) into an `ApiError`.
 * @param {any} error
 * @returns {ApiError}
 */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  const response = error?.response;
  const body = response?.data;
  return new ApiError({
    message: body?.message || error?.message || 'Unexpected error',
    status: response?.status ?? 0,
    errors: body?.errors ?? body?.data?.errors ?? {},
    cause: error,
  });
}
