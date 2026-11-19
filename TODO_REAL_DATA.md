# Real data checklist

Run `npm run data:todo`. It reports two separate lists:

| Category | Marker | Blocks publishing? |
| --- | --- | --- |
| **Required before publishing** | `TODO_REAL_DATA` values, plus required files that are missing or invalid (format/dimensions are checked) | **Yes** (exit code 1) |
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
| CV | `public/cv/Abdulrahman_Saad_Backend_Engineer_CV.pdf` (one file for both languages) |

JSON-LD `sameAs` lists identity profiles only (GitHub, LinkedIn, Facebook). WhatsApp is a contact channel, so it stays out.

## ✗ Required before publishing

- [ ] `public/images/profile-cutout.png`: currently a **JPEG** (848×1024) with a `.png` name and **no transparency**. It needs a real PNG with an alpha channel (≥ 1200px tall if possible) for the hero's frame-breaking effect.
- [ ] `public/images/og-cover.jpg`: currently a copy of the portrait (848×1024). It needs a **1200×630** social preview image (see `SEO.md` §4).
- [ ] Final domain: update `VITE_SITE_URL` (see `SEO.md` §10). Not detectable by the script.

## ◌ Temporary mock until the API

Clearly fictional sample content (`Sample ·` project titles, `sample-*` slugs, "Sample Company A/B/C", zeroed figures). It is replaced by Laravel content when the API is connected:

- `experiences.js`, `projects.js`, `stats.js` (only "4+ years" is real)
- `services.js`, `faqs.js`, `technologies.js`
- `credentials.js`, `testimonials.js`, `blogs.js`: **hidden** (`sections_visibility` = `false`), so they are absent from the navigation and prerendering until real content exists

> Note: while `VITE_USE_MOCK=true`, the sample case studies are still prerendered and listed in `sitemap.xml`. Connect the API, or hide `projects`, before submitting the sitemap to Search Console.
