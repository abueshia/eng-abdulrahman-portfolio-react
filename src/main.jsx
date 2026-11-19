import { hydrate } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import '@/styles/fonts';
import '@/styles/index.css';

import App from '@/app/App';
import { PRERENDER_GLOBAL, normalizePath } from '@/app/prerender-state';
import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getLocaleFromPath,
  isSupportedLocale,
  localizePath,
} from '@/config/routes';
import i18n from '@/i18n';
import { readStorage } from '@/utils/storage';

/**
 * Honour a returning visitor's saved language before the router boots:
 * an un-prefixed (Arabic) URL is rewritten to its saved-locale equivalent.
 * Done with `replaceState` so there is no extra history entry or flash.
 * After this, the URL is the single source of truth for the locale.
 * @returns {boolean} Whether the URL was rewritten.
 */
function applySavedLocale() {
  const { pathname, search, hash } = window.location;
  const saved = readStorage(LOCALE_STORAGE_KEY);
  const isDefaultUrl = getLocaleFromPath(pathname) === DEFAULT_LOCALE;
  const rewrite = isDefaultUrl && isSupportedLocale(saved) && saved !== DEFAULT_LOCALE;

  if (rewrite) {
    window.history.replaceState(null, '', `${localizePath(saved, pathname)}${search}${hash}`);
  }
  i18n.changeLanguage(getLocaleFromPath(window.location.pathname));
  return rewrite;
}

const rewritten = applySavedLocale();
const container = /** @type {HTMLElement} */ (document.getElementById('root'));
const queryClient = createQueryClient();
const router = createAppRouter();

/** @type {import('@/app/prerender-state').PrerenderState | undefined} */
const prerendered = window[PRERENDER_GLOBAL];
const canHydrate =
  !rewritten &&
  prerendered !== undefined &&
  container.hasChildNodes() &&
  normalizePath(prerendered.path) === normalizePath(window.location.pathname);

const app = (
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>
);

if (canHydrate) {
  // Seed the cache with the data the HTML was rendered from, so the first
  // client render matches the markup exactly.
  hydrate(queryClient, prerendered.queryState);
  hydrateRoot(container, app);
} else {
  // HTML (if any) belongs to another URL: discard it and render fresh.
  container.replaceChildren();
  createRoot(container).render(app);
}
