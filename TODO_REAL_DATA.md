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
| SEO copy | `settings.seo.meta_title` / `meta_description`, `hero.summary`, the Cairo paragraph in About, and `general.alternate_names` (8 spellings, JSON-LD + visible "Also written as" line). Facts only: see `SEO_KEYWORDS.md` |
| Public address | `general.address`: Cairo, Egypt (city and country only) for JSON-LD; the detailed location stays in the visible status strip only |

JSON-LD `sameAs` lists identity profiles only (GitHub, LinkedIn, Facebook). WhatsApp is a contact channel, so it stays out.

## What remains before launch

After phase 6, only three kinds of work are left: real content, the domain decision, and connecting the API (phase 7).

1. **Real content** (blocks `npm run data:todo`):
   - [ ] **Projects:** replace the 3 sample case studies (`is_sample: true`) with real ones from the API, or hide the section (`sections_visibility.projects = false`).
   - [ ] **Testimonials:** replace the 4 sample reviews with real, permitted quotes, or hide the section.
   - [ ] **Experience and stats:** real roles and measured figures (today only "4 years" is real; the rest shows "No data").
2. **Domain:**
   - [x] Production origin decided: `https://eng-abdulrahman-abu-eisha.vercel.app` is the default `VITE_SITE_URL` everywhere (canonical, hreflang, OG, sitemap, robots, JSON-LD, llms.txt).
   - [ ] Confirm the same value is set in Vercel (Production) and verified in Search Console (`SEO.md` §10). If a custom domain is added later, follow the "Domain" steps there.
3. **API (phase 7):**
   - [ ] Laravel endpoints with the documented envelope and SEO fields (`SEO.md` §7, `README.md`), then `VITE_USE_MOCK=false` + `VITE_API_URL` in Vercel.
   - [ ] `POST /contact` live. Until then the form runs in **relay mode** in production: it says up front that sending opens WhatsApp, then opens `wa.me/201028292449` with the message pre-filled (mail app if no WhatsApp number). `npm run data:todo` lists this as *recommended*. With `VITE_CONTACT_RELAY=false` and no API, it becomes *blocking* (a pure mock reaches nobody).
   - [ ] Vercel Deploy Hook called by the backend on every publish (`SEO.md` §8).

### ✗ Required before publishing (`npm run data:todo` exit 1)

- [ ] **Visible sections serving samples:** `projects` (3 sample case studies) and `testimonials` (4 sample reviews). Replace them with real content from the API, or hide the section in `settings.sections_visibility`, before going live.

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
- `testimonials.js`: **4 sample reviews** (`is_sample: true`): owner-provided wording, a sample role only ("Sample client, …"), no names, photos, logos, stars or ratings, and no Review/AggregateRating JSON-LD. The badge shows on the section and on every card. Real ones need the client's role, the quote and permission to publish (name and company optional).
- `faqs.js`: the owner's FAQ, 13 honest general answers (no prices, durations or ranking promises). Phase 6 added five that match real searches (freelance Laravel developer in Cairo, back end vs Full-Stack, remote work, Paymob/Fawry, Laravel REST APIs). Edit freely.
- `technologies.js`
- `credentials.js`: **hidden** (`sections_visibility.credentials = false`), so it is absent from the navigation and prerendering until real content exists

> Note: sample case studies are still prerendered (links work) but are `noindex` and **not** listed in `sitemap.xml`. The sitemap can be submitted as is; real projects appear in it as soon as the API serves them without `is_sample`.
