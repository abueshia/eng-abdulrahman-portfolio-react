# Real data checklist

The owner decided the site uses **real data from the start**. Every value still missing is marked `TODO_REAL_DATA` in the mock data (`src/data/mock/`). Run:

```bash
npm run data:todo
```

It prints every remaining marker and missing file, and exits non-zero while anything is outstanding. That status should gate the production launch.

## Needed from the owner

### Profile (`src/data/mock/settings.js`)
- [ ] Contact email
- [ ] Phone / WhatsApp number (international format)
- [ ] Location (Arabic + English wording)
- [ ] Time zone (currently `Asia/Gaza`, confirm)
- [ ] Years of experience (currently `4`, confirm)
- [ ] Social profile URLs: GitHub, LinkedIn, X, WhatsApp (absolute `https://` URLs; add or remove platforms as needed)

### Collections (each file currently holds clearly fictional sample records)
- [ ] **Experience** (`experiences.js`): companies, roles, employment type, locations, start/end dates, summaries, achievements (AR + EN), technologies
- [ ] **Projects** (`projects.js`): titles, slugs, summaries, problem/solution, metrics, technologies, live/GitHub links, cover and gallery images
- [ ] **Credentials** (`credentials.js`): certificates, issuers, dates, verification URLs; education
- [ ] **Testimonials** (`testimonials.js`): names, roles, companies, quotes (with permission to publish)
- [ ] **Stats** (`stats.js`): headline numbers you can stand behind
- [ ] **Blog** (`blogs.js`): real articles, or keep the section hidden via `sections_visibility.blog = false`

### Files
- [ ] `public/cv/abdulrahman-abu-eisha-cv.pdf`: one CV for both languages (file name is provisional)
- [ ] `public/images/og-cover.jpg`: 1200×630 social preview image (see `SEO.md` §4)
- [x] `public/images/profile-cutout.png`: transparent cutout portrait

### Deployment
- [ ] Final domain (update `VITE_SITE_URL`, see `SEO.md` §10)
