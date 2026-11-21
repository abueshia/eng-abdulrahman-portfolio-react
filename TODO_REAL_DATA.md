# Real data checklist

Run `npm run data:todo`. It reports three separate lists:

| Category | Marker | Blocks publishing? |
| --- | --- | --- |
| **Required before publishing** | `TODO_REAL_DATA` values, plus required files that are missing or invalid (format/dimensions are checked) | **Yes** (exit code 1) |
| **Recommended** | Quality issues (e.g. a portrait too small to stay sharp) | No |
| **Temporary mock until the API** | Whole mock files headed `MOCK_UNTIL_API` | No: expected until `VITE_USE_MOCK=false` |

It also lists the sections hidden through `settings.sections_visibility`.

## ✅ Real data in place

| Field | Value |
| --- | --- |
| Email | rm01062293490@gmail.com |
| Phone | +201028292449 |
| WhatsApp | https://wa.me/201028292449 |
| Location | القاهرة، حدائق الأهرام · Hadayek El Ahram, Cairo, Egypt |
| Time zone | Africa/Cairo |
| Years of experience | 4 |
| GitHub | https://github.com/abueshia |
| LinkedIn | https://www.linkedin.com/in/eng-abdulrahman-abu-eisha/ |
| Facebook | https://www.facebook.com/abdo.saad.35762241 |
| X | Removed (not used) |
| CV | `public/cv/Abdulrahman_abu_eisha_CV.pdf` (one file for both languages) |
| Portrait | `public/images/profile-cutout.png`: transparent PNG cutout ✓ (hero runs in `cutout` mode) |
| Company | CEO of **iCode Tech** (`settings.general.company`): shown in About and in JSON-LD (`jobTitle`, `worksFor`) |
| OG image | `public/images/og-cover.jpg`: 1200×630 JPEG (final social preview) ✓ |

JSON-LD `sameAs` lists identity profiles only (GitHub, LinkedIn, Facebook). WhatsApp is a contact channel, so it stays out.

## ✗ Required before publishing

- [ ] Final domain: update `VITE_SITE_URL` (see `SEO.md` §10). Not detectable by the script.
- [ ] **Visible sections serving samples** (`npm run data:todo` fails on these): `projects` (3 sample case studies), `testimonials` (4 sample reviews) and `blog` (3 sample articles). Replace them with real content from the API, or hide the section in `settings.sections_visibility`, before going live.
- [ ] **Contact form on the mock adapter:** with `VITE_USE_MOCK` not `false`, a submitted message reaches nobody (the success panel says "Mock mode: not delivered"). Connect the Laravel `POST /contact` and set `VITE_USE_MOCK=false` in Vercel (or `.env.production`). The direct channels (email, WhatsApp, phone) work regardless.

## ◇ Recommended (not blocking)

- [ ] `public/images/profile-cutout.png`: the transparent cutout works, but the figure is only **181×408 px** once the empty margins are trimmed, so the hero upscales it. A cutout **≥ 1400 px tall** (same framing, transparent background) will make the portrait sharp on desktop and retina screens. Replacing the file is all it takes: `npm run dev` / `npm run build` regenerate the AVIF/WebP variants automatically (or run `npm run images`).

- [ ] iCode Tech website: add `general.company.url` (absolute `https://` URL) in settings, so the JSON-LD `worksFor` Organization links to it. Optional: the Person is valid without it.

## ◌ Temporary mock until the API

Clearly fictional sample content (`sample-*` slugs, "Sample Company A/B/C", zeroed figures, `is_sample` projects). It is replaced by Laravel content when the API is connected:

- `projects.js`: **3 sample case studies** (multi-tenant SaaS, inventory & POS, delivery/booking API), each with `is_sample: true`. No real clients or companies, no invented numbers: metrics are descriptive ("REST + WebSocket") or `null` ("No data"). The flag shows a "Sample / نموذجي" badge, makes the case study `noindex`, keeps it out of `sitemap.xml` and suppresses its CreativeWork JSON-LD. Real projects from the API simply omit the flag (or send `false`) and become indexable automatically.
  - Screens: generated SVGs in `public/images/projects/<slug>/` (`npm run visuals`). Replace each `cover_image`, `preview_image` and `gallery[].image` path with a real screenshot (16:10, ≥ 1600 px wide; JPG/PNG/WebP covers also become the Open Graph image) and update the `alt` texts.
  - Per real project, provide: title, summary (≤ 160 chars), problem, solution, role, technologies, challenges, architecture nodes/edges + decisions, metrics (only measured values), gallery, and `live_url` / `github_url` if public.
- `experiences.js`, `stats.js` (only "4+ years" is real). The observability board shows the zeroed sample metrics as **"No data"** panels (no number, flat dashed series), so nothing fictional reads as a real figure.
- `services.js`: the **real** list of 14 services in 5 groups (edit wording freely). It stays in a mock file only until `GET /services` serves it.
- `testimonials.js`: **4 sample reviews** (`is_sample: true`): "Sample client A–D", "Sample company", and quotes that say they are placeholders. Real ones need: name, role, company, quote, the area reviewed (`scope`) and the aspects approved (`checks`), with the person's permission to publish.
- `blogs.js`: **3 sample articles** (`is_sample: true`): Idempotency in payment webhooks, Laravel queues, Core Web Vitals for React. Wording is general and has no invented figures, so they can become real posts once the owner reviews and publishes them (then drop the flag and the `sample-` slug prefix). Covers are generated SVGs in `public/images/blog/`.
- `faqs.js`: the owner's FAQ, 8 honest general answers (no prices, durations or ranking promises). Edit freely.
- `technologies.js`
- `credentials.js`: **hidden** (`sections_visibility.credentials = false`), so it is absent from the navigation and prerendering until real content exists

> Note: sample case studies are still prerendered (links work) but are `noindex` and **not** listed in `sitemap.xml`. The sitemap can be submitted as is; real projects appear in it as soon as the API serves them without `is_sample`.
