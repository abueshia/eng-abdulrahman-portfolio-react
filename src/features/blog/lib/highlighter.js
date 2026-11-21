/**
 * Shiki, fine-grained: the core, the JavaScript regex engine (no WASM), six
 * grammars and two themes. Loaded on demand only (prerender, or a client-side
 * navigation to an article whose HTML was not prerendered), never in the
 * initial bundle.
 *
 * Output uses CSS variables for both themes (`defaultColor: false`), so code
 * re-colours with `data-theme` without re-highlighting.
 */
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

/** Languages the blog supports, with the aliases editors commonly emit. */
export const LANGUAGES = Object.freeze({
  php: 'php',
  js: 'javascript',
  javascript: 'javascript',
  jsx: 'jsx',
  bash: 'bash',
  sh: 'bash',
  shell: 'bash',
  json: 'json',
  sql: 'sql',
});

export const THEMES = Object.freeze({ light: 'vitesse-light', dark: 'vitesse-dark' });

/** @type {Promise<import('shiki/core').HighlighterCore> | null} */
let instance = null;

/** One shared highlighter per runtime (build process or browser tab). */
export function getHighlighter() {
  instance ??= createHighlighterCore({
    themes: [import('@shikijs/themes/vitesse-light'), import('@shikijs/themes/vitesse-dark')],
    langs: [
      import('@shikijs/langs/php'),
      import('@shikijs/langs/javascript'),
      import('@shikijs/langs/jsx'),
      import('@shikijs/langs/bash'),
      import('@shikijs/langs/json'),
      import('@shikijs/langs/sql'),
    ],
    engine: createJavaScriptRegexEngine(),
  });
  return instance;
}
