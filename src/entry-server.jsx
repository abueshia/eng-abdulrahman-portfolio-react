/**
 * Server entry used by the build-time prerenderer (`scripts/prerender.js`).
 * Never shipped to the browser.
 *
 * Rendering strategy (static site generation):
 *  1. Render the route with `react-dom/static` (waits for lazy page chunks).
 *  2. Any query the tree declared is now in the cache but unfetched (queries
 *     never fetch on the server), so fetch them through the normal services
 *     (mock adapter or live Laravel API, decided by env exactly like the client).
 *  3. Re-render until no new queries appear, then dehydrate the cache so the
 *     client hydrates against identical data.
 * Pages therefore need no SSR-specific code: whatever they query is prerendered.
 */
import { dehydrate } from '@tanstack/react-query';
import { prerender } from 'react-dom/static';
import { StaticRouterProvider, createStaticHandler, createStaticRouter } from 'react-router-dom';

import { AppProviders } from '@/app/providers/AppProviders';
import { createQueryClient } from '@/app/query-client';
import { routes } from '@/app/router';
import { env } from '@/config/env';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, getLocaleFromPath, paths } from '@/config/routes';
import { changeLocale, loadLocale } from '@/i18n';
import { faqsService, projectsService, servicesService, settingsService } from '@/services/api';
import { buildLlmsTxt } from '@/utils/llms';

// Re-exported for scripts/prerender.js (it only imports this bundle).
export { env };
export { api } from '@/config/api';
export { PRERENDER_GLOBAL } from '@/app/prerender-state';
export { DEFAULT_LOCALE, getDirection, localizePath } from '@/config/routes';
export { headToHtml, serializeJson } from '@/utils/head';

/** Upper bound on render → fetch rounds (guards against query waterfalls). */
const MAX_PASSES = 4;
const ORIGIN = 'http://prerender.local';

/**
 * @param {import('react').ReactNode} element
 * @returns {Promise<string>}
 */
async function renderToHtml(element) {
  // Disable progressive chunking: by default Fizz outlines any Suspense
  // boundary larger than ~12.8KB into a hidden <template> that an inline
  // script swaps in later. Crawlers that skip JS would then index the
  // loading fallback instead of the page.
  const { prelude } = await prerender(element, { progressiveChunkSize: Number.POSITIVE_INFINITY });
  return new Response(prelude).text();
}

/**
 * @typedef {Object} RenderResult
 * @property {string} html            Markup for `#root`.
 * @property {import('@/utils/head').HeadData | null} head
 * @property {'ar' | 'en'} locale
 * @property {unknown} queryState      Dehydrated query cache.
 * @property {number} status          HTTP-like status (404 when the page is "not found").
 */

/**
 * Renders one URL to static HTML.
 * @param {string} url Pathname, e.g. "/en/projects/acme".
 * @returns {Promise<RenderResult>}
 */
export async function renderPage(url) {
  const locale = getLocaleFromPath(new URL(url, ORIGIN).pathname);
  await Promise.all(SUPPORTED_LOCALES.map(loadLocale));
  await changeLocale(locale);

  const queryClient = createQueryClient();
  const defaults = queryClient.getDefaultOptions();
  // A failed fetch is final on the server: without this, an errored query
  // looks "pending" again on the next pass and the page renders its loading
  // state instead of the error UI (404 for an unknown slug; any other failure
  // aborts the build, see `assertQueriesSucceeded`).
  queryClient.setDefaultOptions({
    ...defaults,
    queries: { ...defaults.queries, retryOnMount: false },
  });
  const handler = createStaticHandler(routes);
  const context = await handler.query(new Request(new URL(url, ORIGIN)));
  if (context instanceof Response) throw new Error(`Unexpected redirect while rendering ${url}`);
  const router = createStaticRouter(handler.dataRoutes, context);

  /** @type {import('@/utils/head').HeadData | null} */
  let head = null;
  const headCollector = { collect: (/** @type {typeof head} */ data) => (head = data) };

  let html = '';
  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    head = null;
    html = await renderToHtml(
      <AppProviders queryClient={queryClient} headCollector={headCollector}>
        <StaticRouterProvider router={router} context={context} hydrate={false} />
      </AppProviders>,
    );

    const pending = queryClient
      .getQueryCache()
      .getAll()
      .filter((query) => query.state.status === 'pending' && query.options.enabled !== false);
    if (pending.length === 0) break;
    // Failed queries stay in "error" state and render their error UI.
    await Promise.allSettled(pending.map((query) => query.fetch()));
  }

  assertQueriesSucceeded(queryClient, url);
  const queryState = dehydrate(queryClient);
  // Drop the cache: its garbage-collection timers would keep Node alive.
  queryClient.clear();

  // <Seo status> is the signal (noindex alone is not: sample case studies are
  // noindex but real 200 pages).
  return { html, head, locale, queryState, status: head?.status ?? 200 };
}

/**
 * A prerendered page must never ship without its data: an empty section or an
 * error state baked into static HTML would be indexed as the real page. Any
 * failed query aborts the build with the request that failed. A 404 is the
 * one expected failure (an unknown slug renders the 404 page).
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} url Page being rendered.
 */
function assertQueriesSucceeded(queryClient, url) {
  const failed = queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.status === 'error' && query.state.error?.status !== 404);
  if (failed.length === 0) return;
  const details = failed
    .map((query) => {
      const error = /** @type {any} */ (query.state.error);
      return `  - query ${JSON.stringify(query.queryKey)}: ${describeApiError(error)}`;
    })
    .join('\n');
  queryClient.clear();
  throw new Error(`Prerender of ${url} failed: the API did not answer.\n${details}`);
}

/**
 * One line for a failed request: status, message and the endpoint.
 * @param {any} error ApiError (or anything thrown).
 */
export function describeApiError(error) {
  const config = error?.cause?.config;
  const endpoint = config ? `${config.baseURL ?? ''}${config.url ?? ''}` : 'unknown endpoint';
  const status = error?.status ? `HTTP ${error.status}` : 'network error';
  return `${status} on ${endpoint} (${error?.message ?? 'no message'})`;
}

/**
 * Every published project, through the same service the pages use.
 * @param {'ar' | 'en'} lang
 */
async function fetchProjects(lang) {
  try {
    return (await projectsService.all({ lang })).data;
  } catch (error) {
    throw new Error(`Cannot list projects for the sitemap: ${describeApiError(error)}`, {
      cause: error,
    });
  }
}

/**
 * @typedef {Object} PrerenderRoute
 * @property {string} path      Locale-agnostic path ("/projects/my-project").
 * @property {string} [lastmod] ISO date for the sitemap.
 * @property {boolean} [sitemap] False for pages that are generated but not
 *   listed (none today: every project from the API is indexable).
 */

/**
 * Lists every indexable, locale-agnostic route. Each one is rendered once
 * per supported locale.
 * @returns {Promise<{ routes: PrerenderRoute[], locales: readonly string[] }>}
 */
export async function getPrerenderRoutes() {
  const projects = await fetchProjects(DEFAULT_LOCALE);
  if (projects.length === 0) {
    throw new Error('The API returned no published project: refusing to build an empty portfolio.');
  }

  return {
    locales: SUPPORTED_LOCALES,
    routes: [
      { path: paths.home() },
      ...projects.map((project) => ({
        path: paths.project(project.slug),
        // The API has no updated_at/published_at: completion is the one real date.
        ...(project.completed_at ? { lastmod: project.completed_at } : {}),
        sitemap: true,
      })),
    ],
  };
}

/**
 * `/llms.txt` content, built from the same API data as the pages (GEO).
 * @returns {Promise<string>}
 */
export async function renderLlmsTxt() {
  /** @param {'ar' | 'en'} lang */
  const load = async (lang) => {
    const options = { lang };
    const [settings, services, faqs, projects] = await Promise.all([
      settingsService.get(options),
      servicesService.list(options),
      faqsService.list(options),
      projectsService.all(options),
    ]).catch((error) => {
      throw new Error(`Cannot build llms.txt (${lang}): ${describeApiError(error)}`, {
        cause: error,
      });
    });
    return {
      settings: settings.data,
      services: services.data,
      faqs: faqs.data,
      projects: projects.data,
    };
  };
  const [ar, en] = await Promise.all([load('ar'), load('en')]);
  return buildLlmsTxt({ siteUrl: env.siteUrl, ar, en });
}
