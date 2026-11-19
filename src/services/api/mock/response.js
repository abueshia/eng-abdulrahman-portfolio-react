/**
 * Response builders and transformers that reproduce the Laravel API contract.
 */

/**
 * True for `{ ar, en }` bilingual leaf objects.
 * @param {unknown} value
 */
function isTranslatable(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 2 && 'ar' in value && 'en' in value;
}

/**
 * Deeply flattens bilingual fields to the requested language, mimicking
 * Laravel API Resources that return translated columns for `?lang=`.
 * @template T
 * @param {T} input
 * @param {'ar' | 'en'} lang
 * @returns {any}
 */
export function localize(input, lang) {
  if (isTranslatable(input)) return /** @type {any} */ (input)[lang];
  if (Array.isArray(input)) return input.map((item) => localize(item, lang));
  if (input && typeof input === 'object') {
    return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, localize(v, lang)]));
  }
  return input;
}

/**
 * @param {unknown} data
 * @param {{ code?: number, message?: string, pagination?: object }} [meta]
 */
export const ok = (data, { code = 200, message = 'OK', pagination } = {}) => ({
  status: code,
  body: { code, success: true, message, data, ...(pagination ? { pagination } : {}) },
});

/**
 * @param {number} code
 * @param {string} message
 * @param {Record<string, string[]>} [errors]
 */
export const fail = (code, message, errors) => ({
  status: code,
  body: { code, success: false, message, data: null, ...(errors ? { errors } : {}) },
});

/**
 * Laravel-style length-aware pagination.
 * @template T
 * @param {T[]} items
 * @param {{ page?: unknown, per_page?: unknown }} params
 * @param {number} defaultPerPage
 */
export function paginate(items, params, defaultPerPage) {
  const perPage = Math.min(Math.max(Number(params.per_page) || defaultPerPage, 1), 100);
  const total = items.length;
  const lastPage = Math.max(Math.ceil(total / perPage), 1);
  const page = Math.min(Math.max(Number(params.page) || 1, 1), lastPage);
  return {
    items: items.slice((page - 1) * perPage, page * perPage),
    pagination: { current_page: page, per_page: perPage, total, last_page: lastPage },
  };
}
