// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getPrerenderRoutes, renderPage } from '@/entry-server';
import { headToHtml } from '@/utils/head';

const SLUG = 'atlas-fleet-api';

describe('Prerendering (entry-server)', () => {
  it('renders a case study with its data, final <head> and no deferred boundaries', async () => {
    const result = await renderPage(`/en/projects/${SLUG}`);
    const head = headToHtml(/** @type {any} */ (result.head));

    expect(result.status).toBe(200);
    expect(result.locale).toBe('en');
    // Real content, not the loading fallback or an outlined Suspense segment.
    expect(result.html).toMatch(/<h1[^>]*>Atlas Fleet API/);
    expect(result.html).not.toContain('<!--$?-->');
    expect(result.html).not.toContain('Loading');

    expect(head).toContain('<title>Atlas Fleet API | Abdulrahman Abu Eisha</title>');
    expect(head).toMatch(/rel="canonical" href="[^"]*\/en\/projects\/atlas-fleet-api"/);
    expect(head).toMatch(/hreflang="ar" href="[^"]*\/projects\/atlas-fleet-api"/);
    expect(head).toMatch(/hreflang="x-default" href="[^"]*\/projects\/atlas-fleet-api"/);
    expect(head).toContain('content="index, follow');
  });

  it('dehydrates the fetched queries so the client hydrates identical data', async () => {
    const { queryState } = await renderPage('/');
    const keys = /** @type {any} */ (queryState).queries.map((q) => q.queryKey);

    expect(keys).toContainEqual(['settings', 'ar']);
    expect(keys).toContainEqual(['projects', {}, 'ar']);
  });

  it('emits Person/WebSite JSON-LD on the home page', async () => {
    const { head } = await renderPage('/en');
    const ld = head?.tags.find((tag) => tag.attrs.type === 'application/ld+json');
    const graph = JSON.parse(ld?.content ?? '{}')['@graph'];

    expect(graph.map((node) => node['@type'])).toEqual(['Person', 'WebSite']);
    expect(graph[0].name).toBe('Abdulrahman Abu Eisha');
    // Placeholder (non-URL) socials must never leak into sameAs.
    expect(graph[0].sameAs.every((url) => /^https?:\/\//.test(url))).toBe(true);
  });

  it('marks unknown URLs as 404 + noindex', async () => {
    const result = await renderPage('/en/projects/does-not-exist');

    expect(result.status).toBe(404);
    expect(headToHtml(/** @type {any} */ (result.head))).toContain('noindex');
  });

  it('lists every static, project and blog route for generation', async () => {
    const { routes, locales } = await getPrerenderRoutes();
    const routePaths = routes.map((route) => route.path);

    expect(locales).toEqual(['ar', 'en']);
    expect(routePaths).toEqual(expect.arrayContaining(['/', '/blog', `/projects/${SLUG}`]));
    expect(routePaths.some((p) => p.startsWith('/blog/'))).toBe(true);
  });
});
