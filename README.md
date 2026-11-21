# Eng. Abdulrahman Abu Eisha · Portfolio Frontend

Bilingual (Arabic RTL / English LTR) portfolio of **Abdulrahman Abu Eisha**, Full-Stack Software Engineer (PHP · Laravel · React) based in Cairo, Egypt.

Live: <https://eng-abdulrahman-abu-eisha.vercel.app>

The site is a React SPA that is **prerendered at build time** (static HTML for every page and language, then hydrated). Content comes from a Laravel REST API. Until the API is connected, an in-app mock adapter serves the same responses.

- Concept: *"The Visitor Is The Request"*. Scrolling moves an HTTP request through a live system, one station per section (`src/config/journey.js`).
- Engineering rules, design system and phase history: [`AGENTS.md`](AGENTS.md) (Arabic).
- SEO, structured data, Search Console and Core Web Vitals: [`SEO.md`](SEO.md), keyword map in [`SEO_KEYWORDS.md`](SEO_KEYWORDS.md).
- What still needs real data before launch: [`TODO_REAL_DATA.md`](TODO_REAL_DATA.md) and `npm run data:todo`.

## Stack

React 19 · React Router 7 · Vite 8 · Tailwind CSS 4 · TanStack Query 5 · i18next · axios (lazy) · motion (state transitions) · GSAP (scroll scenes, lazy) · Lenis (lazy) · react-hook-form + zod · Vitest + Testing Library · Vercel.

## Getting started

Requirements: Node.js ≥ 20.19.

```bash
npm ci
cp .env.example .env.local   # optional: defaults work for local development
npm run dev                  # http://localhost:5173 (mock API)
```

## Environment variables

Only `VITE_*` variables reach the browser bundle: never put secrets in them. Set them in `.env.local` locally and in the Vercel project settings for deployments.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8000/api/v1` | Base URL of the Laravel API (versioned prefix included). |
| `VITE_USE_MOCK` | `true` | `true`: requests are answered by the mock adapter (`src/services/api/mock`). `false`: requests go to `VITE_API_URL`. |
| `VITE_SITE_URL` | `https://eng-abdulrahman-abu-eisha.vercel.app` | Canonical production origin, no trailing slash. Used for canonical, hreflang, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt` and `llms.txt`. Always the production domain, even for local builds. |
| `VITE_CONTACT_RELAY` | `true` in production builds | Only matters while `VITE_USE_MOCK` is not `false`. The contact form then opens WhatsApp (or the mail app) with the message pre-filled instead of posting to a mock. Set `false` to disable. |
| `VITE_REVIEW_RELAY` | `true` in production builds | Same rule for the "Write a review" form: while `VITE_USE_MOCK` is not `false`, submitting opens WhatsApp (or the mail app) with the review pre-filled. The photo is not sent that way, and the form says so. Set `false` to disable (then `data:todo` blocks). |
| `VITE_MOCK_LATENCY` | `350` | Simulated latency of the mock adapter (ms). |
| `VITE_FX` | `on` | `off` disables every client-only visual layer (intro, canvas, WebGL, GSAP, custom cursor). Content never depends on it. The test suite uses `off`. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with the mock API. |
| `npm run build` | Client build, then server build, then prerendering of every page (`scripts/prerender.js`), then output verification (`scripts/verify-dist.js`). Output: `dist/`. |
| `npm run build:spa` | Client build only (no prerendering). |
| `npm run preview` | Serves `dist/` locally (run after `build`). |
| `npm run lint` | ESLint, zero warnings allowed. |
| `npm run test` | Vitest (unit, component, prerender, hydration and build-verifier tests). |
| `npm run size` | Initial-JS budget report (gzip) for the home page. Run after `build`. Budget: 170 KB. |
| `npm run verify:dist` | Re-runs the post-build checks on `dist/`. |
| `npm run data:todo` | Lists what still blocks publishing (samples on visible sections, missing real data). Exits 1 while anything blocks. |
| `npm run images` | Regenerates the portrait variants (AVIF/WebP) from `public/images/profile-cutout.png`. Also runs automatically in `dev` and `build`. |
| `npm run visuals` | Regenerates the SVG screens of the sample case studies. |
| `npm run format` | Prettier. |

Before merging, `npm run lint`, `npm run test` and `npm run build` must all pass with no warnings.

## Project structure

```text
src/
  entry-server.jsx   Prerender entry (Node, build time only)
  main.jsx           Browser entry: locale, hydration, stale-deploy recovery
  app/               App, router, query client, prerender state
  components/        ui/ (atoms) and layout/ (shell, navbar, footer, global layers)
  features/          One folder per section: components/ hooks/ lib/ fx/ (lazy GSAP directors)
  pages/             Route pages (lazy)
  services/api/      HTTP layer: lazy axios client, envelope unwrapping, services, mock adapter
  data/mock/         Bilingual mock data mirroring the Laravel responses
  i18n/              i18next setup; base strings per language load as separate chunks
  lib/ hooks/ context/ utils/ config/ styles/
scripts/             prerender, verify-dist, images, bundle report, data report, visuals
public/              Static files served as is (CV, images, Search Console verification file)
```

## Deploying to Vercel

`vercel.json` pins the build. No dashboard overrides are needed:

- Framework preset: none (`"framework": null`). Install `npm ci`, build `npm run build`, output `dist`.
- Every route is a static file: `/` → `dist/index.html`, `/en` → `dist/en/index.html`, `/projects/:slug` → `dist/projects/:slug/index.html`. There is **no catch-all rewrite**: unknown URLs get `dist/404.html` with a real `404` status, and files under `public/` (CV, images, the `google….html` verification file) are served as they are.
- Headers: hashed `/assets/*` files are cached for a year (`immutable`); HTML revalidates on every request. Security headers apply site-wide: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`.
- The build fails if any generated page is missing its stylesheet or module script, references a file that is not in `dist/`, lacks its SEO head, or if the sitemap lists a URL that is not indexable.

Deployment checklist:

1. Set the environment variables in Vercel (Production): `VITE_SITE_URL` (the domain verified in Search Console), plus `VITE_USE_MOCK=false` and `VITE_API_URL` once the API is live.
2. Content is baked in at build time. Every publish in the Laravel admin must trigger a rebuild through a **Vercel Deploy Hook** (see `SEO.md` §8).
3. After deploying, run through the post-deploy checklist in `SEO.md` §10.

## Connecting the Laravel API (phase 7)

Components never call axios or import mock data. They use hooks, which call the services in `src/services/api/*.service.js`, which call one HTTP client. Going live is a configuration change:

1. Implement the endpoints the mock serves, with the same envelope:
   `{ code, success, message, data, pagination? }`. Errors use the same envelope; `422` carries `errors: { field: [message] }`.
   Endpoints: `GET /settings`, `/home`, `/projects`, `/projects/{slug}`, `/technologies`, `/experiences`, `/credentials`, `/services`, `/testimonials`, `/faqs`, `/stats`, `POST /contact` and `POST /testimonials` (see the testimonials contract below).
   The fields each one must return (including the SEO contract) are listed in `SEO.md` §7. The mock handlers in `src/services/api/mock/handlers.js` and the data in `src/data/mock/` are the reference responses.
2. Every request carries `?lang=ar|en` and `Accept-Language`. Return localized fields for that language.
3. Set `VITE_API_URL` and `VITE_USE_MOCK=false` in Vercel and rebuild. The contact form then posts to `POST /contact` and the review form to `POST /testimonials` (both WhatsApp relays switch off by themselves).
4. Replace the sample content (`is_sample: true` on projects and testimonials) with real records, or hide those sections through `settings.sections_visibility`. `npm run data:todo` must report nothing blocking.
5. Add the Vercel Deploy Hook call to the backend's publish events.

## Testimonials API contract

Visitors can submit a review from the Testimonials section ("Write a review"). A submission is **never published directly**: it is stored as `pending`, the owner moderates it, and only `approved` reviews are listed (and prerendered, after the Deploy Hook rebuild).

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/testimonials?lang=ar\|en` | Approved reviews only, localized. Pending and rejected records must never appear here (the client also drops any record whose `status` is not `approved`). |
| `POST` | `/testimonials` | A visitor submission, `multipart/form-data`. Creates a `pending` record. |

### `GET /testimonials` item

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | |
| `name` | string \| null | Plain text. |
| `role` | string | Job title, plain text. |
| `company` | string \| null | |
| `quote` | string | The review text (`message` on submission), plain text. |
| `rating` | int 1-5 | Shown as stars on the card. Never emitted as structured data. |
| `avatar` | string \| null | Absolute `https://` or root-relative URL of the moderated, re-encoded photo. Without it the card shows a generated monogram. |
| `status` | `approved` | Always `approved` in this listing. |
| `is_sample` | bool | Only for placeholder records. |
| `scope`, `checks[]` | optional | Display extras. |

### `POST /testimonials` request

| Field | Rules (Laravel) |
| --- | --- |
| `name` | `required\|string\|min:2\|max:60`, plain text (reject markup) |
| `role` | `required\|string\|min:2\|max:80`, plain text |
| `company` | `nullable\|string\|max:80`, plain text |
| `rating` | `required\|integer\|between:1,5` |
| `message` | `required\|string\|min:20\|max:600`, plain text |
| `avatar` | `nullable\|file\|mimes:jpg,jpeg,png,webp\|max:5120` (kilobytes) plus `dimensions:max_width=4096,max_height=4096`. The browser already sends a 256×256 WebP (JPEG fallback) with EXIF stripped, but the server must not trust it: decode, re-encode (e.g. Intervention Image) to drop metadata, store under a random name outside the web root or on a private disk, and expose only after approval. |
| `consent` | `accepted` (the client sends `"1"`). Store the consent timestamp and wording version with the record. |
| `hp` | Honeypot. When non-empty: answer `201` with the normal body and store nothing. |

The request also carries `?lang=` and `Accept-Language`; messages in the response should be in that language.

### Responses

- `201 Created`: `{ "code": 201, "success": true, "message": "…", "data": { "id": 123, "status": "pending" } }`. Never return the record as published.
- `422`: `{ "code": 422, "success": false, "message": "The given data was invalid.", "data": null, "errors": { "rating": ["…"], "avatar": ["…"] } }`. The form shows each message on its field (including `avatar`).
- `429`: rate limited. Any status other than 201 and 422 shows "500 — Retry".

### Moderation states

| `status` | Meaning | Listed by `GET`? |
| --- | --- | --- |
| `pending` | New submission, waiting for the owner. | No |
| `approved` | Published. Approving (or editing) one triggers the Vercel Deploy Hook. | Yes |
| `rejected` | Kept for audit or deleted; the photo is deleted. | No |

### Abuse protection (required in Laravel)

- **Rate limiting:** `RateLimiter::for('testimonials')`: e.g. 3 submissions per hour and 10 per day per IP, applied with `throttle:testimonials` on the route. Answer `429` with `Retry-After`.
- **Honeypot** (`hp`) as above, plus a minimum fill time (e.g. reject submissions faster than 3 s after the form was opened, if a signed timestamp is added later).
- **Duplicates:** reject the same `name` + `message` hash within 24 hours (`422` on `message`).
- **Content:** strip or reject HTML on every field; escape on output; limit links in `message` (e.g. none, or flag for review).
- **Files:** validate MIME by content, not by extension; enforce the size and dimension limits; re-encode; never serve the original upload.
- Optionally add Cloudflare Turnstile or similar if spam gets through; the client needs one extra field for it.

While the API is not connected, production builds relay the review to WhatsApp (`VITE_REVIEW_RELAY`, photo not included), and development builds answer from the mock adapter with the same contract and a visible "Mock mode: not delivered" notice. The mock never stores submissions.

## License

All rights reserved. © Abdulrahman Abu Eisha.
