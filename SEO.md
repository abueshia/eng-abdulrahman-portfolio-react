# SEO Strategy & Implementation

SEO is a top priority for this portfolio: the domain is verified in Google Search Console, and every page has to be fully indexable in **Arabic and English**. This document is the source of truth for how pages get discovered, rendered, described and measured. Update it in the same commit as any change to routing, metadata, structured data or the build pipeline. The keyword map lives in [`SEO_KEYWORDS.md`](SEO_KEYWORDS.md).

**Canonical origin:** `https://eng-abdulrahman-abu-eisha.vercel.app` (`VITE_SITE_URL`). Every absolute URL the build writes comes from that one variable: canonical, hreflang, `og:url`, JSON-LD, `sitemap.xml`, `robots.txt` and `llms.txt`. It must be the exact origin verified in Search Console (§10).

---

## 1. Principles

1. **Crawlers get real HTML.** Every indexable URL is prerendered at build time (SSG), with final content, `<title>`, meta tags and JSON-LD. Search engines and social scrapers never depend on JavaScript.
2. **One URL per language.** Arabic at the root (`/…`), English under `/en/…`. Every page carries its canonical URL and hreflang alternates.
3. **Real status codes.** Unknown URLs get an HTTP `404` (from `404.html`), not a `200` with a client-rendered "not found".
4. **The same data path in every mode.** The prerenderer uses the same services as the browser (mock adapter or live Laravel API), so what is indexed is exactly what users see.
5. **Content beats tricks.** Fast pages, semantic markup (`<header>`, `<main>`, `<article>`, one `<h1>`), descriptive links and accurate structured data. No hidden text, no keyword stuffing, no superlatives.

---

## 2. Rendering: build-time prerendering (SSG)

### Decision

The site is deployed as a **static, prerendered SPA**. SSR at request time was rejected: content changes only when the owner publishes, a static CDN is cheaper and faster, and the hosting stays simple (Vercel static). The trade-off is that **new content needs a rebuild**. See §8.

### Pipeline (`npm run build`)

| Step | Command | Output |
| --- | --- | --- |
| 1. Client bundle | `vite build` | `dist/` (HTML shell, JS, CSS, public files) |
| 2. Server bundle | `vite build --ssr src/entry-server.jsx --outDir dist-ssr` | `dist-ssr/entry-server.js` (deleted after step 3) |
| 3. Generate | `node scripts/prerender.js` | `dist/**/index.html`, `dist/404.html`, `dist/sitemap.xml`, `dist/robots.txt`, `dist/llms.txt` |
| 4. Verify | `node scripts/verify-dist.js` | Fails the build if a page lacks its CSS/JS, references a missing file, lacks its SEO head, has invalid JSON-LD, if the home page is `noindex`, if the sitemap lists a non-indexable URL, or if anything mentions localhost |

`npm run build:spa` runs only step 1 (client-only debugging).

### How a page is rendered (`src/entry-server.jsx`)

1. `react-dom/static` `prerender()` renders the route through React Router's static handler. It waits for lazy page chunks.
2. Queries never fetch on the server. After each pass, the queries the tree declared are fetched through the normal services, and rendering repeats until no new queries appear (max 4 passes). **Pages need no SSR-specific code.**
3. The query cache is dehydrated into the page as `window.__PRERENDER__ = { path, queryState }`.
4. `<Seo>` reports its tags to a head collector (`HeadContext`), and they are serialized into `<head>`.

### Hydration contract (`src/main.jsx`)

- **When it hydrates:** only if `__PRERENDER__.path` equals the current pathname and the URL was not rewritten by the saved-locale rule. Otherwise (`404.html`, `/` → `/en` rewrite) it discards the markup and renders fresh.
- **Strings first:** the page language's base strings load before the first render. Each language is a separate chunk, `modulepreload`ed by the page, so this costs no round-trip.
- **Test:** `src/app/hydration.test.jsx` hydrates real prerendered output and fails on any hydration mismatch.

### Pitfalls already solved (keep them solved)

| Pitfall | Fix |
| --- | --- |
| React Fizz outlines Suspense boundaries > ~12.8 KB into a hidden `<template>` swapped in by an inline script, so non-JS crawlers would see "Loading…" | `prerender(..., { progressiveChunkSize: Infinity })`; tested (`<!--$?-->` must not appear) |
| An errored query looks "pending" again on the next pass (`retryOnMount`), so a 404 page rendered its loading state | `retryOnMount: false` for the server query client |
| Theme differs between prerender (`dark`) and a light-mode visitor | Theme read via `useSyncExternalStore` with a server snapshot; the effect never overwrites `<html data-theme>`; tested |
| Browser-only APIs during render | `window`/`document` only inside effects, event handlers or guarded helpers |
| Router created before the saved-locale rewrite | `createAppRouter()` factory called in `main.jsx` after the rewrite |
| Lingering timers keep Node alive after generation | Query cache cleared after dehydration; script exits explicitly |
| The page emptied below the hero right after load (light theme, reduced motion, or any build older than 5 minutes). Anything that re-renders above a section that has not hydrated yet makes React discard its prerendered HTML and render it on the client; that render waited for `whenNeeded()`, which was watching the deleted element: a deadlock | Three fixes, all tested in Chrome: (1) `whenNeeded()` also resolves when its element leaves the DOM; (2) nothing above the sections changes after hydration: `ThemeContext` holds only stable setters (`useTheme()` reads the theme store itself), and `PageTransition` no longer subscribes to reduced motion (MotionConfig already makes the curtain instant); (3) hydrated queries are stamped fresh (`markFresh`), so a prerendered page never refetches on load. Rule: never subscribe a component above the sections to a value that differs between server and client |
| A tab opened before a redeploy requests chunks that no longer exist (the "raw HTML" symptom) | `vite:preloadError` triggers one guarded reload; HTML is never cached (`max-age=0, must-revalidate`) |

### Sections: lazy, prerendered, hydrated on demand

Every home section is a `React.lazy` chunk inside `<Suspense fallback={null}>`. The prerenderer waits for it, so its full text is in the HTML.

- **On demand:** in the browser, the chunk (and so the hydration) of a section waits until the section is about to be seen (one viewport ahead) or the visitor first interacts (`src/lib/hydrate-on-demand.js`). The footer follows the same rule. Until then React keeps the server HTML untouched: visible, readable, crawlable.
- **Why:** hydrating the whole ~3,000-node page at once was most of the mobile blocking time.
- **Phones and tablets:** sections also use `content-visibility: auto`, so off-screen sections skip layout and paint, but stay in the DOM, the accessibility tree and find-in-page.

Content rules that keep sections indexable:

- Every number, skill, role, date and paragraph is text in the HTML. Decorative layers (odometer reels, the AUTH gate, the constellation SVG, the graph gutter) are `aria-hidden`, and their default state is the final one.
- Skills: all tab panels are in the HTML (inactive ones use `hidden`), and each skill carries its proficiency (`role="meter"`) and years as text.
- Projects: every case file is an `<article>` with its title (an `<h3>` link to the case study), summary, role, stack and metrics. Filters (`?type=…&tech=…`) apply after hydration only, and the prerendered list is always the full one.
- Services: every service is a native `<details>` (works without JavaScript, opens on find-in-page). Closed contracts are still in the HTML.
- FAQ: native `<details name="faq">`; every answer is in the HTML.
- Testimonials: every review is text in a native scroll-snap row; embla (lazy) only enhances it. The star rating is an SVG image named "Rated 4 out of 5" (text, not markup), the avatar a photo with `alt` or a decorative generated monogram. The "Write a review" button is a real `<button>` in the HTML; the review form dialog is a lazy chunk that is never prerendered (tested: no `<dialog>` in the generated HTML). Only `approved` records are listed, so a visitor submission never reaches the HTML before moderation and a rebuild.
- Contact: the whole form, the live request preview and the direct channels are prerendered.
- No browser-dependent values in markup:
  - Dates are formatted by hand (`2024·03`), never with `Intl`.
  - Clocks fill a slot already sized by a hidden `--:--` placeholder, so no layout shift.
- Feature UI strings ship with their chunks (`src/i18n/work.js`, `src/i18n/sections.js`), not with the initial bundle.

**Rule for new code:** anything that renders on a page must be renderable in Node. Media queries go through `useMediaQuery` (server snapshot), and canvas/GSAP/Lenis work belongs in effects. Run `npm run build` before considering a feature done.

---

## 3. URLs, languages and duplicates

| Page | Arabic (default, `x-default`) | English |
| --- | --- | --- |
| Home | `/` | `/en` |
| Case study | `/projects/:slug` | `/en/projects/:slug` |

- **No trailing slashes** (`vercel.json` → `"trailingSlash": false`, which 308-redirects `/en/` to `/en`).
- **Slugs are shared across languages**, so alternates are derived by toggling the `/en` prefix.
- **hreflang on every page:** `ar`, `en` and `x-default` (Arabic), always absolute and reciprocal. Also repeated in `sitemap.xml`.
- **Canonical is self-referencing** per language. A page never canonicalizes to the other language.
- **Language detection never redirects bots.** The only redirect is client-side (`/` → `/en` when a *returning visitor* last chose English). Crawlers have no `localStorage`, so they always get the URL they asked for. No `Accept-Language` or IP redirects, ever.
- **Filter state in the URL** (`/?type=saas&tech=laravel`) uses query strings. Filtered views keep the canonical of the unfiltered page, and the filter controls are buttons, not links.
- **The blog was removed** (phase 5 follow-up). `/blog` URLs render the 404 page with a 404 status. If it returns, it gets its own row here and its own routes in the sitemap.

---

## 4. Metadata (`<Seo>`)

Every page renders exactly one `<Seo>` (`src/components/ui/Seo.jsx`). The tags are built by pure helpers in `src/utils/head.js`, shared by the prerenderer and the browser. Managed tags carry `data-seo` and are replaced on navigation.

| Tag | Source |
| --- | --- |
| `<title>` | Home: `settings.seo.meta_title` used as is (`fullTitle`), ≤ ~60 characters, fallback `meta.defaultTitle`. Other pages: `meta.titleTemplate` (`%s \| عبدالرحمن أبو عيشة` / `%s \| Abdulrahman Abu Eisha`). Unique per page and language (tested). |
| `meta description` | Home: `settings.seo.meta_description` (≈ 155 characters: name, 4 years, Laravel/PHP, React, payments, REST APIs, Cairo). Case studies: `summary`. Fallback `meta.defaultDescription`. |
| `robots` | `index, follow, max-image-preview:large`; `noindex, follow` on sample case studies (`is_sample`); `noindex, nofollow` on the 404 page |
| HTTP status (prerender) | `<Seo status>`: 200 by default, `404` on the not-found page. Not derived from `noindex` (sample pages are noindex but real 200 pages). |
| `link canonical` / `alternate hreflang` | See §3 |
| Open Graph | `og:type` (`profile` on home, `article` on case studies), `og:title`, `og:description`, `og:url`, `og:image`, `og:site_name`, `og:locale` + `og:locale:alternate` |
| Twitter | `summary_large_image` card mirroring OG |

**OG images:** 1200×630 JPG/PNG under 300 KB. Default: `/images/og-cover.jpg` (final). Case studies use their `cover_image` when it is a raster image; the generated SVG sample covers fall back to the default, since social scrapers do not render SVG.

---

## 5. Structured data (JSON-LD)

Passed to `<Seo jsonLd={…}>`. Builders live in `src/utils/structured-data.js` (pure, tested).

| Page | Schema | Status |
| --- | --- | --- |
| Home | `ProfilePage` (`mainEntity` → Person, `isPartOf` → WebSite) | ✅ |
| Home | `Person`. See the field list below | ✅ Phase 6 (identity fields) |
| Home | `WebSite` (name, description, publisher → Person) | ✅ |
| Home | `ProfessionalService` (founded by the Person, `address` Cairo/EG, `areaServed`) with `hasOfferCatalog`: one `OfferCatalog` per service group, each service an `Offer` → `Service` (name, description, `serviceType`, provider → Person) | ✅ |
| Home | `FAQPage` (every visible question with its `acceptedAnswer`), only while the FAQ section is visible | ✅ (13 questions) |
| Case study | `CreativeWork` (or `SoftwareSourceCode` with `codeRepository` when `github_url` is public) authored by the Person + `BreadcrumbList`. **Real projects only**: `is_sample` projects get none. | ✅ |
| Testimonials | None on purpose: self-serving reviews are ignored by Google (and against its review snippet guidelines), and samples must never be marked up. Cards show star ratings, but there is no `Review`, no `AggregateRating`, no `reviewRating`/`ratingValue` anywhere, ever (tested on the JSON-LD graph and on the whole HTML). | — |

`Person` fields:

- `name`
- `alternateName`: common spellings, from `settings.general.alternate_names`. They are also shown in a visible "Also written as" line in About, never as hidden text.
- `description`: the meta description.
- `jobTitle`: [engineer title, "CEO, iCode Tech"].
- `worksFor`: Organization, with `url` once `company.url` exists.
- `image`.
- `sameAs`: GitHub, LinkedIn, Facebook.
- `knowsAbout`.
- `knowsLanguage`: ar, en.
- `address`: PostalAddress with the city and country only (Cairo, EG), never the street.
- `areaServed`: Egypt and the Arab world.

Rules:

- Only absolute `https` URLs; placeholder or non-URL values are filtered out.
- `sameAs` lists identity profiles only, never contact channels like WhatsApp.
- Mark up only content that is visible on the page.
- Validate with the [Rich Results Test](https://search.google.com/test/rich-results) and the [Schema Markup Validator](https://validator.schema.org/) before every release.

---

## 6. Crawling & indexing

- **`sitemap.xml`** is generated from the same route list that is prerendered: every route × locale, with `xhtml:link` alternates (ar, en, x-default) and `lastmod` (from `updated_at` / `published_at`, else the build date). Routes flagged `sitemap: false` are generated but not listed: sample case studies (`is_sample: true`), which are also `noindex`. Today it lists `/` and `/en`.
- **Sample projects:** reachable (links work, pages are prerendered) but invisible to search engines. When the API returns a project without `is_sample`, it is indexed, listed and described with JSON-LD automatically.
- **Hidden sections** (`settings.sections_visibility`) are not rendered, not linked and not in the FAQPage.
- **`robots.txt`:** allow all, plus the sitemap location.
- **`/llms.txt`** (GEO): a short, factual Markdown brief generated from the API data at build time (`src/utils/llms.js`): a one-sentence definition ("Abdulrahman Abu Eisha (عبدالرحمن أبو عيشة) is a Full-Stack Software Engineer based in Cairo, Egypt, with 4 years of experience, and CEO of iCode Tech."), identity, pages, services, FAQ, profiles and contact. Sample projects and phone numbers are never listed.
- **404:** `dist/404.html` (Arabic, `noindex`) is served by Vercel with a real `404` status for any URL that was not generated. There is no catch-all rewrite, so there are no soft 404s.
- **Internal linking:** real `<a href>` links (`LocalizedLink`) for every page. Never navigate with `onClick` alone. Case studies link to related projects and the next case.
- **Images:**
  - Descriptive `alt` (from the API, localized), explicit `width`/`height`.
  - AVIF/WebP with `srcset` via `npm run images`, lazy below the fold.
  - The hero portrait's `alt` is "{name}, {job title}" in each language. It carries `fetchpriority="high"`, because on phones it is the largest element in the first viewport (the LCP element; on desktop the name is).
- **Quotable copy (GEO):** the hero states who and where in one sentence under the `<h1>` ("Full-Stack Software Engineer and back-end developer based in Cairo, Egypt…"), and About has a factual paragraph about working from Cairo with clients in Egypt and the Arab world.

---

## 7. Laravel API requirements (SEO contract)

The backend must provide, per locale:

| Resource | Fields needed for SEO |
| --- | --- |
| `GET /settings` | `general.owner_name`, `general.site_name`, `general.job_title`, `general.avatar`, `general.socials[].url` (absolute), `general.alternate_names[]`, `general.address{locality, country, country_code}` (city level only), `general.area_served[]`, `general.company{name, role, url?}`, `general.years_of_experience`, `seo.meta_title` (≤ 60 chars), `seo.meta_description` (≈ 155 chars), `seo.og_image`, `hero.summary` |
| `GET /projects`, `/projects/:slug` | stable `slug`, `title`, `summary` (≤ 160 chars), `cover_image` (absolute or root-relative) + `cover_alt`, `published_at`, `updated_at`, `is_sample` (boolean). Summary items also carry `type`, `year`, `role`, `preview_image`, `metrics[]`, `technologies[]`. The full record adds `problem`, `solution`, `challenges[{title, body}]`, `architecture{nodes[{id,label,layer,note}], edges[{from,to,kind,label}]}`, `decisions[{title, body, nodes[]}]`, `metrics[{label, value \| null}]`, `gallery[{image, alt}]`, `duration`, `client`, `live_url`, `github_url`, `related_projects[]` |
| `GET /services` | flat list sorted by group then id: `slug`, `method`, `title`, `description`, `deliverables[]`, `stack[]`, `group{slug, name, sort}` |
| `GET /testimonials` | **Approved records only:** `name`, `role`, `company`, `quote`, `rating` (1-5), `avatar` (https or root-relative), `status` (`approved`), `scope`, `checks[]`, `is_sample` |
| `POST /testimonials` | `multipart/form-data` `{ name, role, company?, rating, message, avatar?, consent, hp }` → `201` with `data.status = "pending"` (never published directly), `422` with `errors{field: [message]}`. Full contract, moderation and spam rules: `README.md` → "Testimonials API contract". Approving a review triggers the Deploy Hook (§8) |
| `GET /faqs` | `question`, `answer` (plain text: it is copied verbatim into `FAQPage` and `llms.txt`) |
| `POST /contact` | body `{ name, email, phone?, type, message, website? }` (`website` = honeypot: answer 201, store nothing). 201 on success, 422 with `errors{field: [message]}` (shown on the fields), anything else is "500 — Retry". Escape all input server-side; the client already refuses HTML |
| Listings | Pagination (`pagination.last_page`) so the prerenderer can enumerate every item |

**Slug changes:** a slug must never change silently. If it must, the backend records the old slug, and a `308` redirect is added to `vercel.json` `redirects`.

---

## 8. Publishing workflow

Content is baked in at build time, so publishing must trigger a rebuild:

1. Create a **Vercel Deploy Hook** for the production branch.
2. Laravel calls it (queued job) whenever a project, setting, service, FAQ or testimonial is created, updated, published or deleted.
3. Vercel rebuilds (about 1 minute). New URLs appear in the regenerated `sitemap.xml`.

Until the API is live (`VITE_USE_MOCK=true`), the build prerenders the mock data, and in production the contact form (`VITE_CONTACT_RELAY`) and the "Write a review" form (`VITE_REVIEW_RELAY`, photo not sent) relay to WhatsApp.

---

## 9. Performance & Core Web Vitals

Rankings use field CWV (LCP, INP, CLS). Targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms.

- **LCP:**
  - Desktop: the hero name (text), present in the prerendered HTML. The display font of the page's language is preloaded (`<link rel="preload" as="font">`, injected by `scripts/prerender.js`).
  - Phones: the portrait image (`fetchpriority="high"`).
  - The canvas, WebGL and GSAP layers mount only after idle and are never LCP candidates.
- **CLS:** layout never depends on JavaScript:
  - Fonts: self-hosted with `font-display: swap`.
  - Name: one line per row (`white-space: nowrap`) with a line-height tied to the font size, so a font swap cannot reflow it.
  - Portrait: explicit `width`/`height`.
  - Live values (clock, telemetry, uptime) fill slots already sized by a hidden placeholder.
  - Font-swap shift was measured at ≈ 0.001, so no fallback-metric `@font-face` overrides are needed.
- **INP / TBT:**
  - Sections hydrate on demand (§2), and off-screen sections skip layout on phones (`content-visibility`).
  - Heavy visuals are deferred, written outside React (rAF + CSS variables), paused with the tab and governed by the device tier and an FPS guard.
  - On touch screens below the high tier, the service mesh is a still frame. Entry-level touch devices (≤ 4 cores or ≤ 4 GB) get the `low` tier: static frames only.
- **Hydration waterfall:** each prerendered page carries `modulepreload` for its page chunk and for its language's strings.
- **JS budget:** < 170 KB gzip of initial JS for the home page (`npm run size` after a build).

  | | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
  | --- | --- | --- | --- | --- |
  | Home page initial JS: entry + modulepreload, after `npm run build` (gzip) | 203.0 KB | 204.7 KB | 204.1 KB | **169.4 KB** |
  | Initial CSS (gzip) | 28.9 KB | 34.7 KB | 37.3 KB | 37.4 KB |

  Visitor reviews ("Write a review", after phase 6): initial JS 169.4 → 167.8 KB, initial CSS 37.4 → 38.8 KB. The feature adds nothing to the initial JS: the form dialog (react-hook-form + zod, ≈ 5.2 KB gzip) and `POST /testimonials` (`testimonials-submit.js`) are lazy chunks. The 1.6 KB drop is the bundler regrouping the initial chunks (fewer, better-compressed files), not a saving from this feature.

  Phase 6 removed ≈ 35 KB from the first load without dropping features:
  - axios (≈ 21 KB) now loads on the first real request. A prerendered page hydrates from embedded data and usually never fetches.
  - Lenis (≈ 5 KB) loads on mount.
  - tailwind-merge (≈ 9 KB) was replaced by plain `clsx`, with explicit variant props where classes used to conflict.
  - Only the page language's base strings ship (≈ 3 KB).

- **Lighthouse (phase 6).** Local production build (`vite preview`), Lighthouse 13.6, simulated throttling. First visit, so the boot intro plays. Three runs each, range shown:

  | Page | Device | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | `/` | Mobile | 47–49 | 94 | 100 | 100 | 6.3–6.5 s | 1.6–1.8 s | 0 |
  | `/en` | Mobile | 47–52 | 97–100 | 100 | 100 | 6.6–7.0 s | 1.2–1.7 s | 0 |
  | `/` | Desktop | 70–77 | 97 | 100 | 100 | 1.1–1.5 s | 430–520 ms | ≤ 0.01 |
  | `/en` | Desktop | 72–82 | 97–100 | 100 | 100 | 1.4–1.7 s | 300–480 ms | ≤ 0.013 |

  Before phase 6, mobile was 37–42 (TBT ≈ 2.6 s, CLS 0.18 for returning visitors) and desktop 70–71.

  **Mobile is below the 90 target, and this is the honest number.** Under Lighthouse's 4× CPU throttle:
  - The remaining cost is the first layout of the hero itself (~0.6 s), its relayout when the web fonts swap in, and the hydration of the hero and navigation.
  - LCP is simulated from that main-thread time; the observed LCP in the same runs is ≈ 1.2 s.
  - The accessibility deduction on `/` is axe catching the boot intro's typed lines mid-fade (decorative, transient).
  - axe-core (WCAG 2.2 AA + best practices) reports 0 violations on every main page in both themes once the page settles.

  Going further means changing the hero itself (fewer layers, no intro on phones), which is a design decision, not a fix. Measure field data (Search Console → Core Web Vitals, PageSpeed Insights) after launch before deciding.

### The boot intro and crawlers

- The intro is **never** in the prerendered HTML.
  - The pre-paint script sets `data-boot="play"` only for the first home-page view of a session, and a CSS cover hides the page until the app mounts.
  - The content underneath is fully rendered, and without JavaScript nothing is covered.
  - A CSS failsafe lifts the cover after 3.5 s if the app never starts.
- Deep links (case studies) and returning visitors never see it.
- Googlebot renders with JavaScript, but it reads the DOM rather than the pixels, and the DOM is complete from the first byte.
- `src/entry-server.test.jsx` asserts that the name, summary, actions and portrait `alt` are in the generated HTML, and that no intro or canvas markup is.

---

## 10. Google Search Console

### Domain

`VITE_SITE_URL` must equal the property verified in Search Console: `https://eng-abdulrahman-abu-eisha.vercel.app` today. If the site moves to a custom domain:

1. Change `VITE_SITE_URL` in Vercel (Production) and in `.env.example`.
2. Rebuild. Every canonical, hreflang, `og:url`, JSON-LD id, sitemap entry, `robots.txt` and `llms.txt` follows automatically, and `npm run build` fails if any of them still points elsewhere.
3. Redirect the old host to the new one with `308`, add the new property in Search Console, and use **Settings → Change of address**.

### Verify ownership

- **HTML file (in place):** `public/googlec00db20ccafa5da5.html` is deployed at `/googlec00db20ccafa5da5.html` (the build serves it verbatim; no rewrite touches it). Keep it in `public/` forever: removing it un-verifies the property.
- **DNS (for a custom domain):** add the Domain property and its `TXT` record at the DNS provider. It covers every subdomain and protocol.

### Submit and inspect

1. **Sitemaps → Add** `https://eng-abdulrahman-abu-eisha.vercel.app/sitemap.xml`. Status should become "Success", with 2 discovered URLs today (`/` and `/en`), more once real projects exist.
2. **URL Inspection** for `/` and `/en` → **Test live URL** → *View tested page*: the rendered HTML must contain the name, the hero summary and the JSON-LD. Then **Request indexing** for each.
3. Repeat URL Inspection + Request indexing for each real case study as it is published.

### Post-deploy checklist (every release)

- [ ] `npm run build` passed (the verifier ran), and `npm run data:todo` reports nothing blocking.
- [ ] `https://…/` and `/en` load styled. DevTools Network: no 404s, CSS and JS are `200`.
- [ ] `curl -I https://…/assets/<file>.js` shows `cache-control: public, max-age=31536000, immutable`; `curl -I https://…/` shows `max-age=0, must-revalidate` and the security headers.
- [ ] `curl -I https://…/nope` returns `404`; `/googlec00db20ccafa5da5.html`, `/sitemap.xml`, `/robots.txt` and `/llms.txt` return `200`.
- [ ] View source: one `<title>`, description, canonical, three hreflang links, JSON-LD present (no `noindex` on home).
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) on `/` and `/en`: Profile page and FAQ detected, no errors.
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/) on `/` (mobile and desktop): note the numbers, and field data once available.
- [ ] Bing Webmaster Tools: import from Search Console once.

### Follow-up plan

- **Weekly (first two months), then monthly:**
  - **Pages** report (Indexing → Pages): `/` and `/en` indexed. Investigate any "Crawled, currently not indexed", "Duplicate without user-selected canonical" or hreflang issue.
  - **Performance** report: queries and pages. Filter by country (Egypt, Gulf) and compare Arabic vs English queries. Note which phrases from `SEO_KEYWORDS.md` gain impressions and adjust copy honestly.
- **Monthly:**
  - Core Web Vitals report (field data).
  - Enhancements (FAQ, Profile page).
  - Links report.
- **After each content publish:** URL Inspection → Request indexing for the new URL.

---

## 11. Roadmap by phase

| Phase | SEO work |
| --- | --- |
| 1 ✅ | SSG pipeline, `<Seo>` head manager, canonical/hreflang/OG/Twitter, Person + WebSite JSON-LD, sitemap, robots, real 404, hydration tests |
| 2 ✅ | Hero LCP discipline (text LCP + display-font preload, canvas/WebGL/GSAP after idle), intro kept out of the HTML, page-chunk `modulepreload`, responsive AVIF/WebP pipeline |
| 3 ✅ | Semantic section headings, about/experience content indexable in both languages |
| 4 ✅ | Case-study JSON-LD + breadcrumbs (real projects only), samples noindex + out of the sitemap, `<Seo status>`, filter URLs canonicalized, `ProfessionalService` / `OfferCatalog` |
| 5 ✅ | FAQPage JSON-LD, sample content kept noindex and out of the sitemap; the blog was later removed |
| 6 ✅ | Deploy hardening (headers, no catch-all rewrite, post-build verifier, stale-chunk recovery), titles/descriptions from settings, Person identity (`alternateName`, address, `areaServed`), 5 new FAQs, keyword-natural copy, `llms.txt`, initial JS 204 → 169.4 KB, hydration on demand, CLS fix, WCAG AA contrast, Search Console runbook |
| 7 | Laravel API connected; real projects and testimonials (indexable case studies, CreativeWork JSON-LD), Deploy Hook |
