/**
 * Post-build verification (last step of `npm run build`).
 *
 * Fails the build when the static output could not be served correctly:
 *  - a generated page lacks its stylesheet or module script (the "raw HTML,
 *    no CSS/JS" failure), or references a local file that is not in dist/;
 *  - a page lacks the SEO head (title, description, canonical, hreflang
 *    ar/en/x-default), carries invalid JSON-LD, or the home page is noindex;
 *  - sitemap.xml lists a URL that was not generated or is noindex, robots.txt
 *    does not point to the sitemap, llms.txt is missing, or any output
 *    mentions localhost.
 *
 * `verifyDist(dir)` is pure (returns the list of problems) and unit-tested in
 * scripts/verify-dist.test.js.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * @param {string} dir
 * @returns {string[]} Every file below `dir` (absolute paths).
 */
function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/**
 * URL path a generated HTML file is served at.
 * @param {string} dist
 * @param {string} file
 */
function servedPath(dist, file) {
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'/index.html'.length)}`;
  return `/${rel}`;
}

/**
 * Whether a root-relative reference resolves to a file in dist/.
 * @param {string} dist
 * @param {string} ref e.g. "/assets/index-abc.js", "/en", "/#about".
 */
function resolves(dist, ref) {
  const path = decodeURIComponent(ref.split(/[?#]/)[0]);
  if (path === '/' || path === '') return existsSync(join(dist, 'index.html'));
  const target = join(dist, path);
  if (/\.[a-z0-9]+$/i.test(path)) return existsSync(target);
  return existsSync(join(target, 'index.html')) || existsSync(`${target}.html`);
}

/**
 * @param {string} html
 * @param {string} name
 */
const meta = (html, name) =>
  html.match(new RegExp(`<meta[^>]*name="${name}"[^>]*content="([^"]*)"`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*name="${name}"`, 'i'))?.[1];

/**
 * Checks a built site.
 * @param {string} dist Absolute path of the build output.
 * @returns {{ problems: string[], pages: number }}
 */
export function verifyDist(dist) {
  /** @type {string[]} */
  const problems = [];
  if (!existsSync(join(dist, 'index.html')))
    return { problems: ['dist/index.html missing'], pages: 0 };

  const files = walk(dist);
  const robots = existsSync(join(dist, 'robots.txt'))
    ? readFileSync(join(dist, 'robots.txt'), 'utf-8')
    : '';
  const sitemapUrl = robots.match(/^Sitemap:\s*(\S+)/m)?.[1];
  if (!sitemapUrl) problems.push('robots.txt: no "Sitemap:" line');
  const origin = sitemapUrl ? new URL(sitemapUrl).origin : '';

  // Generated pages are the HTML files with the app root; other HTML files
  // (e.g. the Search Console verification file) are served verbatim.
  const pages = files
    .filter((file) => file.endsWith('.html'))
    .map((file) => ({ file, path: servedPath(dist, file), html: readFileSync(file, 'utf-8') }))
    .filter((page) => page.html.includes('<div id="root">'));

  /** @type {Map<string, string>} */
  const robotsByPath = new Map();

  for (const { path, html } of pages) {
    const where = `${path}:`;
    const is404 = path === '/404.html';

    // 1. Styles and scripts (and every local reference) are servable.
    const css = html.match(/<link[^>]*rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"/);
    const js = html.match(/<script[^>]*type="module"[^>]*src="(\/assets\/[^"]+\.js)"/);
    if (!css) problems.push(`${where} no <link rel="stylesheet" href="/assets/*.css">`);
    if (!js) problems.push(`${where} no <script type="module" src="/assets/*.js">`);
    if (html.includes('/src/main.jsx'))
      problems.push(`${where} references the dev entry /src/main.jsx`);
    for (const [, ref] of html.matchAll(/(?:href|src|srcset)="(\/(?!\/)[^"\s,]*)/g)) {
      if (!resolves(dist, ref)) problems.push(`${where} broken local reference ${ref}`);
    }

    // 2. SEO head.
    const titles = html.match(/<title>[^<]+<\/title>/g) ?? [];
    if (titles.length !== 1) problems.push(`${where} expected one <title>, found ${titles.length}`);
    if (!meta(html, 'description')) problems.push(`${where} no meta description`);
    const robotsMeta = meta(html, 'robots') ?? '';
    robotsByPath.set(path, robotsMeta);
    for (const [, json] of html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    )) {
      try {
        JSON.parse(json);
      } catch (error) {
        problems.push(
          `${where} invalid JSON-LD (${error instanceof Error ? error.message : error})`,
        );
      }
    }
    if (is404) {
      if (!robotsMeta.includes('noindex')) problems.push(`${where} the 404 page must be noindex`);
      continue;
    }
    const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
    if (!canonical) problems.push(`${where} no canonical`);
    else if (origin && !canonical.startsWith(origin)) {
      problems.push(`${where} canonical ${canonical} is not on ${origin}`);
    }
    for (const lang of ['ar', 'en', 'x-default']) {
      if (!new RegExp(`hreflang="${lang}" href="https://`).test(html)) {
        problems.push(`${where} no absolute hreflang="${lang}"`);
      }
    }
    if ((path === '/' || path === '/en') && robotsMeta.includes('noindex')) {
      problems.push(`${where} the home page must be indexable`);
    }
  }

  // 3. Sitemap: every URL generated and indexable.
  const sitemapFile = join(dist, 'sitemap.xml');
  if (!existsSync(sitemapFile)) problems.push('sitemap.xml missing');
  else {
    const sitemap = readFileSync(sitemapFile, 'utf-8');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
    if (locs.length === 0) problems.push('sitemap.xml lists no URL');
    if (!sitemap.includes('xmlns:xhtml') || !sitemap.includes('hreflang="x-default"')) {
      problems.push('sitemap.xml has no hreflang alternates');
    }
    for (const loc of locs) {
      const url = new URL(loc);
      if (url.origin !== origin) problems.push(`sitemap.xml: ${loc} is not on ${origin}`);
      const robotsMeta = robotsByPath.get(url.pathname);
      if (robotsMeta === undefined) problems.push(`sitemap.xml: ${loc} was not generated`);
      else if (robotsMeta.includes('noindex')) problems.push(`sitemap.xml: ${loc} is noindex`);
    }
  }

  // 4. llms.txt (GEO brief) exists and names the site.
  const llms = join(dist, 'llms.txt');
  if (!existsSync(llms)) problems.push('llms.txt missing');
  else if (origin && !readFileSync(llms, 'utf-8').includes(origin)) {
    problems.push(`llms.txt: does not link ${origin}`);
  }

  // 5. No development origin leaks into anything crawlers read.
  for (const file of files.filter((f) => /\.(html|xml|txt)$/.test(f))) {
    if (/localhost|127\.0\.0\.1/.test(readFileSync(file, 'utf-8'))) {
      problems.push(`${servedPath(dist, file)}: mentions localhost`);
    }
  }

  return { problems, pages: pages.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const dist = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist');
  const { problems, pages } = verifyDist(dist);
  if (problems.length > 0) {
    console.error(`✗ dist verification failed (${problems.length}):\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log(
    `✓ dist verified: ${pages} pages styled and scripted, every local reference resolves, SEO head complete`,
  );
}
