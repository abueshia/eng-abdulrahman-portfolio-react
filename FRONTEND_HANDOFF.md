# Frontend Handoff — Public API v1

Facts only, distilled from [API_CONTRACT.md](API_CONTRACT.md). Real responses: [docs/api-fixtures/](docs/api-fixtures/) (index with request, status and headers per file: `_index.json`).

- **Base URL (production, verified live):** `https://eng-abdelrahman.dr-krok.com/api/v1`
- **Auth:** none. Send `Accept: application/json`.
- **Language:** `?lang=ar|en` (wins) → else first 2 chars of `Accept-Language` → else `en`. Missing `en` text falls back to Arabic; missing `ar` text returns `""`. Testimonials fall back both ways.
- **Endpoints:** `GET /projects`, `GET /projects/{slug}`, `GET /experiences`, `GET /testimonials`, `POST /testimonials` (3 per 60 min per IP), `GET /faqs`, `POST /contact` (5 per min per IP).
- **Rate limit on reads:** all GET/HEAD requests share one limit of 120 per minute per IP. Responses carry `X-RateLimit-Limit` and `X-RateLimit-Remaining`, and a 429 carries `Retry-After: 60`. POSTs only count against their own limits.
- **Production lag:** the production API still runs an older build. Everything below describes this repo, so production matches it only after a deploy.

## Envelope

```
success: { code, success: true, message, data }            // + pagination (GET /projects only)
422:     { code: 422, success: false, message, errors: { field: [msg] } }
404:     { code: 404, success: false, message: "Project not found" }  // project slug
404 route / 429 / 500: Laravel default { message }  (no code/success)
```

`pagination`: `current_page, first_page_url, prev_page_url, next_page_url, last_page_url, total_pages, per_page, total_items, path`. Empty prev/next are `""`, not `null`. All four links keep the request's full query string (`lang`, `per_page`, filters), so they can be followed as-is.

## Project (`GET /projects` items, `GET /projects/{slug}`)

| Field | Type | Nullable / empty |
| :-- | :-- | :-- |
| id | int | no |
| slug | string | no |
| title | string | no |
| subtitle, short_description, description | string | may be `""` |
| challenge | `Array<{title: string, description: string}>` | always an array; `[]` when empty |
| solution, results | string (may contain `\r\n` line breaks) | may be `""` |
| metrics | array | may be `null`; currently always `[]` |
| client_name, role_title, duration | string | may be `""`; currently always `""` |
| project_type | `web_app \| saas \| api_backend \| ecommerce \| cms_dashboard \| full_stack` | no |
| project_type_label | string (localized) | no |
| status | `"published"` | no |
| live_url, repo_url | string | `null` |
| case_study_url, started_at | — | **always `null`** (no DB column) |
| completed_at | `YYYY-MM-DD` | `null` |
| is_featured | bool | no (currently all `false`) |
| sort_order | int | no |
| cover_image | absolute URL | `null` |
| gallery | `string[]` (absolute URLs) | `[]` |
| category | Category | `null` |
| technologies | Technology[] | `[]` |
| testimonials | Testimonial[] | **show only** |
| related_projects | Project[] (≤ 3, without `testimonials`) | **show only** |

Not exposed: `meta_title`, `meta_description`, `video_url`, `created_at`, `updated_at`.

**List query:** `page`, `per_page` (alias `limit`, default 9, clamped 1–50), `type`, `category` (slug or id), `category_id`, `technology` / `technology_id` (slug or id), `featured=1`. No `sort`. Fixed order: `sort_order ASC, completed_at DESC, id DESC`. Published and active only.

### Type vs Category

- **Type** = fixed enum `project_type` plus a localized `project_type_label`. Filter with `?type=`.
- **Category** = admin-managed record `{id, name, slug, description, icon_class, sort_order, image}`, or `null`. Filter with `?category=<slug>`. There is no categories endpoint (it is commented out locally).
- Category slugs currently in use: `enterprise-saas`, `informational-showcase-websites`, `mnsat-taalmy`, `mobile-applications`.

### Technology

`{id, name, slug, category, category_label, icon_class?, brand_color?, proficiency_percent, years_experience?, is_featured, sort_order, image?}`

- `category` is one of: `backend | frontend | database | devops | architecture | testing | tools`.
- Fields marked `?` may be `null`.

## Image rules

- **Absolute URLs**, built from the server's `APP_URL`. In production that host is **`https://icodetech7.com/storage/...`**, a different domain from the API.
- `cover_image`: one URL or `null`.
- `gallery`: plain URL strings, original uploads only.
  - No thumbnails, sizes, `alt`, width or height.
  - Order is upload order. Count is unbounded (3–17 today).
  - Formats: jpg, jpeg, png, webp **or svg**, each ≤ 5 MB. File names are raw (e.g. `WhatsApp-Image-…jpeg`).
- `company_logo` (experiences), `avatar` (testimonials) and `category.image` are all currently `null`.

## Experience (`GET /experiences`)

| Field | Type | Nullable / empty |
| :-- | :-- | :-- |
| id, sort_order | int | no |
| company_name, role_title | string | no |
| location, summary | string | may be `""` |
| achievements | **string**, items separated by `\n` | may be `""` |
| highlights | identical copy of `achievements` | — |
| employment_type | `full_time \| part_time \| contract \| freelance \| remote` | no |
| employment_type_label | string (localized) | no |
| company_url | string | `null` |
| start_date | `YYYY-MM-DD` | no |
| end_date | `YYYY-MM-DD` | **`null` when `is_current`** |
| is_current | bool | no |
| company_logo | absolute URL | `null` |
| technologies | Technology[] | `[]` |

Order is `sort_order ASC, is_current DESC, start_date DESC`. With current data that means oldest first, current jobs last. Active only.

## Testimonial (`GET /testimonials`)

| Field | Type | Nullable |
| :-- | :-- | :-- |
| id, rating (1–5), sort_order | int | no |
| name (= client_name) | string | no |
| name_job (= client_role) | string | `null` |
| company_name | string | `null` |
| description (= testimonial) | string | no |
| is_featured | bool | no |
| source | `"dashboard" \| "website"` | no |
| avatar | absolute URL | `null` |
| project | `{id, title, slug}` | `null`, including when the linked project is unpublished, archived or inactive |

Order is `sort_order ASC, id ASC`. Active only.

## FAQ (`GET /faqs`)

`{id, question, answer, category, sort_order}`

- `category` is a free string; current values are `architecture`, `general`, `process`.
- `?category=` is ignored.
- Order is `sort_order ASC, id ASC`. Active only.

## POST bodies (summary — full rules in the contract §5 and §7)

### `POST /testimonials`

- **Required:** `name` (2–80 chars) and `description` (10–1000 chars).
  - Each can be a plain string or `{ar, en}`.
- **Optional:**
  - `name_job` and `company_name` (≤ 100 chars).
  - `rating` (1–5, default 5).
  - `project_id`.
  - `image` or `avatar` (jpg, png or webp, ≤ 5 MB, sent as multipart).
  - `locale`.
  - `consent` (must be accepted if sent).
- Leave the honeypot fields `website` and `honeypot` empty. Never send `hp`.
- A successful submission returns **201**. The review is stored inactive until an admin approves it.

### `POST /contact`

- **Required:** `name` (≤ 150), `email` (≤ 150), `message` (≤ 5000).
- **Optional:** `phone`, `subject`, `service`, `budget_range`, `timeline`.
- **`type`:** `general_contact` (default), `project_inquiry`, `job_offer`, or `consultation`.
- Leave the honeypot fields `website` and `honeypot` empty.
- A successful submission returns **201** with the stored message.

## Surprises and inconsistencies found

1. **`started_at` and `case_study_url` are in the Resource but have no DB column**, so they are always `null`.
2. **The error envelope is inconsistent:**
   - Only 404 for a project slug and 422 use `{code, success}`.
   - 404 for an unknown route and 429 return Laravel's bare `{message}`.
   - Production runs with `APP_DEBUG=true`, so those errors also include `exception`, `file` and `trace`.
3. **Production runs a different code version than this repo.**
   - Routes that are commented out here (`/settings`, `/home`, `/technologies`, `/credentials`, `/services`, `/stats`, `/blogs`, `/categories`) all return 200 in production.
   - Only use the 7 endpoints above.
4. **Image host differs from the API host** in production (`icodetech7.com` vs `eng-abdelrahman.dr-krok.com`).
5. **Some slugs don't match their titles:** project 11 "Steel Tech…" has the slug `high-throughput-ecommerce-api`.
6. **No project is currently `is_featured`**, so `?featured=1` returns an empty list.
7. **Duplicate alias fields:**
   - testimonials: `name`/`client_name`, `name_job`/`client_role`, `description`/`testimonial`
   - experiences: `achievements`/`highlights`
8. **No `updated_at` or SEO fields** are exposed for building a sitemap. The only date is `completed_at`, and all slugs fit in one `?per_page=50` call.
9. **GET responses are cacheable:** `Cache-Control: public, max-age=60, s-maxage=300` plus an `ETag`. `If-None-Match` gets a 304.
10. **CORS allows** `https://eng-abdulrahman-abu-eisha.vercel.app`, `http://localhost:5173` and `http://127.0.0.1:5173` only. Vercel preview URLs are blocked, and no `Authorization` header is allowed.
11. **Validation messages (422) are fully translated** into the request language. For logic, key off the `errors` field names rather than the message text.
12. **Content changes rebuild the site through a Vercel Deploy Hook**, at most once per minute. Reordering items in the dashboard does not trigger a rebuild.
