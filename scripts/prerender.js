/**
 * Build-time static site generation (SSG).
 *
 * Runs after `vite build` (client → dist/) and `vite build --ssr` (server
 * entry → dist-ssr/). For every indexable route × locale it writes
 * `dist/<path>/index.html` with real markup, the final <head> (title,
 * description, canonical, hreflang, OG, JSON-LD) and the dehydrated data the
 * client hydrates from. It also emits `404.html`, `sitemap.xml` and `robots.txt`.
 *
 * Content comes from the same services as the app: the mock adapter when
 * VITE_USE_MOCK=true, the live Laravel API otherwise. New CMS content
 * therefore needs a rebuild (see SEO.md → "Publishing workflow").
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');

const {
  renderPage,
  getPrerenderRoutes,
  env,
  localizePath,
  getDirection,
  DEFAULT_LOCALE,
  headToHtml,
  serializeJson,
  PRERENDER_GLOBAL,
} = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

const template = await readFile(join(distDir, 'index.html'), 'utf-8');

/**
 * Injects rendered output into the client HTML shell.
 * @param {Awaited<ReturnType<typeof renderPage>>} result
 * @param {string} path Exact pathname this HTML will be served at.
 */
function buildDocument(result, path) {
  const state = { path, queryState: result.queryState };
  return template
    .replace(
      /<html[^>]*>/,
      `<html lang="${result.locale}" dir="${getDirection(result.locale)}" data-theme="dark">`,
    )
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta[^>]*data-seo[^>]*>/g, '')
    .replace('</head>', `  ${result.head ? headToHtml(result.head) : ''}\n  </head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${result.html}</div>\n    <script>window.${PRERENDER_GLOBAL}=${serializeJson(state)}</script>`,
    );
}

/**
 * @param {string} urlPath
 * @param {string} html
 */
async function writePage(urlPath, html) {
  const file = urlPath === '/' ? join(distDir, 'index.html') : join(distDir, urlPath, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html, 'utf-8');
}

/** @param {string} value */
const xml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const started = performance.now();
if (/localhost|127\.0\.0\.1/.test(env.siteUrl)) {
  console.warn(
    `\n⚠  VITE_SITE_URL is "${env.siteUrl}". Canonical, hreflang, OG and sitemap URLs will point there.` +
      '\n   Set VITE_SITE_URL to the production origin for deploy builds (see SEO.md).\n',
  );
}

const { routes, locales } = await getPrerenderRoutes();
const failures = [];
let written = 0;

for (const route of routes) {
  for (const locale of locales) {
    const url = localizePath(locale, route.path);
    try {
      const result = await renderPage(url);
      if (result.status !== 200) throw new Error(`rendered with status ${result.status}`);
      await writePage(url, buildDocument(result, url));
      written += 1;
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// 404 page: served by the host for unknown URLs with a real 404 status.
const notFound = await renderPage('/__not-found__');
await writeFile(join(distDir, '404.html'), buildDocument(notFound, '/404'), 'utf-8');

// sitemap.xml with hreflang alternates (one <url> per locale variant).
const buildDate = new Date().toISOString().slice(0, 10);
const entries = routes.flatMap((route) =>
  locales.map((locale) => {
    const alternates = [
      ...locales.map(
        (lng) =>
          `    <xhtml:link rel="alternate" hreflang="${lng}" href="${xml(env.siteUrl + localizePath(lng, route.path))}"/>`,
      ),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(env.siteUrl + localizePath(DEFAULT_LOCALE, route.path))}"/>`,
    ].join('\n');
    const lastmod = (route.lastmod ?? buildDate).slice(0, 10);
    return `  <url>\n    <loc>${xml(env.siteUrl + localizePath(locale, route.path))}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`;
  }),
);
await writeFile(
  join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`,
  'utf-8',
);
await writeFile(
  join(distDir, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${env.siteUrl}/sitemap.xml\n`,
  'utf-8',
);

// The server bundle is a build intermediate only.
await rm(ssrDir, { recursive: true, force: true });

const seconds = ((performance.now() - started) / 1000).toFixed(1);
console.log(
  `✓ prerendered ${written} pages + 404.html, sitemap.xml (${entries.length} URLs), robots.txt in ${seconds}s`,
);

if (failures.length > 0) {
  console.error(`✗ ${failures.length} page(s) failed to prerender:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

// Exit explicitly: app modules (timers, caches) must not keep the build alive.
process.exit(0);
