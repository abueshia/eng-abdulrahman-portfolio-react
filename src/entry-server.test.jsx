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

  it('emits a FAQPage with every visible question and answer', async () => {
    const { head } = await renderPage('/en');
    const ld = head?.tags.find((tag) => tag.attrs.type === 'application/ld+json');
    const faq = JSON.parse(ld?.content ?? '{}')['@graph'].find((n) => n['@type'] === 'FAQPage');

    expect(faq.mainEntity).toHaveLength(8);
    expect(faq.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: 'How do you usually work?',
      acceptedAnswer: { '@type': 'Answer' },
    });
  });

  it('prerenders the phase-5 sections and the footer as real text', async () => {
    const { html, queryState } = await renderPage('/en');
    const keys = /** @type {any} */ (queryState).queries.map((q) => q.queryKey[0]);

    expect(keys).toEqual(expect.arrayContaining(['testimonials', 'blogs', 'faqs']));
    // Testimonials: every review (sample-flagged) is text, carousel or not.
    expect(html).toContain('Sample client, digital product founder');
    expect(html).toContain('Sample client, technical lead');
    expect(html).toContain('which made it easy for our team to build on afterwards.');
    // No names, photos, ratings or Review markup for samples.
    expect(html).not.toContain('review__avatar');
    expect(html).not.toContain('AggregateRating');
    expect(html).toContain('approved these changes');
    // Blog: the changelog on the home page links the notes.
    expect(html).toContain('Idempotent Payment Webhooks');
    // FAQ: every answer is in the HTML, including the closed ones.
    expect(html).toContain('name="faq"');
    expect(html).toContain('it does not guarantee them');
    // Contact: the form, the live request preview and the real direct channels.
    expect(html).toContain('id="contact-name"');
    expect(html).toContain('POST /api/v1/contact?lang=en HTTP/1.1');
    expect(html).toContain('mailto:');
    expect(html).toContain('ls ~/socials');
    expect(html).toContain('data-station="response"');
    // Footer: build signature, company role, and no link to a hidden section.
    expect(html).toContain('Build signature');
    expect(html).toContain('CEO of iCode Tech');
    expect(html).not.toContain('#credentials');
  });

  it('prerenders an article with sanitised, Shiki-highlighted HTML and its TOC', async () => {
    const result = await renderPage('/en/blog/sample-idempotent-payment-webhooks');
    const head = headToHtml(/** @type {any} */ (result.head));

    expect(result.status).toBe(200);
    expect(result.html).toContain('id="post-title"');
    // Build-time highlighting: dual-theme token colours, file tab, copy button.
    expect(result.html).toContain('--shiki-dark');
    expect(result.html).toContain('app/Http/Controllers/PaymentWebhookController.php');
    expect(result.html).toContain('data-copy');
    // Headings got ids, and the TOC links to them.
    expect(result.html).toMatch(/<h2 id="what-idempotency-means"/);
    expect(result.html).toContain('href="#what-idempotency-means"');
    // Sample: badge, noindex, and no BlogPosting JSON-LD.
    expect(result.html).toContain('sample-badge');
    expect(head).toContain('content="noindex, follow"');
    expect(head).not.toContain('application/ld+json');
  });

  it('keeps the all-sample blog index out of the index but renders it', async () => {
    const result = await renderPage('/en/blog');
    const head = headToHtml(/** @type {any} */ (result.head));

    expect(result.status).toBe(200);
    expect(head).toContain('content="noindex, follow"');
    expect(result.html).toContain('Laravel Queues That Recover From Failure');
  });

  it('lists home and every project for generation, skipping the hidden blog', async () => {
    const { routes, locales } = await getPrerenderRoutes();
    const routePaths = routes.map((route) => route.path);

    expect(locales).toEqual(['ar', 'en']);
    expect(routePaths).toEqual(expect.arrayContaining(['/', `/projects/${SLUG}`]));
    // Sample case studies are generated (links work) but never listed in the sitemap.
    const sample = routes.find((route) => route.path === `/projects/${SLUG}`);
    expect(sample?.sitemap).toBe(false);
    expect(routes.find((route) => route.path === '/')?.sitemap).not.toBe(false);
    // The blog is visible: its index and posts are generated, but while they
    // are samples none of them is listed in the sitemap.
    const blogRoutes = routes.filter((route) => route.path.startsWith('/blog'));
    expect(blogRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining(['/blog', '/blog/sample-core-web-vitals-react']),
    );
    expect(blogRoutes.every((route) => route.sitemap === false)).toBe(true);
  });

  it('renders unknown articles as 404', async () => {
    expect((await renderPage('/en/blog/does-not-exist')).status).toBe(404);
  });
});
