# Eng. Abdulrahman Abu Eisha · Portfolio Frontend

Bilingual (Arabic RTL / English LTR) portfolio of **Abdulrahman Abu Eisha**, Full-Stack Software Engineer (PHP · Laravel · React) based in Cairo, Egypt.

Live: <https://eng-abdulrahman-abu-eisha.vercel.app>

The site is a React SPA that is **prerendered at build time** (static HTML for every page and language, then hydrated). Projects, experiences, testimonials, FAQs and both forms run on the Laravel REST API (fetched at build time, see [The Laravel API](#the-laravel-api-phase-7)); the remaining content is static data served by an in-app mock adapter with the same envelope.

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
npm run dev                  # http://localhost:5173 (live API for the connected resources)
```

## Environment variables

Only `VITE_*` variables reach the browser bundle: never put secrets in them. Set them in `.env.local` locally and in the Vercel project settings for deployments.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `https://eng-abdelrahman.dr-krok.com/api/v1` | Base URL of the Laravel API (versioned prefix included, no trailing slash). |
| `VITE_API_RESOURCES` | all five | Comma list of the resources fetched from the live API: `projects,experiences,testimonials,faqs,contact`. Unset means all five; an empty value means none (the test suite). Everything else (settings, services, stats, About, skills…) stays static/mock data in the same build. |
| `VITE_SITE_URL` | `https://eng-abdulrahman-abu-eisha.vercel.app` | Canonical production origin, no trailing slash. Used for canonical, hreflang, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt` and `llms.txt`. Always the production domain, even for local builds. |
| `VITE_CONTACT_RELAY` | `true` in production builds | Only matters when `contact` is **not** in `VITE_API_RESOURCES`: the contact form then opens WhatsApp (or the mail app) pre-filled. With `contact` live it is ignored. |
| `VITE_REVIEW_RELAY` | `true` in production builds | Same rule for "Write a review" when `testimonials` is not live (the photo is not sent that way). |
| `VITE_MOCK_LATENCY` | `350` | Simulated latency of the mock adapter (ms), for the static resources. |
| `VITE_FX` | `on` | `off` disables every client-only visual layer (intro, canvas, WebGL, GSAP). Content never depends on it. The test suite uses `off`. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server. Live resources come from `VITE_API_URL` (the API allows `http://localhost:5173` in CORS). |
| `npm run build` | Client build, then server build, then prerendering of every page from the API (`scripts/prerender.js`), then output verification (`scripts/verify-dist.js`). Output: `dist/`. Fails if the API fails. |
| `npm run build:spa` | Client build only (no prerendering). |
| `npm run preview` | Serves `dist/` locally (run after `build`). |
| `npm run lint` | ESLint, zero warnings allowed. |
| `npm run test` | Vitest (unit, component, mapping, prerender, hydration and build-verifier tests). Hermetic: no network. |
| `npm run size` | Initial-JS budget report (gzip) for the home page. Run after `build`. Budget: 170 KB. |
| `npm run verify:dist` | Re-runs the post-build checks on `dist/`. |
| `npm run data:todo` | Lists what still blocks publishing (a visible section without a data source, a form that reaches nobody, missing real data). Exits 1 while anything blocks. |
| `npm run images` | Regenerates the portrait variants (AVIF/WebP) from `public/images/profile-cutout.png`. Also runs automatically in `dev` and `build`. |
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
  services/api/      HTTP layer: lazy axios client (live or mock per resource), envelope
                     unwrapping, services, mappers/ (API → app shapes), mock adapter
  data/mock/         Static/mock data for the resources the API does not serve
  i18n/              i18next setup; base strings per language load as separate chunks
  config/            env.js (site settings) · api.js (API URL, live resources, form relays) · routes, journey
  test/              setup, render helper, api-fixtures.js (serves the captured API responses)
  lib/ hooks/ context/ utils/ styles/
docs/api-fixtures/   Real responses captured from the Laravel API: the reference for data shapes and tests
scripts/             prerender, verify-dist, images, bundle report, data report
public/              Static files served as is (CV, images, Search Console verification file)
```

## Deploying to Vercel

`vercel.json` pins the build. No dashboard overrides are needed:

- Framework preset: none (`"framework": null`). Install `npm ci`, build `npm run build`, output `dist`.
- Every route is a static file: `/` → `dist/index.html`, `/en` → `dist/en/index.html`, `/projects/:slug` → `dist/projects/:slug/index.html`. There is **no catch-all rewrite**: unknown URLs get `dist/404.html` with a real `404` status, and files under `public/` (CV, images, the `google….html` verification file) are served as they are.
- Headers: hashed `/assets/*` files are cached for a year (`immutable`); HTML revalidates on every request. Security headers apply site-wide: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`.
- The build fails if the API does not answer, if any generated page is missing its stylesheet or module script, references a file that is not in `dist/`, lacks its SEO head, mentions `localhost`, or if the sitemap lists a URL that is not indexable.

Deployment checklist:

1. Environment variables in Vercel (Production): `VITE_SITE_URL` (the domain verified in Search Console), `VITE_API_URL=https://eng-abdelrahman.dr-krok.com/api/v1` and `VITE_API_RESOURCES=projects,experiences,testimonials,faqs,contact`.
2. Content is baked in at build time. The backend triggers a rebuild through a **Vercel Deploy Hook** (below).
3. After deploying, run through the post-deploy checklist in `SEO.md` §10.

## The Laravel API (phase 7)

The contract is [`API_CONTRACT.md`](API_CONTRACT.md) (Arabic, full) and [`FRONTEND_HANDOFF.md`](FRONTEND_HANDOFF.md) (summary), both copied from the backend repository. The real responses in [`docs/api-fixtures/`](docs/api-fixtures/) are the only reference for data shapes.

**Live resources.** Five resources come from the API: `GET /projects` (all pages), `GET /projects/{slug}`, `GET /experiences`, `GET /testimonials`, `GET /faqs`, plus `POST /testimonials` and `POST /contact`. Each is switched on by `VITE_API_RESOURCES`; the transport (`services/api/axios-client.js`) sends a request to the API when its first path segment is live and to the mock adapter otherwise, in the same build. Every request carries `?lang=ar|en` and `Accept-Language`.

**Mapping.** Components never see the API's field names. Each service passes the unwrapped envelope through a mapper (`services/api/mappers/*.js`, one lazy chunk) that returns the app's shape:

| Resource | Notable normalisation |
| --- | --- |
| Projects | `short_description` → `summary`, `project_type(_label)` → `type`/`type_label`, `challenge[{title, description}]` → `challenges[{title, body}]`, texts split into paragraphs (`\r\n`), editor `[cite: …]` artefacts removed, `gallery` URLs → `{image, alt}` (alt numbered under the title), `repo_url` → `github_url`, `completed_at` → `year`, pagination `total_pages`/`total_items` → `last_page`/`total`. |
| Experiences | `company_name`/`role_title` → `company`/`role`, `achievements` (one `\n`-separated string, or an array) → trimmed list items without bullet markers, `end_date` forced to `null` while `is_current`, `employment_type_label` shown as is. |
| Testimonials | Alias fields read as fallbacks (`client_name`, `client_role`, `testimonial`), `rating` clamped to 1-5 (0 hides the stars), `avatar` kept only if it is an http(s) URL (otherwise the generated two-letter monogram), `project` `{id, title, slug}` linked to its case study, `is_featured` marked on the card. |
| FAQs | Trimmed `question`/`answer`. The same records feed the visible section and the `FAQPage` JSON-LD. |

**Build time.** The prerender fetches through the same services. If any request fails (network, 5xx, 429, malformed envelope), the build stops with the request that failed: no empty pages and no silent fallback to mock data (there is no mock data for the live resources). A 404 for an unknown slug is the only expected failure. Identical GET requests are sent once per build (the API allows 120 reads per minute per IP, and a Vercel build is one IP). Every published project is generated in both languages and listed in the sitemap with `completed_at` as `lastmod` (the API exposes no update date), with `CreativeWork` + `BreadcrumbList` JSON-LD.

**Forms.**

- `POST /contact` sends `name`, `email`, `phone?`, `message`, `type` (`project_inquiry`, `consultation` or `general_contact`, from the chosen project type) and `service` (the project type's label).
- `POST /testimonials` sends `multipart/form-data`: `name[<locale>]`, `name_job[<locale>]?`, `company_name[<locale>]?`, `description[<locale>]`, `rating`, `project_id?`, `image?` (256×256 WebP/JPEG re-encoded in the browser), `consent=1` and `locale`. The honeypot field is `website`: when a bot fills it, the form looks accepted and nothing is sent. `hp` is never sent (the API rejects it).
- Both forms show the confirmation after a `201`, place `422` errors on their fields (`name.ar` lands on the name), say "try again shortly" on `429`, and offer Retry on network or server errors. What the visitor typed is never lost.

**CORS.** The API allows `https://eng-abdulrahman-abu-eisha.vercel.app`, `http://localhost:5173` and `http://127.0.0.1:5173` only (no Vercel preview URLs: forms and client refetches on previews are blocked until the backend adds a pattern). Requests send only `Accept`, `Accept-Language`, `Content-Type` and `X-Requested-With`, all allowed.

**Deploy Hook.** The backend posts to a Vercel Deploy Hook (`VERCEL_DEPLOY_HOOK_URL` on the server, never in this repository) when a project, experience or FAQ is saved or deleted, or when an approved testimonial changes. At most one rebuild per minute; reordering in the dashboard does not trigger one (rebuild by hand). Create the hook in Vercel → Project → Settings → Git → Deploy Hooks (branch `main`).

**Tests** never touch the network: `VITE_API_RESOURCES` is empty in the test env, and `src/test/api-fixtures.js` registers the captured responses on the mock adapter, so every test runs the real envelope through the real mappers.

## License

All rights reserved. © Abdulrahman Abu Eisha.
