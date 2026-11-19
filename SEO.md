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
- **Filter state in the URL** (projects filters, phase 4) uses query strings. Filtered views keep the canonical of the unfiltered page.

---

## 4. Metadata (`<Seo>`)

Every page renders exactly one `<Seo>` (`src/components/ui/Seo.jsx`). The tags are built by pure helpers in `src/utils/head.js`, which are shared by the prerenderer and the browser. Managed tags carry `data-seo` and are replaced on navigation.

| Tag | Source |
| --- | --- |
| `<title>` | `meta.titleTemplate` (`%s \| عبدالرحمن أبو عيشة` / `%s \| Abdulrahman Abu Eisha`). Home uses `meta.defaultTitle`. Target ≤ 60 chars. |
| `meta description` | Page data (`summary`, `excerpt`, `settings.seo.meta_description`), falling back to `meta.defaultDescription`. Target 120–160 chars. |
| `robots` | `index, follow, max-image-preview:large`, or `noindex, nofollow` on the 404 page |
| `link canonical` / `alternate hreflang` | See §3 |
| Open Graph | `og:type` (`profile` on home, `article` on case studies and posts), `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `og:locale` + `og:locale:alternate` |
| Twitter | `summary_large_image` card mirroring OG |

**OG images:** 1200×630 JPG/PNG under 300 KB, with safe margins for the cropped square previews. Default: `/images/og-cover.jpg` (**missing, see `TODO_REAL_DATA.md`**). Case studies and posts use their `cover_image`. Phase 6 may generate per-page OG images at build time.

---

## 5. Structured data (JSON-LD)

Passed to `<Seo jsonLd={…}>`. Builders live in `src/utils/structured-data.js` (pure, tested).

| Page | Schema | Status |
| --- | --- | --- |
| Home | `Person` (name, jobTitle, image, `sameAs` socials, knowsAbout) + `WebSite`, linked by `@id` | ✅ Phase 1 |
| Home | `ProfilePage` wrapping the Person | Phase 6 |
| Case study | `CreativeWork` / `SoftwareApplication` + `BreadcrumbList` | Phase 4 |
| Article | `BlogPosting` (headline, datePublished, dateModified, author → Person `@id`, image) + `BreadcrumbList` | Phase 5 |
| FAQ section | `FAQPage` | Phase 5 |

Rules: only absolute `https` URLs, so placeholder or non-URL values are filtered out. `sameAs` lists identity profiles only (GitHub, LinkedIn, Facebook), never contact channels like WhatsApp. Mark up only content that is visible on the page. Validate with the [Rich Results Test](https://search.google.com/test/rich-results) before every release.

---

## 6. Crawling & indexing

- **Hidden sections are not published:** with `sections_visibility.blog = false`, `/blog` and its posts are neither prerendered nor listed in the sitemap, they render the 404 page, and the nav link disappears.
- **`sitemap.xml`** is generated from the same route list that is prerendered: every route × locale, with `xhtml:link` alternates and `lastmod` (from `updated_at` / `published_at`, else the build date).
- **`robots.txt`:** allow all, plus the sitemap location.
- **404:** `dist/404.html` (Arabic, `noindex`) is served by Vercel with a real `404` status for any URL that was not generated.
- **Internal linking:** real `<a href>` links (`LocalizedLink`) for every page. Never navigate with `onClick` alone. Case studies link to related projects and the next case. Posts link to related posts.
- **Images:** descriptive `alt` (from the API, localised), explicit `width`/`height`, AVIF/WebP via `npm run images` (phase 2), lazy below the fold, `fetchpriority="high"` only for the LCP image.

---

## 7. Laravel API requirements (SEO contract)

The backend must provide, per locale:

| Resource | Fields needed for SEO |
| --- | --- |
| `GET /settings` | `general.owner_name`, `general.job_title`, `general.avatar`, `general.socials[].url` (absolute), `seo.meta_title`, `seo.meta_description`, `seo.og_image` |
| `GET /projects`, `/projects/:slug` | stable `slug`, `title`, `summary` (≤ 160 chars), `cover_image` (absolute or root-relative), image `alt`, `published_at`, `updated_at` |
| `GET /blogs`, `/blogs/:slug` | stable `slug`, `title`, `excerpt`, sanitised HTML `content`, `cover_image`, `published_at`, `updated_at`, `reading_time` |
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

- **LCP** is the hero name (text), present in the prerendered HTML, so it no longer waits for JS.
- **CLS:** self-hosted fonts with `font-display: swap` and fallback metrics, reserved media dimensions, no layout-shifting banners.
- **INP:** heavy visuals (service-mesh canvas, GSAP) are deferred and paused off-screen.
- **JS budget:** the plan targets < 170 KB gzip initial JS. **Current (Phase 1): ~260 KB gzip**, mostly react-dom, motion, react-router 7, i18next, TanStack Query and axios. Reduction is a Phase 6 task (candidates: lighter router usage, the `motion` mini build for simple cases, deferring axios/i18n bundles).

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
| 2 | Hero LCP discipline (text LCP, canvas after idle), responsive images script, preloading of the hero image |
| 3 | Semantic section headings, about/experience content indexable in both languages |
| 4 | Case-study JSON-LD + breadcrumbs, filter URLs canonicalised, per-project OG images |
| 5 | BlogPosting + FAQPage JSON-LD, article TOC anchors, related-content links |
| 6 | Lighthouse audit (real numbers), JS budget work, slug redirects, OG image generation, final Search Console checklist |
