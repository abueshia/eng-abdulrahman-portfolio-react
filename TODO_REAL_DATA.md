# Real data checklist

Run `npm run data:todo`. It reports three separate lists:

| Category | Marker | Blocks publishing? |
| --- | --- | --- |
| **Required before publishing** | `TODO_REAL_DATA` values, plus required files that are missing or invalid (format/dimensions are checked) | **Yes** (exit code 1) |
| **Recommended** | Quality issues (e.g. a portrait too small to stay sharp) | No |
| **Temporary mock until the API** | Whole mock files headed `MOCK_UNTIL_API` (resources the API does not serve yet) | No |

It also blocks when a visible section's resource is neither live (`VITE_API_RESOURCES`) nor mocked, and when a form would reach nobody.

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

Phase 7 (part 1) connected projects, experiences, testimonials, FAQs and both forms to the Laravel API: their content is real and managed in the admin. What is left:

1. **Content quality in the admin** (not blocking, see `INTEGRATION_REPORT.md`):
   - [ ] Project slugs that do not match their titles (`high-throughput-ecommerce-api` is Steel Tech).
   - [ ] Experience `id=6` (en): "Ach 2" typo inside the achievements text.
   - [ ] Some project texts carry `[cite: …]` editor artefacts (the frontend strips them, better removed at the source).
   - [ ] No project is `is_featured`; testimonials have no photos (`avatar`), so cards show monograms.
   - [ ] **Stats:** measured figures (still static data in `stats.js`).
2. **Domain:**
   - [x] Production origin decided: `https://eng-abdulrahman-abu-eisha.vercel.app` is the default `VITE_SITE_URL` everywhere (canonical, hreflang, OG, sitemap, robots, JSON-LD, llms.txt).
   - [ ] Confirm the same value is set in Vercel (Production) and verified in Search Console (`SEO.md` §10). If a custom domain is added later, follow the "Domain" steps there.
3. **API (phase 7):**
   - [x] Projects, experiences, testimonials (list + form), FAQs and contact live (`VITE_API_RESOURCES`, `README.md` → "The Laravel API").
   - [ ] Vercel env (Production): `VITE_API_URL=https://eng-abdelrahman.dr-krok.com/api/v1` and `VITE_API_RESOURCES=projects,experiences,testimonials,faqs,contact`.
   - [ ] Vercel Deploy Hook created and its URL set in the backend's `VERCEL_DEPLOY_HOOK_URL` (`SEO.md` §8).
   - [ ] Production backend deployed with the code the contract describes, and `APP_DEBUG=false` (`INTEGRATION_REPORT.md`).
   - [ ] Moderation in the Laravel admin: website reviews arrive inactive; approving one publishes it (and calls the Deploy Hook).
   - [ ] Phase 7.2: settings, services, stats and skills from the API.

### ✗ Required before publishing (`npm run data:todo` exit 1)

- [x] Nothing today. It blocks again if a visible section's resource leaves `VITE_API_RESOURCES` (projects, experiences, testimonials and FAQs have no mock data any more) or if a form would reach nobody.

## ◇ Recommended (not blocking)

- [ ] `public/images/profile-cutout.png`: the transparent cutout works, but the figure is only **181×408 px** once the empty margins are trimmed, so the hero upscales it. A cutout **≥ 1400 px tall** (same framing, transparent background) will make the portrait sharp on desktop and retina screens. Replacing the file is all it takes: `npm run dev` / `npm run build` regenerate the AVIF/WebP variants automatically (or run `npm run images`).

- [ ] iCode Tech website: add `general.company.url` (absolute `https://` URL) in settings, so the JSON-LD `worksFor` Organization links to it. Optional: the Person is valid without it.

## ◌ Temporary mock until the API

Static data for the resources the Laravel API does not serve yet (phase 7.2). Projects, experiences, testimonials and FAQs have **no** mock data any more: they come from the API (tests use the real captured responses in `docs/api-fixtures/`).

- `stats.js`: headline figures (only "4+ years" is verified real).
- `services.js`: the **real** list of 14 services in 5 groups (edit wording freely) until `GET /services` exists.
- `technologies.js`
- `credentials.js`: **hidden** (`sections_visibility.credentials = false`), so it is absent from the navigation and prerendering until real content exists.
