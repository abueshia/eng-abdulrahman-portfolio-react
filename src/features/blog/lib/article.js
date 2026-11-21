/**
 * Article pipeline: API HTML → safe, enhanced HTML + table of contents.
 *
 *  1. Sanitise with DOMPurify (allow-list of editorial tags and attributes;
 *     scripts, event handlers, styles and unknown attributes are dropped).
 *  2. Give every h2/h3 a stable, Unicode-aware id and collect the TOC.
 *  3. Replace `<pre><code class="language-x" data-filename="…">` blocks with
 *     Shiki-highlighted code inside a figure (file tab + copy button).
 *  4. External links open in a new tab with `rel="noopener noreferrer"`.
 *
 * Runs wherever the article query runs: at build time in Node (prerender,
 * with a jsdom window) and in the browser only for client-side navigations.
 * Prerendered pages therefore ship finished HTML, and the client hydrates
 * against identical data without loading DOMPurify or Shiki.
 */
import createDOMPurify from 'dompurify';

import { LANGUAGES, THEMES, getHighlighter } from './highlighter';

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'h2',
  'h3',
  'h4',
  'strong',
  'b',
  'em',
  'i',
  's',
  'u',
  'mark',
  'small',
  'sub',
  'sup',
  'a',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'kbd',
  'figure',
  'figcaption',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];
const ALLOWED_ATTR = ['href', 'title', 'class', 'src', 'alt', 'width', 'height', 'data-filename'];

/** Module id kept in a variable so client bundles never try to include jsdom. */
const JSDOM_MODULE = 'jsdom';

/**
 * The DOM to work in: the page's own in the browser, a jsdom window in Node.
 * @returns {Promise<Window & typeof globalThis>}
 */
async function getWindow() {
  if (typeof window !== 'undefined') return window;
  const { JSDOM } = await import(/* @vite-ignore */ JSDOM_MODULE);
  return /** @type {any} */ (new JSDOM('<!doctype html><html><body></body></html>').window);
}

/**
 * Heading id from its text: lowercase, Unicode letters/digits kept (Arabic
 * headings get Arabic ids), everything else collapsed to "-".
 * @param {string} text
 */
export function slugify(text) {
  return (
    text
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

/**
 * @typedef {{ id: string, text: string, level: 2 | 3 }} TocEntry
 * @typedef {{ html: string, toc: TocEntry[] }} ProcessedArticle
 */

/**
 * @param {string} html  Raw article HTML from the API.
 * @param {{ copyLabel: string, copiedLabel: string }} labels Localised copy-button text.
 * @returns {Promise<ProcessedArticle>}
 */
export async function processArticle(html, labels) {
  const win = await getWindow();
  const purify = createDOMPurify(win);
  const fragment = purify.sanitize(html ?? '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    RETURN_DOM_FRAGMENT: true,
  });
  const doc = win.document;
  const root = doc.createElement('div');
  root.append(fragment);

  // Headings → ids + TOC.
  /** @type {TocEntry[]} */
  const toc = [];
  const used = new Set();
  root.querySelectorAll('h2, h3').forEach((heading) => {
    const text = heading.textContent?.trim() ?? '';
    let id = slugify(text);
    for (let n = 2; used.has(id); n += 1) id = `${slugify(text)}-${n}`;
    used.add(id);
    heading.id = id;
    toc.push({ id, text, level: heading.tagName === 'H2' ? 2 : 3 });
  });

  // External links.
  root.querySelectorAll('a[href]').forEach((link) => {
    if (/^https?:\/\//i.test(link.getAttribute('href') ?? '')) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Code blocks → Shiki.
  const blocks = [...root.querySelectorAll('pre > code')];
  if (blocks.length > 0) {
    const highlighter = await getHighlighter();
    for (const code of blocks) {
      const pre = /** @type {HTMLElement} */ (code.parentElement);
      const requested = (code.getAttribute('class') ?? '').match(/language-([\w-]+)/)?.[1] ?? '';
      const lang = LANGUAGES[/** @type {keyof typeof LANGUAGES} */ (requested.toLowerCase())];
      const source = (code.textContent ?? '').replace(/\n$/, '');
      const filename = code.getAttribute('data-filename');

      const figure = doc.createElement('figure');
      figure.className = 'code-block';
      figure.setAttribute('data-lang', lang ?? 'text');
      const bar = doc.createElement('figcaption');
      bar.className = 'code-block__bar';
      const file = doc.createElement('span');
      file.className = 'code-block__file';
      file.textContent = filename || lang || 'text';
      const copy = doc.createElement('button');
      copy.type = 'button';
      copy.className = 'code-block__copy';
      copy.setAttribute('data-copy', '');
      copy.setAttribute('data-copied-label', labels.copiedLabel);
      copy.textContent = labels.copyLabel;
      bar.append(file, copy);
      figure.append(bar);

      if (lang) {
        const holder = doc.createElement('div');
        // Shiki escapes the source itself; its output is trusted markup.
        holder.innerHTML = highlighter.codeToHtml(source, {
          lang,
          themes: THEMES,
          defaultColor: false,
        });
        figure.append(...holder.childNodes);
      } else {
        const plain = doc.createElement('pre');
        plain.className = 'shiki';
        const inner = doc.createElement('code');
        inner.textContent = source;
        plain.append(inner);
        figure.append(plain);
      }
      pre.replaceWith(figure);
    }
  }

  return { html: root.innerHTML, toc };
}
