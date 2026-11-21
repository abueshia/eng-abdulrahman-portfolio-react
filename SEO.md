# SEO Strategy & Implementation

SEO is a top priority for this portfolio: the domain will be verified in Google Search Console, and every page has to be fully indexable in **Arabic and English**. This document is the source of truth for how pages get discovered, rendered, described and measured. Update it in the same commit as any change to routing, metadata, structured data or the build pipeline.

---

## 1. Principles

1. **Crawlers get real HTML.** Every indexable URL is prerendered at build time (SSG), with final content, `<title>`, meta tags and JSON-LD. Search engines and social scrapers never depend on JavaScript.
2. **One URL per language.** Arabic at the root (`/…`), English under `/en/…`. Every page carries its canonical URL and hreflang alternates.
3. **Real status codes.** Unknown URLs get an HTTP `404` (from `404.html`), not a `200` with a client-rendered "not found".
4. **The same data path in every mode.** The prerenderer uses the same services as the browser (mock adapter or live Laravel API), so what is indexed is exactly what users see.
5. **Content beats tricks.** Fast pages, semantic markup (`<header>`, `<main>`, `<article>`, one `<h1>`), descriptive links and accurate structured data. No hidden text, no keyword stuffing.

---

## 2. Rendering: build-time prerendering (SSG)

### Decision

The site is deployed as a **static, prerendered SPA**. SSR at request time was rejected: the content changes only when the owner publishes, a static CDN is cheaper and faster, and the hosting stays simple (Vercel static). The trade-off is that **new content needs a rebuild**. See §8.

### Pipeline (`npm run build`)

| Step | Command | Output |
| --- | --- | --- |
| 1. Client bundle | `vite build` | `dist/` (HTML shell, JS, CSS, public files) |
| 2. Server bundle | `vite build --ssr src/entry-server.jsx --outDir dist-ssr` | `dist-ssr/entry-server.js` (deleted after step 3) |
| 3. Generate | `node scripts/prerender.js` | `dist/**/index.html`, `dist/404.html`, `dist/sitemap.xml`, `dist/robots.txt` |

`npm run build:spa` runs only step 1 (client-only debugging).

### How a page is rendered (`src/entry-server.jsx`)

1. `react-dom/static` `prerender()` renders the route through React Router's static handler. It waits for lazy page chunks.
2. Queries never fetch on the server, so after each pass the queries the tree declared are fetched through the normal services. Rendering repeats until no new queries appear (max 4 passes). **Pages need no SSR-specific code.**
3. The query cache is dehydrated into the page as `window.__PRERENDER__ = { path, queryState }`.
4. `<Seo>` reports its tags to a head collector (`HeadContext`), and they are serialised into `<head>`.

### Hydration contract (`src/main.jsx`)

The client **hydrates** only if `__PRERENDER__.path` equals the current pathname and the URL was not rewritten by the saved-locale rule. Otherwise (`404.html`, SPA fallback, `/` → `/en` rewrite) it discards the markup and renders fresh. `src/app/hydration.test.jsx` hydrates real prerendered output and fails on any hydration mismatch.

### Pitfalls already solved (keep them solved)

| Pitfall | Fix |
| --- | --- |
| React Fizz outlines Suspense boundaries > ~12.8 KB into a hidden `<template>` swapped in by an inline script, so non-JS crawlers would see "Loading…" | `prerender(..., { progressiveChunkSize: Infinity })`; tested (`<!--$?-->` must not appear) |
| An errored query looks "pending" again on the next pass (`retryOnMount`), so a 404 page rendered its loading state | `retryOnMount: false` for the server query client |
| Theme differs between prerender (`dark`) and a light-mode visitor | Theme read via `useSyncExternalStore` with a server snapshot; the effect never overwrites `<html data-theme>`; tested |
| Browser-only APIs during render | `window`/`document` only inside effects, event handlers or guarded helpers |
| Router created before the saved-locale rewrite | `createAppRouter()` factory called in `main.jsx` after the rewrite |
| Lingering timers keep Node alive after generation | Query cache cleared after dehydration; script exits explicitly |

**Home sections are separate chunks (phase 3).** Stats, About, Skills and Experience are `React.lazy` components inside `<Suspense fallback={null}>`. The prerenderer waits for them, so their full text is in the HTML; on the client their markup hydrates as soon as each chunk arrives (React keeps the server HTML until then). Their markup code therefore never enters the initial bundle. Content rules that keep them indexable:

- Every number, skill, role, date and paragraph is text in the HTML. Decorative layers (odometer reels, the AUTH gate, the constellation SVG, the graph gutter) are `aria-hidden`, and their default state is the final one.
- Skills: all five tab panels are in the HTML (inactive ones use `hidden`), and each skill carries its proficiency (`role="meter"`) and years as text.
- No browser-dependent values in markup: dates are formatted by hand (`2024·03`), never with `Intl` (month names differ between the build machine and browsers), and a running role shows "present" rather than a duration computed from "today".

**Projects and Services (phase 4)** follow the same model (lazy chunks, fully prerendered):

- Every case file is an `<article>` with its title (an `<h3>` link to the case study), summary, role, stack and metrics as text. The hover reveal and the "View" cursor are decoration.
- Filters (`?type=…&tech=…`) apply **after hydration only**: the prerendered list is always the full one, so a filtered URL hydrates against identical markup (tested), then filters.
- Every service is a native `<details>` (works without JavaScript, opens on find-in-page). Closed contracts are still in the HTML: titles, descriptions, every deliverable and provider.
- The case study is prerendered in full, including the architecture diagram (SVG text from the data, plus a visually hidden list of the data flows), the decisions, the gallery `alt`s and the next case. Request packets on the diagram are client-only.
- Phase-4 UI strings live in `src/i18n/locales/work.{ar,en}.json`, registered by the chunks that use them (`src/i18n/work.js`), so the initial bundle does not carry them. Module evaluation precedes rendering, so prerender and hydration render the same text.

**Testimonials, Blog, FAQ, Contact and the footer (phase 5)** follow the same model:

- Testimonials: every review is text in a native scroll-snap row; embla (lazy) only enhances it.
- FAQ: native `<details name="faq">`; every answer is in the HTML, closed ones included.
- Contact: the whole form, the live request preview and the direct channels are prerendered; react-hook-form hydrates them.
- The footer is a lazy chunk too (prerendered in full). Its local clock is a reserved `--:--` slot filled after hydration.
- **Articles are processed at build time.** `useBlog` runs the article pipeline (`src/features/blog/lib/article.js`) inside the query: DOMPurify sanitises the API HTML (allow-list), headings get ids for the TOC, and Shiki highlights the code (php/js/jsx/bash/json/sql, JavaScript regex engine, dual theme through CSS variables). In Node the pipeline uses a jsdom window. The processed HTML is what gets dehydrated, so a prerendered article hydrates without loading DOMPurify or Shiki. Only a client-side navigation to an article runs it in the browser (lazy chunk). `jsdom` must be installed at build time.

**Rule for new code:** anything that renders on a page must be renderable in Node. Media queries go through `useMediaQuery` (server snapshot), and canvas/GSAP/Lenis work belongs in effects. Run `npm run build` before considering a feature done.

---

## 3. URLs, languages and duplicates

| Page | Arabic (default, `x-default`) | English |
| --- | --- | --- |
| Home | `/` | `/en` |
| Case study | `/projects/:slug` | `/en/projects/:slug` |
| Blog index | `/blog` | `/en/blog` |
| Article | `/blog/:slug` | `/en/blog/:slug` |

- **No trailing slashes** (`vercel.json` → `"trailingSlash": false`, which 308-redirects `/en/` to `/en`).
- **Slugs are shared across languages**, so alternates are derived by toggling the `/en` prefix.
- **hreflang on every page:** `ar`, `en` and `x-default` (Arabic), always absolute and reciprocal. Also repeated in `sitemap.xml`.
- **Canonical is self-referencing** per language. A page never canonicalises to the other language.
- **Language detection never redirects bots.** The only redirect is client-side (`/` → `/en` when a *returning visitor* last used English). Crawlers have no `localStorage`, so they always get the URL they asked for. No `Accept-Language` or IP redirects, ever.
- **Filter state in the URL** (projects filters: `/?type=saas&tech=laravel`) uses query strings. Filtered views keep the canonical of the unfiltered page (`<Seo>` builds the canonical from the pathname only), and the filter controls are buttons, not links, so crawlers are not invited into filter permutations.

---

## 4. Metadata (`<Seo>`)

Every page renders exactly one `<Seo>` (`src/components/ui/Seo.jsx`). The tags are built by pure helpers in `src/utils/head.js`, which are shared by the prerenderer and the browser. Managed tags carry `data-seo` and are replaced on navigation.

| Tag | Source |
| --- | --- |
| `<title>` | `meta.titleTemplate` (`%s \| عبدالرحمن أبو عيشة` / `%s \| Abdulrahman Abu Eisha`). Home uses `meta.defaultTitle`. Target ≤ 60 chars. |
| `meta description` | Page data (`summary`, `excerpt`, `settings.seo.meta_description`), falling back to `meta.defaultDescription`. Target 120–160 chars. |
| `robots` | `index, follow, max-image-preview:large`; `noindex, follow` on sample case studies (`is_sample`); `noindex, nofollow` on the 404 page |
| HTTP status (prerender) | `<Seo status>`: 200 by default, `404` on the not-found page. Not derived from `noindex` (sample pages are noindex but real 200 pages). |
| `link canonical` / `alternate hreflang` | See §3 |
| Open Graph | `og:type` (`profile` on home, `article` on case studies and posts), `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `og:locale` + `og:locale:alternate` |
| Twitter | `summary_large_image` card mirroring OG |

**OG images:** 1200×630 JPG/PNG under 300 KB, with safe margins for the cropped square previews. Default: `/images/og-cover.jpg` (1200×630, final). Case studies and posts use their `cover_image` when it is a raster image (JPG/PNG/WebP); the generated SVG sample covers fall back to the default, since social scrapers do not render SVG. Phase 6 may generate per-page OG images at build time.

---

## 5. Structured data (JSON-LD)

Passed to `<Seo jsonLd={…}>`. Builders live in `src/utils/structured-data.js` (pure, tested).

| Page | Schema | Status |
| --- | --- | --- |
| Home | `ProfilePage` (`mainEntity` → Person, `isPartOf` → WebSite) | ✅ Phase 3 |
| Home | `Person` (name, `jobTitle` = [engineer title, "CEO, iCode Tech"], `worksFor` Organization, image, `sameAs` socials, knowsAbout) + `WebSite`, linked by `@id` | ✅ Phase 1, titles + `worksFor` Phase 3 |
| Home | `ProfessionalService` (founded by the Person) with `hasOfferCatalog`: one `OfferCatalog` per service group, each service an `Offer` → `Service` (name, description, `serviceType`, provider → Person) | ✅ Phase 4 |
| Case study | `CreativeWork` (or `SoftwareSourceCode` with `codeRepository` when `github_url` is public) authored by the Person + `BreadcrumbList` (Home → Work → project). **Real projects only**: `is_sample` projects get none. | ✅ Phase 4 |
| Article | `BlogPosting` (headline, description, datePublished, dateModified, author/publisher → Person `@id`, image, articleSection, keywords, timeRequired) + `BreadcrumbList` (Home → Blog → post). **Real posts only**: `is_sample` posts get none. | ✅ Phase 5 |
| Home | `FAQPage` (every visible question with its `acceptedAnswer`), emitted only while the FAQ section is visible | ✅ Phase 5 |
| Testimonials | None on purpose: Google ignores self-serving reviews about one's own services, and samples must never be marked up | — |

Rules: only absolute `https` URLs, so placeholder or non-URL values are filtered out. `sameAs` lists identity profiles only (GitHub, LinkedIn, Facebook), never contact channels like WhatsApp. Mark up only content that is visible on the page. Validate with the [Rich Results Test](https://search.google.com/test/rich-results) before every release.

---

## 6. Crawling & indexing

- **Hidden sections are not published:** with `sections_visibility.blog = false`, `/blog` and its posts are neither prerendered nor listed in the sitemap, they render the 404 page, and the nav link disappears.
- **Visible but sample:** the blog is visible with sample posts (phase 5). Every post page is generated but `noindex` and unlisted, and `/blog` itself is `noindex` and unlisted while *all* posts are samples. The first real post flips both automatically.
- **`sitemap.xml`** is generated from the same route list that is prerendered: every route × locale, with `xhtml:link` alternates and `lastmod` (from `updated_at` / `published_at`, else the build date). Routes flagged `sitemap: false` are generated but not listed: sample case studies (`is_sample: true`), which are also `noindex`.
- **Sample projects:** until real case studies replace them, the samples are reachable (links work, pages are prerendered) but invisible to search engines. When the API returns a project without `is_sample`, it is indexed, listed and described with JSON-LD automatically.
- **`robots.txt`:** allow all, plus the sitemap location.
- **404:** `dist/404.html` (Arabic, `noindex`) is served by Vercel with a real `404` status for any URL that was not generated.
- **Internal linking:** real `<a href>` links (`LocalizedLink`) for every page. Never navigate with `onClick` alone. Case studies link to related projects and the next case. Posts link to related posts.
- **Images:** descriptive `alt` (from the API, localised), explicit `width`/`height`, AVIF/WebP with `srcset` via `npm run images`, lazy below the fold, `fetchpriority="high"` only for an image that is the LCP element.
  - The hero portrait is not the LCP element (the name is), so it is not prioritised over the font.
  - Its `alt` is "Portrait of {name}" in each language.

---

## 7. Laravel API requirements (SEO contract)

The backend must provide, per locale:

| Resource | Fields needed for SEO |
| --- | --- |
| `GET /settings` | `general.owner_name`, `general.job_title`, `general.avatar`, `general.socials[].url` (absolute), `seo.meta_title`, `seo.meta_description`, `seo.og_image` |
| `GET /projects`, `/projects/:slug` | stable `slug`, `title`, `summary` (≤ 160 chars), `cover_image` (absolute or root-relative) + `cover_alt`, `published_at`, `updated_at`, `is_sample` (boolean). Summary items also carry `type`, `year`, `role`, `preview_image`, `metrics[]`, `technologies[]`. The full record adds `problem`, `solution`, `challenges[{title, body}]`, `architecture{nodes[{id,label,layer,note}], edges[{from,to,kind,label}]}`, `decisions[{title, body, nodes[]}]`, `metrics[{label, value \| null}]`, `gallery[{image, alt}]`, `duration`, `client`, `live_url`, `github_url`, `related_projects[]` |
| `GET /services` | flat list sorted by group then id: `slug`, `method`, `title`, `description`, `deliverables[]`, `stack[]`, `group{slug, name, sort}` |
| `GET /blogs`, `/blogs/:slug` | stable `slug`, `title`, `excerpt`, HTML `content` (headings h2/h3, code as `<pre><code class="language-x" data-filename="…">`; the front end sanitises it again), `cover_image` + `cover_alt`, `category{slug,name}`, `tags[]`, `published_at`, `updated_at`, `reading_time`, `is_sample`. The full post adds `related_posts[]` |
| `GET /testimonials` | `name`, `role`, `company`, `quote`, `scope`, `checks[]`, `avatar`, `is_sample` |
| `GET /faqs` | `question`, `answer` (plain text: it is copied verbatim into `FAQPage`) |
| `POST /contact` | body `{ name, email, phone?, type, message, website? }` (`website` = honeypot: answer 201, store nothing). 201 on success, 422 with `errors{field: [message]}` (shown on the fields), anything else is "500 — Retry". Escape all input server-side; the client already refuses HTML |
| Listings | Pagination (`pagination.last_page`) so the prerenderer can enumerate every item |

**Slug changes:** a slug must never change silently. If it must, the backend records the old slug and the frontend build emits a `308` redirect (`vercel.json` `redirects`, generated in phase 6).

---

## 8. Publishing workflow

Content is baked in at build time, so publishing must trigger a rebuild:

1. Create a **Vercel Deploy Hook** for the production branch.
2. Laravel calls it (queued job) whenever a project, post, setting or FAQ is created, updated, published or deleted.
3. Vercel rebuilds (about 1 minute). New URLs appear in the regenerated `sitemap.xml`.

Until the API is live (`VITE_USE_MOCK=true`), the build prerenders the mock data.

---

## 9. Performance & Core Web Vitals

Rankings use field CWV (LCP, INP, CLS). Targets: Lighthouse ≥ 90 on mobile for Performance, Accessibility, Best Practices and SEO.

- **LCP** is the hero name (text), present in the prerendered HTML, so it does not wait for JS.
  - The display font of the page's language is preloaded (`<link rel="preload" as="font">`, injected by `scripts/prerender.js`), so the name paints in its real face sooner.
  - The canvas, WebGL and GSAP layers mount only after idle and are never LCP candidates.
- **CLS:** layout never depends on JavaScript:
  - Fonts: self-hosted with `font-display: swap`.
  - Name: one line per row (`white-space: nowrap`) with a line-height tied to the font size, so a font swap cannot reflow it.
  - Portrait: explicit `width`/`height`.
  - Live values (clock, telemetry, uptime) fill slots that are already reserved.
- **INP:** heavy visuals are deferred, written outside React (rAF + CSS variables), paused with the tab and governed by the device tier and an FPS guard.
- **Hydration waterfall:** each prerendered page carries `modulepreload` for its own lazy page chunk (from the Vite manifest), so hydration does not wait for entry → page chunk.
- **JS budget:** the plan targets < 170 KB gzip of initial JS. Measure it with `npm run size` after a build.

  | | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
  | --- | --- | --- | --- | --- | --- |
  | Initial JS: entry + modulepreload (gzip) | | | 192.4 KB | 192.9 KB | 192.7 KB |
  | Home page, initial + page chunk (gzip) | 204.4 KB | 201.1 KB | 203.0 KB | 204.7 KB | 205.0 KB |
  | Initial CSS (gzip) | | | 28.9 KB | 34.7 KB | 38.9 KB |
  | Deferred (idle / interaction / route) | 17.6 KB | ~107 KB | 121.3 KB | 146.6 KB | 383.8 KB |

  Measured on a client-only build (`npx vite build && npm run size`): after the full `npm run build`, `dist/index.html` is the prerendered home page, whose `modulepreload` for the page chunk makes "initial" equal "home".

  Phase 4 kept the initial JS flat (+0.5 KB: the new journey station, the curtain's View Transition branch, `<Seo status>`). Three things were done to get there: the phase-4 strings ship with their chunks, new icons are inline SVG (`LineIcon`) because `react-icons/lu` is one module that lives in the entry, and the filter FLIP is a small WAAPI hook instead of motion's `domMax`, whose separate chunk made the bundler split motion's core out of the entry (+1.2 KB). CSS grows because every section style is global by rule (prerendered pages must be styled before any chunk loads).

  Phase 5 lowered the initial JS (the footer became a lazy chunk). The deferred total jumps because it now includes Shiki (core, JavaScript engine, six grammars, two themes), DOMPurify, embla, react-hook-form and zod. None of it loads up front: Shiki and DOMPurify load only on a client-side navigation to an article (prerendered articles ship finished HTML), embla near the testimonials, and the form libraries with the contact chunk.

  The hero did not grow the initial bundle: motion's animation features moved to an async chunk, and GSAP, the mesh, WebGL, the cursor and the intro all load deferred. The remaining gap to 170 KB is react-dom, react-router, i18next, TanStack Query and axios; it is Phase 6 work.

### The boot intro and crawlers

- The intro is **never** in the prerendered HTML.
  - The pre-paint script sets `data-boot="play"` only for the first home-page view of a session, and a CSS cover hides the page until the app mounts.
  - The content underneath is fully rendered, and without JavaScript nothing is covered.
  - A CSS failsafe lifts the cover after 3.5 s if the app never starts.
- Deep links (case studies, articles) and returning visitors never see it.
- Googlebot renders with JavaScript, but it reads the DOM rather than the pixels, and the DOM is complete from the first byte.
- `src/entry-server.test.jsx` asserts that the name, summary, actions and portrait `alt` are in the generated HTML, and that no intro or canvas markup is.

---

## 10. Google Search Console: launch checklist

- [ ] Set `VITE_SITE_URL` (Vercel env + `.env.example` default) to the final domain and rebuild.
- [ ] Verify the **Domain property** via DNS TXT record (covers http/https and subdomains).
- [ ] Redirect every alternate host (`www`/apex, `*.vercel.app`) to the canonical domain with `308`.
- [ ] Submit `https://<domain>/sitemap.xml`.
- [ ] URL Inspection → "Test live URL" for `/`, `/en`, one case study and one article (rendered HTML must show the content).
- [ ] Check hreflang errors (none expected) and the Page indexing report weekly for the first month.
- [ ] Rich Results Test on home (Person), an article (BlogPosting) and the FAQ (FAQPage).
- [ ] Add the site to Bing Webmaster Tools (it can import from Search Console).
- [ ] `npm run data:todo` reports zero placeholders.

---

## 11. Roadmap by phase

| Phase | SEO work |
| --- | --- |
| 1 ✅ | SSG pipeline, `<Seo>` head manager, canonical/hreflang/OG/Twitter, Person + WebSite JSON-LD, sitemap, robots, real 404, hydration tests |
| 2 ✅ | Hero LCP discipline (text LCP + display-font preload, canvas/WebGL/GSAP after idle), intro kept out of the HTML, page-chunk `modulepreload`, responsive AVIF/WebP pipeline (`npm run images`) |
| 3 ✅ | Semantic section headings, about/experience content indexable in both languages |
| 4 ✅ | Case-study JSON-LD + breadcrumbs (real projects only), samples noindex + out of the sitemap, `<Seo status>`, filter URLs canonicalised, services `ProfessionalService` / `OfferCatalog`. Per-project OG images move to phase 6 (needs raster covers). |
| 5 ✅ | BlogPosting (real posts only) + FAQPage JSON-LD, build-time article processing (sanitise + TOC anchors + Shiki), related posts, sample posts and the all-sample `/blog` kept noindex and out of the sitemap |
| 6 | Lighthouse audit (real numbers), JS budget work, slug redirects, OG image generation, final Search Console checklist |
