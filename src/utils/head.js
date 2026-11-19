/**
 * Document <head> management, shared by the browser and the prerenderer.
 *
 * Why not react-helmet-async: on React 19 it delegates to native tag hoisting,
 * which cannot hand the collected tags to a static prerenderer. This module
 * keeps one framework-free description of the head (`HeadData`) that is
 *   - serialised to HTML by `scripts/prerender.js` (what crawlers read), and
 *   - applied to the live DOM by `<Seo>` after hydration / navigation.
 *
 * Every managed element carries `data-seo`, so updates replace exactly the
 * tags this module owns and nothing else in <head>.
 */

/**
 * @typedef {Object} HeadTag
 * @property {'meta' | 'link' | 'script'} tag
 * @property {Record<string, string>} attrs
 * @property {string} [content] Text content (JSON-LD scripts only).
 */

/**
 * @typedef {Object} HeadData
 * @property {string} title
 * @property {HeadTag[]} tags
 */

export const MANAGED_ATTR = 'data-seo';

/**
 * Escapes a value for safe use inside a double-quoted HTML attribute or text.
 * @param {string} value
 */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Serialises JSON for inline <script> blocks. Escaping `<` prevents a value
 * containing "</script>" from terminating the block early.
 * @param {unknown} value
 */
export function serializeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * @param {HeadTag} tag
 * @returns {string}
 */
function tagToHtml({ tag, attrs, content }) {
  const attributes = Object.entries({ ...attrs, [MANAGED_ATTR]: '' })
    .map(([key, value]) => (value === '' ? key : `${key}="${escapeHtml(value)}"`))
    .join(' ');
  return tag === 'script'
    ? `<script ${attributes}>${content ?? ''}</script>`
    : `<${tag} ${attributes}>`;
}

/**
 * Renders head data to an HTML string (prerendering).
 * @param {HeadData} head
 * @returns {string}
 */
export function headToHtml(head) {
  return [`<title>${escapeHtml(head.title)}</title>`, ...head.tags.map(tagToHtml)].join('\n    ');
}

/**
 * Applies head data to the live document, replacing previously managed tags.
 * Idempotent: running it twice with the same data yields the same <head>.
 * @param {HeadData} head
 */
export function applyHead(head) {
  if (typeof document === 'undefined') return;
  document.title = head.title;
  document.head.querySelectorAll(`[${MANAGED_ATTR}]`).forEach((node) => node.remove());

  const fragment = document.createDocumentFragment();
  for (const { tag, attrs, content } of head.tags) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    element.setAttribute(MANAGED_ATTR, '');
    if (content) element.textContent = content;
    fragment.append(element);
  }
  document.head.append(fragment);
}
