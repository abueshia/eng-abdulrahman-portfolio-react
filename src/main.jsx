import { hydrate } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import '@/styles/fonts';
import '@/styles/index.css';

import App from '@/app/App';
import { PRERENDER_GLOBAL, normalizePath } from '@/app/prerender-state';
import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import { env } from '@/config/env';
import { HYDRATED_MARK } from '@/features/hero/lib/telemetry';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  getLocaleFromPath,
  isSupportedLocale,
  localizePath,
} from '@/config/routes';
import { changeLocale } from '@/i18n';
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
  return rewrite;
}

/**
 * A tab opened before a redeploy still references the previous build's
 * chunks, which no longer exist (every deploy is immutable). Instead of a
 * half-broken page, reload once to get the current HTML and its assets.
 * Guarded so a genuinely missing file cannot cause a reload loop.
 */
window.addEventListener('vite:preloadError', (event) => {
  const key = 'portfolio.chunk-reload';
  try {
    const last = Number(window.sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 30_000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  window.location.reload();
});

const rewritten = applySavedLocale();

/** Hydrates the prerendered markup (or renders fresh) once strings are ready. */
function start() {
  // The boot intro was requested before paint (index.html). Start fetching its
  // chunk now, in parallel with hydration; drop the request if effects are off.
  if (document.documentElement.dataset.boot === 'play') {
    if (env.fx) import('@/features/intro/components/BootSequence');
    else delete document.documentElement.dataset.boot;
  }
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

  // Real number for the hero's access log ("hydrated in …ms").
  requestAnimationFrame(() => performance.mark(HYDRATED_MARK));
}

// The page's strings must be registered before the first render so that it
// matches the prerendered markup. The HTML modulepreloads that chunk, so this
// resolves without a round-trip. (A promise, not top-level await: TLA in the
// entry makes the bundler split the initial graph into many small chunks.)
changeLocale(getLocaleFromPath(window.location.pathname)).then(start);
