// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getPrerenderRoutes, renderPage } from '@/entry-server';
import { headToHtml } from '@/utils/head';

const SLUG = 'sample-fleet-api';

describe('Prerendering (entry-server)', () => {
  it('renders a case study with its data, final <head> and no deferred boundaries', async () => {
    const result = await renderPage(`/en/projects/${SLUG}`);
    const head = headToHtml(/** @type {any} */ (result.head));

    expect(result.status).toBe(200);
    expect(result.locale).toBe('en');
    // Real content, not the loading fallback or an outlined Suspense segment.
    expect(result.html).toMatch(/<h1[^>]*>Sample · Fleet API/);
    expect(result.html).not.toContain('<!--$?-->');
    expect(result.html).not.toContain('Loading');

    expect(head).toContain('<title>Sample · Fleet API | Abdulrahman Abu Eisha</title>');
    expect(head).toMatch(/rel="canonical" href="[^"]*\/en\/projects\/sample-fleet-api"/);
    expect(head).toMatch(/hreflang="ar" href="[^"]*\/projects\/sample-fleet-api"/);
    expect(head).toMatch(/hreflang="x-default" href="[^"]*\/projects\/sample-fleet-api"/);
    expect(head).toContain('content="index, follow');
  });

  it('dehydrates the fetched queries so the client hydrates identical data', async () => {
    const { queryState } = await renderPage('/');
    const keys = /** @type {any} */ (queryState).queries.map((q) => q.queryKey);

    expect(keys).toContainEqual(['settings', 'ar']);
    expect(keys).toContainEqual(['projects', {}, 'ar']);
  });

  it('emits ProfilePage/Person/WebSite JSON-LD on the home page', async () => {
    const { head } = await renderPage('/en');
    const ld = head?.tags.find((tag) => tag.attrs.type === 'application/ld+json');
    const graph = JSON.parse(ld?.content ?? '{}')['@graph'];

    expect(graph.map((node) => node['@type'])).toEqual(['ProfilePage', 'Person', 'WebSite']);
    const [page, person] = graph;
    expect(page.mainEntity).toEqual({ '@id': person['@id'] });
    expect(person.name).toBe('Abdulrahman Abu Eisha');
    expect(person.jobTitle).toEqual(['Full-Stack Software Engineer', 'CEO, iCode Tech']);
    expect(person.worksFor).toEqual({ '@type': 'Organization', name: 'iCode Tech' });
    // Identity profiles only: no contact channels (WhatsApp) and no X.
    expect(person.sameAs).toEqual([
      'https://github.com/abueshia',
      'https://www.linkedin.com/in/eng-abdulrahman-abu-eisha/',
      'https://www.facebook.com/abdo.saad.35762241',
    ]);
  });

  it('prerenders the full hero: the intro and motion layers never hide content', async () => {
    const { html } = await renderPage('/en');

    // The name is the <h1> (and the LCP element), as real text.
    expect(html).toMatch(/<h1[^>]*id="hero-title"[^>]*>[\s\S]*Abdulrahman[\s\S]*Abu Eisha/);
    expect(html).toContain('I build robust back-end systems');
    expect(html).toContain('Explore case studies');
    expect(html).toContain('Download CV');
    expect(html).toContain('php artisan engineer:profile --stack');
    expect(html).toMatch(/<img[^>]*alt="Portrait of Abdulrahman Abu Eisha"/);
    // Journey stops are in the markup; client-only layers are not.
    expect(html).toContain('data-station-anchor="true"');
    expect(html).not.toContain('class="boot');
    expect(html).not.toContain('mesh-canvas');
  });

  it('prerenders the Arabic hero name word-intact', async () => {
    const { html } = await renderPage('/');
    expect(html).toMatch(/<h1[^>]*id="hero-title"[^>]*>[\s\S]*عبدالرحمن[\s\S]*أبو عيشة/);
  });

  it('prerenders every phase-3 section as real text (lazy chunks included)', async () => {
    const { html, queryState } = await renderPage('/en');
    const keys = /** @type {any} */ (queryState).queries.map((q) => q.queryKey[0]);

    // Their data is dehydrated for an identical hydration.
    expect(keys).toEqual(expect.arrayContaining(['stats', 'technologies', 'experiences']));
    // Stats: the real figure as text; zeroed samples say "No data", never "0".
    expect(html).toMatch(/Years of experience[\s\S]*?4\+/);
    expect(html).toContain('No data');
    // About: statement, story, company title and the PHP class.
    expect(html).toMatch(/<h2[^>]*id="about-title"[^>]*>I write code that outlives the project\./);
    expect(html).toContain('CEO of iCode Tech');
    expect(html).toContain('final class');
    expect(html).toContain('AbdulrahmanAbuEisha');
    expect(html).toContain('<span class="tok tok--fn">test</span>');
    // Skills: all clusters' skills, including the tabs not selected yet.
    for (const skill of ['PHP 8.3', 'React', 'PostgreSQL', 'Docker', 'TDD']) {
      expect(html).toContain(skill);
    }
    expect(html).toContain('role="tablist"');
    // Experience: every role, the side branch and its merge.
    expect(html).toContain('Senior Full-Stack Software Engineer');
    expect(html).toContain('Junior Back-end Developer');
    expect(html).toContain('Merge branch');
    expect(html).toContain('HEAD -&gt; main');
    // Journey: the observability tap is a route stop.
    expect(html).toContain('data-station="observability"');
    // Directors never ship in the markup.
    expect(html).not.toContain('data-fx="on"');
  });

  it('marks unknown URLs as 404 + noindex', async () => {
    const result = await renderPage('/en/projects/does-not-exist');

    expect(result.status).toBe(404);
    expect(headToHtml(/** @type {any} */ (result.head))).toContain('noindex');
  });

  it('lists home and every project for generation, skipping the hidden blog', async () => {
    const { routes, locales } = await getPrerenderRoutes();
    const routePaths = routes.map((route) => route.path);

    expect(locales).toEqual(['ar', 'en']);
    expect(routePaths).toEqual(expect.arrayContaining(['/', `/projects/${SLUG}`]));
    // sections_visibility.blog = false → no blog pages and no sitemap entries.
    expect(routePaths.some((p) => p.startsWith('/blog'))).toBe(false);
  });

  it('renders the blog as 404 while the section is hidden', async () => {
    expect((await renderPage('/en/blog')).status).toBe(404);
  });
});
