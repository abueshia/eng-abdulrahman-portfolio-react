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

## ◇ Recommended (not blocking)

- [ ] `public/images/profile-cutout.png`: the transparent cutout works, but the figure is only **181×408 px** once the empty margins are trimmed, so the hero upscales it. A cutout **≥ 1400 px tall** (same framing, transparent background) will make the portrait sharp on desktop and retina screens. Replacing the file is all it takes: `npm run dev` / `npm run build` regenerate the AVIF/WebP variants automatically (or run `npm run images`).

- [ ] iCode Tech website: add `general.company.url` (absolute `https://` URL) in settings, so the JSON-LD `worksFor` Organization links to it. Optional: the Person is valid without it.

## ◌ Temporary mock until the API

Clearly fictional sample content (`Sample ·` project titles, `sample-*` slugs, "Sample Company A/B/C", zeroed figures). It is replaced by Laravel content when the API is connected:

- `experiences.js`, `projects.js`, `stats.js` (only "4+ years" is real). The observability board shows the zeroed sample metrics as **"No data"** panels (no number, flat dashed series), so nothing fictional reads as a real figure.
- `services.js`, `faqs.js`, `technologies.js`
- `credentials.js`, `testimonials.js`, `blogs.js`: **hidden** (`sections_visibility` = `false`), so they are absent from the navigation and prerendering until real content exists

> Note: while `VITE_USE_MOCK=true`, the sample case studies are still prerendered and listed in `sitemap.xml`. Connect the API, or hide `projects`, before submitting the sitemap to Search Console.
