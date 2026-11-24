/**
 * The `Retry-After` header of a throttled (429) response, in seconds: 60 for
 * reads and contact, 3600 for reviews (API_CONTRACT.md §1). Kept apart from
 * `errors.js` because only the lazy forms need it.
 * @param {unknown} error An `ApiError` (its `cause` is the axios error).
 * @returns {number | null}
 */
export function retryAfterSeconds(error) {
  const headers = /** @type {any} */ (error)?.cause?.response?.headers;
  const value = Number.parseInt(
    String(headers?.get?.('retry-after') ?? headers?.['retry-after']),
    10,
  );
  return Number.isFinite(value) ? value : null;
}
