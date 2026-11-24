/**
 * Normalisers shared by the resource mappers. The API returns raw admin
 * text (`\r\n` line breaks, bullet markers, the odd editor artefact), so
 * every string goes through here before a component sees it.
 */

/** Citation artefacts pasted from an AI editor, e.g. "[cite: 54, 56]". */
const CITATION = /\s*\[cite:[^\]]*\]/gi;

/** Leading list markers: "-", "*", "•", "·", "–", "—", "▪", "►", "✓", "✔", "1.", "2)". */
const BULLET = /^\s*(?:[-*•·–—▪►✓✔]+|\d{1,2}[.)])\s+/u;

/**
 * A trimmed single string; `null`/`undefined` become "".
 * @param {unknown} value
 * @returns {string}
 */
export function text(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r\n?/g, '\n').replace(CITATION, '').trim();
}

/**
 * A trimmed string, or `null` when empty (for optional facts).
 * @param {unknown} value
 * @returns {string | null}
 */
export const optional = (value) => text(value) || null;

/**
 * List items from either an array or a newline-separated string: trimmed,
 * bullet markers removed, empty lines dropped.
 * @param {unknown} value
 * @returns {string[]}
 */
export function lines(value) {
  const raw = Array.isArray(value)
    ? value.flatMap((item) => text(item).split('\n'))
    : text(value).split('\n');
  return raw.map((line) => line.replace(BULLET, '').trim()).filter(Boolean);
}

/**
 * Paragraphs of a long text (one per non-empty line).
 * @param {unknown} value
 * @returns {string[]}
 */
export const paragraphs = (value) =>
  text(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * An absolute http(s) URL, or `null`.
 * @param {unknown} value
 * @returns {string | null}
 */
export function url(value) {
  const candidate = text(value);
  return /^https?:\/\/[^\s"'<>]+$/i.test(candidate) ? candidate : null;
}

/**
 * A `YYYY-MM-DD` date, or `null`.
 * @param {unknown} value
 * @returns {string | null}
 */
export function isoDate(value) {
  const candidate = text(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
}

/**
 * @typedef {Object} Technology
 * @property {number | string} id
 * @property {string} slug
 * @property {string} name
 * @property {string | null} category
 */

/**
 * @param {any} tech API Technology object.
 * @returns {Technology | null}
 */
export function mapTechnology(tech) {
  const name = text(tech?.name);
  if (!name) return null;
  const slug = text(tech.slug) || name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-');
  return { id: tech.id ?? slug, slug, name, category: optional(tech.category) };
}

/**
 * @param {unknown} list
 * @returns {Technology[]}
 */
export const mapTechnologies = (list) =>
  (Array.isArray(list) ? list : []).map(mapTechnology).filter((tech) => tech !== null);

/**
 * @typedef {Object} Pagination
 * @property {number} current_page
 * @property {number} per_page
 * @property {number} total
 * @property {number} last_page
 */

/**
 * The API's pagination block (`total_pages`, `total_items`) in the app's shape.
 * @param {any} pagination
 * @returns {Pagination | undefined}
 */
export function mapPagination(pagination) {
  if (!pagination || typeof pagination !== 'object') return undefined;
  const number = (/** @type {unknown} */ value, fallback = 1) =>
    Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
  return {
    current_page: number(pagination.current_page),
    per_page: number(pagination.per_page),
    total: number(pagination.total_items ?? pagination.total, 0),
    last_page: number(pagination.total_pages ?? pagination.last_page),
  };
}

/**
 * Maps the `data` of an unwrapped API result, keeping the envelope fields.
 * @template In, Out
 * @param {import('../client').ApiResult<In>} result
 * @param {(data: In) => Out} map
 * @returns {import('../client').ApiResult<Out>}
 */
export const mapResult = (result, map) => ({
  ...result,
  data: map(result.data),
  pagination: mapPagination(result.pagination),
});

/**
 * Maps an array payload, dropping records the mapper rejects (`null`).
 * @template In, Out
 * @param {(item: In) => Out | null} map
 * @returns {(data: unknown) => Out[]}
 */
export const mapList = (map) => (data) =>
  (Array.isArray(data) ? data : []).map(map).filter((item) => item !== null);

/** Pages followed at most: a guard against a runaway pagination block. */
const MAX_PAGES = 20;

/**
 * Follows a paginated list to its last page and returns one result with
 * every item (lives in this lazy chunk: it only runs when requests do).
 * @template T
 * @param {(page: number) => Promise<import('../client').ApiResult<T[]>>} fetchPage
 * @returns {Promise<import('../client').ApiResult<T[]>>}
 */
export async function collectPages(fetchPage) {
  const first = await fetchPage(1);
  const data = [...first.data];
  const lastPage = Math.min(first.pagination?.last_page ?? 1, MAX_PAGES);
  for (let page = 2; page <= lastPage; page += 1) data.push(...(await fetchPage(page)).data);
  return {
    ...first,
    data,
    pagination: { current_page: 1, per_page: data.length, total: data.length, last_page: 1 },
  };
}
