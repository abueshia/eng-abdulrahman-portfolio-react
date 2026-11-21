/**
 * Contract between the prerenderer (`scripts/prerender.js`) and the client
 * entry (`src/main.jsx`).
 *
 * Every prerendered page embeds `window[PRERENDER_GLOBAL] = { path, queryState }`.
 * The client hydrates only when `path` matches the URL it is actually showing;
 * otherwise (SPA fallback, saved-locale rewrite, 404 page) it renders fresh.
 */

export const PRERENDER_GLOBAL = '__PRERENDER__';

/**
 * @typedef {Object} PrerenderState
 * @property {string} path        Pathname the HTML was rendered for.
 * @property {unknown} queryState Dehydrated TanStack Query cache.
 */

/**
 * Normalises a pathname for comparison: no trailing slash (except root).
 * @param {string} pathname
 */
export const normalizePath = (pathname) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

/**
 * Stamps every successful query in the cache as fetched now.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export function markFresh(queryClient) {
  const now = Date.now();
  for (const query of queryClient.getQueryCache().getAll()) {
    if (query.state.status === 'success') query.setState({ dataUpdatedAt: now });
  }
}
