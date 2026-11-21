# Keyword map

Which search phrases the site targets, which page or section covers each one, and where it actually appears. Every phrase sits inside natural, factual copy: there is no `meta keywords` tag, no hidden text and no superlatives ("best", "top", "#1"). Copy lives in the API data (`settings`, `services`, `faqs`; mocked in `src/data/mock/` until phase 7), so editing the copy in the Laravel admin keeps this map valid as long as the facts stay.

**Pages.** `/` is the Arabic home (x-default), `/en` the English home. Case studies (`/projects/:slug`) are samples today: `noindex` and outside the sitemap, so they target nothing yet.

**Where the identity is stated:**

- **`<title>`:** `م. عبدالرحمن أبو عيشة | مهندس برمجيات Full-Stack في القاهرة` / `Eng. Abdulrahman Abu Eisha | Full-Stack Software Engineer, Cairo` (`settings.seo.meta_title`).
- **Meta description:** the name, 4 years of experience, PHP/Laravel back end, React, payment gateway integration, REST APIs and Cairo (`settings.seo.meta_description`).
- **`<h1>`:** the name.
- **Hero summary under the `<h1>`:** "Full-Stack Software Engineer and back-end developer based in Cairo, Egypt…".
- **JSON-LD `Person`:**
  - `name`, plus `alternateName` (8 common spellings).
  - `jobTitle` (engineer and "CEO, iCode Tech"), `worksFor`.
  - `address`: Cairo, EG.
  - `areaServed`: Egypt and the Arab world.
  - `knowsAbout`, `sameAs` (GitHub, LinkedIn, Facebook).
- **Visible "Also written as" line in About:** the same spellings, readable, never hidden.
- **`/llms.txt`:** a one-sentence definition plus identity, services and FAQ (for AI answer engines).

Measured counts in the generated home pages are in the last section of this file.

## Arabic (`/`)

| Phrase | Covered by | Where it appears |
| --- | --- | --- |
| عبدالرحمن أبو عيشة | Home | `<h1>`, title, description, portrait `alt`, About, footer, JSON-LD `name` |
| م. عبدالرحمن أبو عيشة / مهندس عبدالرحمن أبو عيشة | Home | Title, `og:site_name`, "Also written as" line, JSON-LD `alternateName`. "مهندس" also reads naturally before the job title in the hero and About |
| عبد الرحمن أبو عيشة / عبدالرحمن ابو عيشه | Home | "Also written as" line (About), JSON-LD `alternateName` |
| مهندس برمجيات في القاهرة / مهندس برمجيات مصر | Home | Title ("مهندس برمجيات Full-Stack في القاهرة"), description, hero summary ("من القاهرة، مصر"), About (Cairo paragraph), JSON-LD `address` |
| مطور باك إند مصر / مبرمج باك إند في القاهرة | Home | Hero summary ("ومطور باك إند من القاهرة، مصر"), description, FAQ "ما الفرق بين مطور Backend ومطور Full-Stack؟" |
| مطور Laravel في مصر / مطور Laravel القاهرة | Home | FAQ "هل تعمل مطور Laravel مستقلاً (freelance) في القاهرة؟", hero summary (Laravel + Cairo), Services (Laravel REST API) |
| مبرمج PHP لارافيل | Home | Hero summary ("بـ PHP وLaravel"), description, About code card (PHP 8.3), Skills |
| مطور React مصر | Home | Hero summary ("وبـ React واجهات…"), service "واجهات React عالية الأداء", Skills, FAQ (back end vs Full-Stack) |
| مهندس Full-Stack في مصر | Home | Title, description, hero role line, About `whoami` line, FAQ |
| مطور ويب القاهرة | Home (indirect) | Not written literally on purpose. Covered by "مهندس برمجيات Full-Stack" and "مطور باك إند" with Cairo. Add it only if it fits real copy |
| تطوير API لارافيل | Home | Service "تصميم وبناء REST APIs": "تطوير REST API بـ Laravel…", FAQ "هل تبني REST API بـ Laravel…؟" |
| تكامل بوابات الدفع (Paymob وFawry) | Home | Service "تكامل بوابات الدفع": "تكامل بوابات الدفع في مصر والعالم (Paymob وFawry وPayPal…)", FAQ "هل تدمج بوابات الدفع المصرية مثل Paymob وFawry؟", About (Cairo paragraph), description |
| مبرمج للعمل الحر عن بعد | Home | FAQ (freelance in Cairo; remote with clients outside Egypt), About (Cairo paragraph: "عن بُعد… مشاريع مستقلة (freelance)") |
| شركة برمجيات القاهرة (iCode Tech) | Home | About `whoami` ("الرئيس التنفيذي · iCode Tech"), footer, JSON-LD `jobTitle` and `worksFor`. To strengthen it: add `settings.general.company.url` (and later a short, factual company description) |
| السيو التقني / GEO | Home | Services group "النمو: SEO وGEO", FAQ (rankings, GEO) |

## English (`/en`)

| Phrase | Covered by | Where it appears |
| --- | --- | --- |
| Abdulrahman Abu Eisha | Home | `<h1>`, title, description, portrait `alt`, About, footer, JSON-LD `name` |
| Eng. Abdulrahman Abu Eisha | Home | Title, `og:site_name`, "Also written as" line, JSON-LD `alternateName` |
| Abdelrahman Abu Eisha / Abu Aisha / Abd El Rahman / Abu Aishah | Home | "Also written as" line (About), JSON-LD `alternateName` |
| Full-Stack Software Engineer Cairo / Software Engineer Cairo | Home | Title, description, hero summary ("based in Cairo, Egypt"), About (Cairo paragraph), JSON-LD |
| Backend Engineer Egypt | Home | Hero summary ("back-end developer based in Cairo, Egypt"), services group "Backend & Integrations", FAQ (back end vs Full-Stack) |
| Laravel Developer Egypt / Laravel Developer Cairo / PHP Laravel Developer | Home | FAQ "Do you work as a freelance Laravel developer in Cairo?", hero summary (PHP and Laravel), description, Skills |
| React Developer Egypt | Home | Hero summary, service "High-performance React Front-ends", Skills |
| Freelance Laravel Developer / hire Laravel developer Egypt | Home | FAQ (freelance Laravel developer in Cairo; remote work outside Egypt), About (Cairo paragraph, freelance), contact section |
| Laravel REST API developer | Home | Service "REST API Design & Development": "Laravel REST API development…", FAQ "Can you build a Laravel REST API…?" |
| payment gateway integration Egypt | Home | Service: "Payment gateway integration in Egypt and worldwide (Paymob, Fawry, PayPal…)", FAQ (Paymob and Fawry), description |
| Technical SEO / GEO consultant | Home | Services group "Growth: SEO & GEO" (Technical SEO, GEO), FAQ (rankings, GEO), JSON-LD `knowsAbout` |

## Measured density (generated HTML, phase 6)

Counts of visible occurrences in the body (not `<head>`):

| Arabic home | | English home | |
| --- | --- | --- | --- |
| عبدالرحمن أبو عيشة | 6 | Abdulrahman Abu Eisha | 6 |
| مهندس برمجيات | 8 | Full-Stack Software Engineer | 8 |
| القاهرة | 6 | Cairo | 10 |
| مطور باك إند | 1 | back-end developer | 4 |
| تكامل بوابات الدفع | 4 | Payment gateway integration | 4 |
| Paymob / Fawry | 4 / 4 | Paymob / Fawry | 4 / 4 |
| مستقل | 6 | freelance | 7 |

Laravel, PHP and React appear many times because the skills, services and case files are about them. None is repeated mechanically.

## Rules for new copy

- State facts: years (4), technologies, services, the city. Never "best", "leading", "number one", or invented results.
- One phrase per sentence at most, and only where it reads naturally.
- Keep the name spelling **Abdulrahman Abu Eisha / عبدالرحمن أبو عيشة** in copy. Other spellings live only in `alternate_names`.
- Alt text describes the image (portrait: name + job title).
- After changing copy, re-check the title (≈ 60 characters) and description (≈ 155 characters) lengths.
