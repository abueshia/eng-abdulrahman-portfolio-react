// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { verifyDist } from './verify-dist.js';

const ORIGIN = 'https://site.example';

/**
 * A minimal generated page.
 * @param {{ path: string, robots?: string, css?: boolean, js?: boolean, extra?: string }} options
 */
const page = ({
  path,
  robots = 'index, follow',
  css = true,
  js = true,
  extra = '',
}) => `<!doctype html>
<html><head>
${js ? '<script type="module" crossorigin src="/assets/index-AAAAAAAA.js"></script>' : ''}
${css ? '<link rel="stylesheet" crossorigin href="/assets/index-BBBBBBBB.css">' : ''}
<title>Page ${path}</title>
<meta name="description" content="A description" data-seo>
<meta name="robots" content="${robots}" data-seo>
<link rel="canonical" href="${ORIGIN}${path}" data-seo>
<link rel="alternate" hreflang="ar" href="${ORIGIN}/" data-seo>
<link rel="alternate" hreflang="en" href="${ORIGIN}/en" data-seo>
<link rel="alternate" hreflang="x-default" href="${ORIGIN}/" data-seo>
<script type="application/ld+json" data-seo>{"@context":"https://schema.org"}</script>
${extra}
</head><body><div id="root"><a href="/en">en</a></div></body></html>`;

/** @type {string[]} */
const dirs = [];

/** @param {Record<string, string>} files */
function site(files) {
  const dir = mkdtempSync(join(tmpdir(), 'dist-'));
  dirs.push(dir);
  const all = {
    'assets/index-AAAAAAAA.js': '',
    'assets/index-BBBBBBBB.css': '',
    'index.html': page({ path: '/' }),
    'en/index.html': page({ path: '/en' }),
    '404.html': page({ path: '/404', robots: 'noindex, nofollow' }),
    'robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
    'sitemap.xml': `<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml"><url><loc>${ORIGIN}/</loc><xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/"/></url></urlset>`,
    'llms.txt': `# Site\n- [Home](${ORIGIN}/)\n`,
    'google123.html': 'google-site-verification: google123.html',
    ...files,
  };
  for (const [name, content] of Object.entries(all)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('verifyDist (post-build check)', () => {
  it('accepts a complete build', () => {
    const { problems, pages } = verifyDist(site({}));
    expect(problems).toEqual([]);
    expect(pages).toBe(3); // the verification file is not a generated page
  });

  it('fails a page served without its stylesheet or module script (raw HTML)', () => {
    const { problems } = verifyDist(
      site({ 'en/index.html': page({ path: '/en', css: false, js: false }) }),
    );
    expect(problems).toContain('/en: no <link rel="stylesheet" href="/assets/*.css">');
    expect(problems).toContain('/en: no <script type="module" src="/assets/*.js">');
  });

  it('fails a reference to a file that is not in dist', () => {
    const { problems } = verifyDist(
      site({
        'en/index.html': page({
          path: '/en',
          extra: '<link rel="modulepreload" href="/assets/gone-CCCCCCCC.js">',
        }),
      }),
    );
    expect(problems).toContain('/en: broken local reference /assets/gone-CCCCCCCC.js');
  });

  it('fails invalid JSON-LD, a noindex home page, a noindex sitemap URL and localhost', () => {
    const { problems } = verifyDist(
      site({
        'index.html': page({
          path: '/',
          robots: 'noindex, follow',
          extra:
            '<script type="application/ld+json">{oops</script><meta property="og:url" content="http://localhost:5173/">',
        }),
      }),
    );
    expect(problems.some((p) => p.startsWith('/: invalid JSON-LD'))).toBe(true);
    expect(problems).toContain('/: the home page must be indexable');
    expect(problems).toContain(`sitemap.xml: ${ORIGIN}/ is noindex`);
    expect(problems).toContain('/: mentions localhost');
  });

  it('fails without llms.txt or a sitemap line in robots.txt', () => {
    const dir = site({ 'robots.txt': 'User-agent: *\n' });
    rmSync(join(dir, 'llms.txt'));
    const { problems } = verifyDist(dir);
    expect(problems).toContain('robots.txt: no "Sitemap:" line');
    expect(problems).toContain('llms.txt missing');
  });
});
