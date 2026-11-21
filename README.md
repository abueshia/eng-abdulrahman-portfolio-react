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
   Endpoints: `GET /settings`, `/home`, `/projects`, `/projects/{slug}`, `/technologies`, `/experiences`, `/credentials`, `/services`, `/testimonials`, `/faqs`, `/stats`, and `POST /contact`.
   The fields each one must return (including the SEO contract) are listed in `SEO.md` §7. The mock handlers in `src/services/api/mock/handlers.js` and the data in `src/data/mock/` are the reference responses.
2. Every request carries `?lang=ar|en` and `Accept-Language`. Return localized fields for that language.
3. Set `VITE_API_URL` and `VITE_USE_MOCK=false` in Vercel and rebuild. The contact form then posts to `POST /contact` (the WhatsApp relay switches off by itself).
4. Replace the sample content (`is_sample: true` on projects and testimonials) with real records, or hide those sections through `settings.sections_visibility`. `npm run data:todo` must report nothing blocking.
5. Add the Vercel Deploy Hook call to the backend's publish events.

## License

All rights reserved. © Abdulrahman Abu Eisha.
