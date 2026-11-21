// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { getPrerenderRoutes, renderPage } from '@/entry-server';
import { headToHtml } from '@/utils/head';

const SLUG = 'sample-delivery-dispatch';
const TITLE = 'Delivery &amp; Booking API with Live Dispatch';

describe('Prerendering (entry-server)', () => {
  it('renders a case study with its data, final <head> and no deferred boundaries', async () => {
    const result = await renderPage(`/en/projects/${SLUG}`);
    const head = headToHtml(/** @type {any} */ (result.head));

    expect(result.status).toBe(200);
    expect(result.locale).toBe('en');
    // Real content, not the loading fallback or an outlined Suspense segment.
    expect(result.html).toContain(`>${TITLE}</h1>`);
    expect(result.html).not.toContain('<!--$?-->');
    expect(result.html).not.toContain('Loading');

    expect(head).toContain(`<title>${TITLE} | Abdulrahman Abu Eisha</title>`);
    expect(head).toMatch(/rel="canonical" href="[^"]*\/en\/projects\/sample-delivery-dispatch"/);
    expect(head).toMatch(/hreflang="ar" href="[^"]*\/projects\/sample-delivery-dispatch"/);
    expect(head).toMatch(/hreflang="x-default" href="[^"]*\/projects\/sample-delivery-dispatch"/);
  });

  it('keeps sample case studies out of the index: noindex, no CreativeWork, but a real 200', async () => {
    const result = await renderPage(`/en/projects/${SLUG}`);
    const head = headToHtml(/** @type {any} */ (result.head));

    expect(result.status).toBe(200);
    expect(head).toContain('name="robots" content="noindex, follow"');
    expect(head).not.toContain('application/ld+json');
    // The badge and the notice say so on the page itself.
    expect(result.html).toContain('sample-badge');
    expect(result.html).toContain('Sample case study');
  });

  it('prerenders the whole case study: architecture, decisions, gallery and next case', async () => {
    const { html } = await renderPage(`/en/projects/${SLUG}`);

    expect(html).toContain('WebSocket Server'); // a diagram node, as SVG text
    expect(html).toContain('Every status change is an event'); // a decision
    expect(html).toContain('Courier app screens'); // gallery alt
    expect(html).toContain('data-vt-cover'); // the View Transition target
    expect(html).toContain('Next case');
    expect(html).toContain('No data'); // a null metric never becomes a number
    expect(html).not.toContain('data-fx="on"');
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

    expect(graph.map((node) => node['@type'])).toEqual([
      'ProfilePage',
      'Person',
      'WebSite',
      'ProfessionalService',
      'FAQPage',
    ]);
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
    // Common spellings, city-level address only, and where clients are served.
    expect(person.alternateName).toEqual(
      expect.arrayContaining([
        'عبد الرحمن أبو عيشة',
        'Abdelrahman Abu Eisha',
        'Eng. Abdulrahman Abu Eisha',
      ]),
    );
    expect(person.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Cairo',
      addressCountry: 'EG',
    });
    expect(person.areaServed).toEqual([
      { '@type': 'Place', name: 'Egypt' },
      { '@type': 'Place', name: 'Arab world' },
    ]);
    expect(person.knowsAbout).toEqual(expect.arrayContaining(['Laravel', 'PHP', 'React']));
    expect(JSON.stringify(graph)).not.toMatch(
      /"@type":"(Review|AggregateRating)"|ratingValue|reviewRating|aggregateRating|Hadayek|حدائق/,
    );
  });

  it('gives every generated page a complete, valid head (title, description, canonical, hreflang, JSON-LD)', async () => {
    const { routes, locales } = await getPrerenderRoutes();
    const titles = new Set();
    for (const route of routes) {
      for (const locale of locales) {
        const url = locale === 'en' ? `/en${route.path === '/' ? '' : route.path}` : route.path;
        const result = await renderPage(url);
        const head = /** @type {any} */ (result.head);
        const attrs = (/** @type {Record<string, string>} */ match) =>
          head.tags.find((tag) => Object.entries(match).every(([k, v]) => tag.attrs[k] === v))
            ?.attrs;

        expect(result.status, url).toBe(200);
        expect(head.title.length, url).toBeGreaterThan(10);
        titles.add(head.title);
        expect(attrs({ name: 'description' })?.content.length, url).toBeGreaterThan(50);
        expect(attrs({ rel: 'canonical' })?.href, url).toMatch(/^https:\/\//);
        for (const lang of ['ar', 'en', 'x-default']) {
          expect(attrs({ rel: 'alternate', hreflang: lang })?.href, `${url} ${lang}`).toMatch(
            /^https:\/\//,
          );
        }
        for (const tag of head.tags.filter((t) => t.attrs.type === 'application/ld+json')) {
          expect(() => JSON.parse(tag.content), url).not.toThrow();
        }
        const robots = attrs({ name: 'robots' })?.content;
        if (route.path === '/') expect(robots, url).toContain('index, follow');
        if (route.sitemap === false) expect(robots, url).toContain('noindex');
      }
    }
    // Titles are unique per page and language.
    expect(titles.size).toBe(routes.length * locales.length);
  });

  it('uses the settings title on the home page and keeps it within ~60 characters', async () => {
    for (const url of ['/', '/en']) {
      const { head } = await renderPage(url);
      const title = /** @type {any} */ (head).title;
      expect(title).toMatch(/عبدالرحمن أبو عيشة|Abdulrahman Abu Eisha/);
      expect([...title].length).toBeLessThanOrEqual(65);
    }
  });

  it('describes the services as a ProfessionalService offer catalogue, grouped like the page', async () => {
    const { head } = await renderPage('/en');
    const ld = head?.tags.find((tag) => tag.attrs.type === 'application/ld+json');
    const graph = JSON.parse(ld?.content ?? '{}')['@graph'];
    const service = graph.find((node) => node['@type'] === 'ProfessionalService');
    const groups = service.hasOfferCatalog.itemListElement;

    expect(service.founder).toEqual({ '@id': graph[1]['@id'] });
    expect(groups.map((group) => group.name)).toEqual([
      'Backend & Integrations',
      'Frontend',
      'Growth: SEO & GEO',
      'Infra & AI',
      'Support',
    ]);
    const offers = groups.flatMap((group) => group.itemListElement);
    expect(offers).toHaveLength(14);
    expect(offers[0].itemOffered).toMatchObject({
      '@type': 'Service',
      name: 'REST API Design & Development',
    });
  });

  it('prerenders every case file and every service contract as real text', async () => {
    const { html, queryState } = await renderPage('/en');
    const keys = /** @type {any} */ (queryState).queries.map((q) => q.queryKey[0]);

    expect(keys).toEqual(expect.arrayContaining(['projects', 'services']));
    for (const title of [
      'Multi-tenant SaaS Subscription Platform',
      'Inventory &amp; Point-of-Sale System',
      TITLE,
    ]) {
      expect(html).toContain(title);
    }
    expect(html).toContain('sample-badge');
    expect(html).toContain('Single DB · tenant_id scoping'); // a descriptive metric
    // Services: endpoints, titles, deliverables (closed contracts included).
    expect(html).toContain('/services/payment-integration');
    expect(html).toContain('Paymob');
    expect(html).toContain('GEO: Generative Engine Optimization');
    expect(html).toContain('An llms.txt file and machine-readable page structure');
    expect(html).toContain('200 OK');
    // Journey: the endpoints station is a route stop; credentials stay hidden.
    expect(html).toContain('data-station="endpoints"');
    expect(html).not.toContain('id="credentials"');
  });

  it('prerenders the full hero: the intro and motion layers never hide content', async () => {
    const { html } = await renderPage('/en');

    // The name is the <h1> (and the LCP element), as real text.
    expect(html).toMatch(/<h1[^>]*id="hero-title"[^>]*>[\s\S]*Abdulrahman[\s\S]*Abu Eisha/);
    expect(html).toContain(
      'Full-Stack Software Engineer and back-end developer based in Cairo, Egypt',
    );
    expect(html).toContain('Explore case studies');
    expect(html).toContain('Download CV');
    expect(html).toContain('php artisan engineer:profile --stack');
    expect(html).toMatch(
      /<img[^>]*alt="Portrait of Abdulrahman Abu Eisha, Full-Stack Software Engineer"/,
    );
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

  it('emits a FAQPage with every visible question and answer', async () => {
    const { head } = await renderPage('/en');
    const ld = head?.tags.find((tag) => tag.attrs.type === 'application/ld+json');
    const faq = JSON.parse(ld?.content ?? '{}')['@graph'].find((n) => n['@type'] === 'FAQPage');

    expect(faq.mainEntity).toHaveLength(13);
    expect(faq.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'How do you usually work?',
      acceptedAnswer: { '@type': 'Answer' },
    });
  });

  it('prerenders the phase-5 sections and the footer as real text', async () => {
    const { html, queryState } = await renderPage('/en');
    const keys = /** @type {any} */ (queryState).queries.map((q) => q.queryKey[0]);

    expect(keys).toEqual(expect.arrayContaining(['testimonials', 'faqs']));
    expect(keys).not.toContain('blogs');
    // Testimonials: every review (sample-flagged) is text, carousel or not.
    expect(html).toContain('Sample client, digital product founder');
    expect(html).toContain('Sample client, technical lead');
    expect(html).toContain('which made it easy for our team to build on afterwards.');
    // Ratings are visible stars with a text label, avatars are generated
    // monograms (no photos for samples), and there is no Review markup at all.
    expect(html).toContain('aria-label="Rated 5 out of 5"');
    expect(html).toContain('class="avatar"');
    expect(html).not.toContain('avatar--photo');
    expect(html).not.toMatch(/"@type":\s*"(Review|AggregateRating)"/);
    expect(html).not.toMatch(/ratingValue|reviewRating|aggregateRating/i);
    // "Write a review" is a real button in the HTML; the form dialog is not prerendered.
    expect(html).toMatch(/<button[^>]*class="review-cta"[^>]*>[\s\S]*?Write a review/);
    expect(html).not.toContain('<dialog');
    expect(html).not.toContain('review-name');
    expect(html).toContain('approved these changes');
    // No blog: the section and every link to it are gone.
    expect(html).not.toContain('id="blog"');
    expect(html).not.toMatch(/href="[^"]*\/blog/);
    // FAQ: every answer is in the HTML, including the closed ones.
    expect(html).toContain('name="faq"');
    expect(html).toContain('it does not guarantee them');
    // Contact: the form, the live request preview and the real direct channels.
    expect(html).toContain('id="contact-name"');
    expect(html).toContain('POST /api/v1/contact?lang=en HTTP/1.1');
    expect(html).toContain('mailto:');
    expect(html).toContain('ls ~/socials');
    expect(html).toContain('data-station="response"');
    // Footer: build signature, job title, and no link to a hidden section.
    expect(html).toContain('Build signature');
    expect(html).toMatch(/class="foot__company">Full-Stack Software Engineer</);
    expect(html).not.toContain('#credentials');
  });

  it('lists home and every project for generation', async () => {
    const { routes, locales } = await getPrerenderRoutes();
    const routePaths = routes.map((route) => route.path);

    expect(locales).toEqual(['ar', 'en']);
    expect(routePaths).toEqual(expect.arrayContaining(['/', `/projects/${SLUG}`]));
    // Sample case studies are generated (links work) but never listed in the sitemap.
    const sample = routes.find((route) => route.path === `/projects/${SLUG}`);
    expect(sample?.sitemap).toBe(false);
    expect(routes.find((route) => route.path === '/')?.sitemap).not.toBe(false);
    // The blog was removed: nothing under /blog is generated or listed.
    expect(routePaths.some((path) => path.startsWith('/blog'))).toBe(false);
  });

  it('renders the removed blog URLs as plain 404s', async () => {
    expect((await renderPage('/en/blog')).status).toBe(404);
    expect((await renderPage('/blog/sample-laravel-queues-that-recover')).status).toBe(404);
  });
});
