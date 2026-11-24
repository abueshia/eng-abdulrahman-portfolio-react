# عقد الـ API العام — v1

> مبني على الكود الفعلي (`routes/api.php`، الـ Controllers، الـ Resources، الـ FormRequests) وعلى ردود حقيقية من قاعدة البيانات المحلية محفوظة في [`docs/api-fixtures/`](docs/api-fixtures/) (فهرس الحالات وأكواد الحالة والـ headers في [`docs/api-fixtures/_index.json`](docs/api-fixtures/_index.json)).
> تاريخ الالتقاط: 2026-11-24 (اتعمل التقاط تاني بعد تنفيذ بنود §9 المعلَّمة ✅).
> ⚠️ العقد ده بيوصف الكود اللي في الريبو. الإنتاج (`eng-abdelrahman.dr-krok.com`) شغّال بنسخة أقدم (§8)، فالتعديلات المعلَّمة ✅ مش هتظهر هناك غير بعد الـ deploy.

## 0. أساسيات

| البند | القيمة |
| :-- | :-- |
| Base URL (إنتاج، شغّال ومُختبَر) | `https://eng-abdelrahman.dr-krok.com/api/v1` |
| Base URL (محلي) | `{APP_URL}/api/v1` |
| المصادقة | لا يوجد (لا API key ولا token) |
| Content-Type للطلبات | `application/json`، أو `multipart/form-data` عند رفع صورة في `POST /testimonials` |
| يُنصح بإرسال | `Accept: application/json` (عشان أخطاء الـ 404/429 ترجع JSON) |

### الـ Endpoints (7 فقط)

| الطريقة | المسار | Throttle | ملاحظات |
| :-- | :-- | :-- | :-- |
| GET | `/api/v1/projects` | `120` / دقيقة لكل IP (مشترك) | مُرقّم (paginated) |
| GET | `/api/v1/projects/{slug}` | ↑ نفس الحد | + `testimonials` + `related_projects` |
| GET | `/api/v1/experiences` | ↑ نفس الحد | قائمة كاملة بدون ترقيم |
| GET | `/api/v1/testimonials` | ↑ نفس الحد | قائمة كاملة بدون ترقيم |
| POST | `/api/v1/testimonials` | `3` طلبات / `60` دقيقة لكل IP | يُحفظ غير مفعّل (`is_active=false`) لحد ما يتوافق عليه من لوحة التحكم |
| GET | `/api/v1/faqs` | ↑ نفس الحد | قائمة كاملة بدون ترقيم |
| POST | `/api/v1/contact` | `5` طلبات / دقيقة لكل IP | يرسل إيميل إشعار للأدمن |

- الـ throttle بيتحسب بالـ IP، وأي طلب بيتحسب (حتى لو رجع 422). لو الفرونت بعت الـ POST من Vercel Function (server-side) بدل المتصفح، كل الزوار هيشتركوا في نفس الحد.
- **كل طلبات GET/HEAD** على الـ API بتتعد في عدّاد واحد: `120` طلب في الدقيقة لكل IP. كل رد GET فيه `X-RateLimit-Limit: 120` و`X-RateLimit-Remaining`. طلبات الـ POST مش بتتحسب في العدّاد ده، وليها الحد الخاص بيها بس.
- ⚠️ الـ build على Vercel بيبعت كل الطلبات من IP واحد، فلازم يفضل أقل من 120 طلب في الدقيقة (أو يستنى `Retry-After`).

---

## 1. الـ Envelope

**نجاح (قائمة أو عنصر واحد):**
```json
{ "code": 200, "success": true, "message": "Projects retrieved successfully", "data": ... }
```
**نجاح مع ترقيم** (`GET /projects` بس): نفس الشكل + مفتاح `pagination` قبل `data`:
```json
"pagination": {
  "current_page": 1,
  "first_page_url": "https://…/api/v1/projects?lang=ar&per_page=2&category=mnsat-taalmy&page=1",
  "prev_page_url": "",
  "next_page_url": "https://…/api/v1/projects?lang=ar&per_page=2&category=mnsat-taalmy&page=2",
  "last_page_url": "https://…/api/v1/projects?lang=ar&per_page=2&category=mnsat-taalmy&page=3",
  "total_pages": 3,
  "per_page": 2,
  "total_items": 6,
  "path": "https://…/api/v1/projects"
}
```
- `prev_page_url` / `next_page_url` بيرجعوا **`""` (نص فاضي) مش `null`** لما مايكونش في صفحة.
- الروابط الأربعة (`first`/`prev`/`next`/`last`) **بتحافظ على كل الـ query string** اللي في الطلب (`lang`، `per_page`، `type`، `category`…)، ورقم الصفحة بس هو اللي بيتغير. ممكن تتبعها زي ما هي (fixture: `projects.index.filtered-paginated.ar` و`…next-link.ar`).

**أخطاء:**

| الحالة | الشكل |
| :-- | :-- |
| 404 مشروع (slug مش موجود أو غير منشور) | `{"code":404,"success":false,"message":"Project not found"}` |
| 404 مسار مش موجود (زي `/api/v1/categories` المعلّق) | شكل Laravel الافتراضي: `{"message":"The route api/v1/categories could not be found."}` — **من غير** `code`/`success` |
| 422 تحقق | `{"code":422,"success":false,"message":"<أول خطأ>","errors":{"field":["…"]}}` |
| 429 تجاوز الحد | شكل Laravel الافتراضي: `{"message":"Too Many Attempts."}` + headers: `Retry-After` (بالثواني: `60` لطلبات GET وللتواصل، و`3600` للآراء)، `X-RateLimit-Limit`، `X-RateLimit-Remaining: 0` (fixtures: `public-get.429`، `contact.store.429`، `testimonials.store.429`) |
| 500 | شكل Laravel الافتراضي |

> ⚠️ مع `APP_DEBUG=true` (وده **الوضع الحالي على الإنتاج**) أخطاء 404-route و429 و500 بترجع كمان `exception` و`file` و`line` و`trace` (فيها مسارات السيرفر). شِلتها من ملفات الـ fixtures.

### Headers الردود (GET ناجح فقط)
`ETag: "<sha1>"`، `Cache-Control: public, max-age=60, s-maxage=300`، `Vary: Accept-Language, Origin`، `X-RateLimit-Limit: 120`، `X-RateLimit-Remaining`.
لو بعت `If-None-Match` بنفس الـ ETag هيرجع `304` من غير body.

---

## 2. اللغة (`ApiSetting` middleware)

ترتيب تحديد اللغة:
1. `?lang=` (أو الاسم البديل `?locale=`): بياخد أول حرفين، فـ`ar-EG` تبقى `ar`. لو القيمة مش `ar`/`en` بيتجاهلها ويروح للخطوة 2.
2. هيدر `Accept-Language`: بياخد **أول حرفين من الهيدر كله** (`ar-EG,ar;q=0.9` تبقى `ar`، و`fr-FR` تبقى `en`). مش بيحلل قايمة الأولويات (q-values).
3. الافتراضي `en`.

`?lang` ليه أولوية على الهيدر. الـ fixtures `projects.index.accept-language-ar` و`-fr` بتأكد الكلام ده.

**الـ fallback لو الترجمة ناقصة** (Spatie Translatable، `app.fallback_locale = ar`):
- طالب `en` والنص الإنجليزي فاضي: بيرجع **النص العربي**.
- طالب `ar` والنص العربي فاضي: بيرجع **`""`** (مفيش fallback للإنجليزي).
- **استثناء — الآراء (testimonials):** بتستخدم `localized()` بـ fallback في الاتجاهين، وبعدين أي ترجمة موجودة. مثال حقيقي: الرأي `id=7` بيرجع الاسم بالعربي `"م. أحمد علي"` حتى مع `lang=en`.
- الـ labels الخاصة بالـ enums (`project_type_label`، `employment_type_label`، `category_label`) بتتترجم حسب اللغة.

---

## 3. المشاريع

### `GET /api/v1/projects`

| Param | النوع | الافتراضي | السلوك |
| :-- | :-- | :-- | :-- |
| `page` | int | 1 | |
| `per_page` (أو `limit`) | int | 9 | محصور بين 1 و50. ⚠️ لو القيمة مش رقم (`abc`) بتتحول لـ 0 وبعدين **1** |
| `type` | enum | — | قيمة من `project_type` (تحت). القيمة الغلط **بتتجاهل بصمت** (بيرجع الكل) |
| `category` | slug أو id | — | لو رقم بيقارن بـ `category_id`، وإلا بالـ `slug`. slug مش موجود يرجّع قايمة فاضية |
| `category_id` | int | — | نفس الكلام (`category_id` ليه الأولوية لو اتبعت الاتنين) |
| `technology` / `technology_id` | slug أو id | — | المشاريع اللي فيها التقنية دي |
| `featured` | bool (`1`/`true`) | — | المميزة بس. ⚠️ حالياً **مفيش ولا مشروع مميز** في البيانات، فبيرجع `[]` |
| `sort` | — | — | **مش مدعوم** (بيتجاهل). |

- **بيرجع إيه:** المنشور بس، يعني `is_active = 1` و`status = published`. (فيه 14 من أصل 18 في البيانات.)
- **الترتيب الثابت:** `sort_order ASC`، وبعدين `completed_at DESC`، وبعدين `id DESC`.
- كل عنصر فيه `category` (object أو `null`) و`technologies` (array). **مفيهوش `testimonials`**.

### `GET /api/v1/projects/{slug}`
- نفس حقول عنصر القايمة + `testimonials` (الآراء المفعّلة المرتبطة بالمشروع، بنفس ترتيب الآراء) + `related_projects`.
- `related_projects`: لحد **3** مشاريع منشورة (من غير المشروع نفسه) بتشترك في **نفس التصنيف أو تقنية واحدة على الأقل**، مرتبة بنفس ترتيب القايمة (مش حسب درجة التشابه). كل عنصر منها بنفس شكل عنصر القايمة (من غير `testimonials`).
- لو الـ slug مش موجود، أو المشروع غير منشور أو غير مفعّل: `404 Project not found` (الـ fixtures: `projects.show.404-missing` و`404-unpublished`).

### حقول المشروع

| الحقل | النوع | ممكن null/فاضي؟ | ملاحظات |
| :-- | :-- | :-- | :-- |
| `id` | int | لا | |
| `slug` | string | لا | ⚠️ بعض الـ slugs مش مطابقة للعنوان (تحت في §8) |
| `title` | string | لا | |
| `subtitle`، `short_description`، `description` | string | ممكن `""` | نص خام، ممكن يكون فيه `\r\n` |
| `challenge` | **array** من `{title: string, description: string}` | ممكن `[]` | **دايماً array**: `[]` لما يكون فاضي. ولو القيمة القديمة نص عادي، بترجع عنصر واحد `title` بتاعه `""` |
| `solution`، `results` | string | ممكن `""` | أحياناً نقط مفصولة بـ `\r\n` (مش array) |
| `metrics` | array | ممكن `null` | حالياً `[]` في كل المشاريع |
| `client_name`، `role_title`، `duration` | string | ممكن `""` | حالياً `""` في كل المشاريع |
| `project_type` | enum string | لا | تحت |
| `project_type_label` | string | لا | مترجم |
| `status` | string | لا | دايماً `"published"` في الـ API العام |
| `live_url` | string | ممكن `null` | |
| `repo_url` | string | ممكن `null` | حالياً `null` في الكل |
| `case_study_url`، `started_at` | — | **دايماً `null`** | ⚠️ العمودين **مش موجودين** في جدول `projects` |
| `completed_at` | `YYYY-MM-DD` | ممكن `null` | |
| `is_featured` | bool | لا | |
| `sort_order` | int | لا | |
| `cover_image` | absolute URL | ممكن `null` | |
| `gallery` | array من absolute URLs (strings) | ممكن `[]` | تحت |
| `category` | object | ممكن `null` | تحت |
| `technologies` | array من Technology | ممكن `[]` | تحت |
| `testimonials` | array من Testimonial | — | في `show` بس |
| `related_projects` | array من Project | — | في `show` بس |

**غير مُتاح في الـ API** (موجود في قاعدة البيانات بس مش بيرجع): `meta_title`، `meta_description`، `video_url`، `created_at`، `updated_at`، `is_active`. مفيش `published_at` أصلاً.

### "النوع" مقابل "التصنيف"

| | **النوع** `project_type` | **التصنيف** `category` |
| :-- | :-- | :-- |
| المصدر | PHP Enum ثابت في الكود (`ProjectTypeEnum`) | جدول `categories` بيتدار من لوحة التحكم (ومشترك مع المدونة) |
| الشكل في الرد | `project_type` (string) + `project_type_label` (مترجم) | object: `{id, name, slug, description, icon_class, sort_order, image}` أو `null` |
| الفلترة | `?type=<value>` | `?category=<slug أو id>` أو `?category_id=<id>` |
| القيم | `web_app`، `saas`، `api_backend`، `ecommerce`، `cms_dashboard`، `full_stack` | ديناميكية. المستخدم حالياً: `enterprise-saas`، `informational-showcase-websites`، `mnsat-taalmy`، `mobile-applications` |
| endpoint للقايمة | لأ | لأ (`/categories` **معلّق** محلياً ويرجّع 404). ⚠️ على الإنتاج `/categories` لسه شغّال (§7) |

الـ labels بتاعة `project_type` (en | ar):
`web_app` = Web Application | تطبيق ويب متكامل، `saas` = SaaS Platform | منصة سحابية (SaaS)، `api_backend` = RESTful API & Backend | نظام باك إند و REST API، `ecommerce` = E-Commerce System | منصة تجارة إلكترونية، `cms_dashboard` = CMS & Admin Dashboard | لوحة تحكم ونظام إدارة محتوى، `full_stack` = Full-Stack Solution | نظام برمجي متكامل (Full-Stack).

- `category.image` و`category.icon_class` حالياً `null`. و`projects_count` **مش بيرجع**.

### Technology (جوه المشروع وجوه الخبرة)
`{id, name, slug, category, category_label, icon_class, brand_color, proficiency_percent, years_experience, is_featured, sort_order, image}`
- `category` قيمة من: `backend`، `frontend`، `database`، `devops`، `architecture`، `testing`، `tools`.
- ممكن يكونوا `null`: `icon_class`، `brand_color`، `years_experience` (float)، `image`.
- الترتيب جوه المشروع: حسب ترتيب الربط (pivot) في قاعدة البيانات، مفيش ترتيب صريح.

### الصور
- **الروابط مطلقة (absolute) دايماً**، ومبنية من `APP_URL` + `/storage/{media_id}/{file_name}`.
  - **الإنتاج:** الصور بتترجع على **`https://icodetech7.com/storage/...`**، وده **دومين مختلف** عن دومين الـ API (`eng-abdelrahman.dr-krok.com`). جربت صورة غلاف ورجعت `200`.
  - **المحلي:** `http://localhost:8003/storage/...`.
- **`cover_image`:** صورة واحدة (collection `projects` من نوع singleFile) أو `null`. كل المشاريع المنشورة حالياً عندها غلاف، فمفيش حالة "مشروع من غير صورة" في البيانات. اتأكدت من الكود إن القيمة بتبقى `null` و`gallery` بتبقى `[]` في الحالة دي.
- **`gallery`:** array من **strings** (روابط بس)، **مفيش thumbnails ولا مقاسات ولا alt ولا width/height**، وده الملف الأصلي زي ما اترفع (ممكن يكون كبير).
  - العدد مفتوح (أكبر عدد حالياً 17، وأقل عدد 3).
  - الترتيب: حسب `order_column` في جدول media، يعني ترتيب الرفع.
  - الصيغ اللي لوحة التحكم بتقبلها: `jpg, jpeg, png, webp, svg` بحد أقصى 5MB للصورة. **يعني ممكن تيجي SVG.**
  - أسماء الملفات خام (مثلاً `WhatsApp-Image-2026-11-24-at-2.42.40-AM.jpeg`)، فعامل الرابط كـ URL كامل.

### بخصوص الـ sitemap
مفيش `updated_at` ولا `published_at` في الـ API. المتاح: `slug` و`completed_at` بس، وكل الـ slugs ممكن تتجاب في طلب واحد بـ `?per_page=50` (العدد الحالي 14).

---

## 4. الخبرات — `GET /api/v1/experiences`
- مفيش params. بيرجع **المفعّل بس** (`is_active=1`)، من غير ترقيم.
- **الترتيب:** `sort_order ASC`، وبعدين `is_current DESC`، وبعدين `start_date DESC`. في البيانات الحالية ده معناه **من الأقدم للأحدث** (الوظايف الحالية في الآخر)، لأن `sort_order` متسجّل بالترتيب ده.

| الحقل | النوع | null/فاضي؟ | ملاحظات |
| :-- | :-- | :-- | :-- |
| `id` | int | لا | |
| `company_name`، `role_title` | string | لا | |
| `location`، `summary` | string | ممكن `""` | |
| `achievements` | **string** | ممكن `""` | **نص واحد** النقط فيه مفصولة بـ `\n` (مش array) |
| `highlights` | string | — | **نسخة مطابقة** من `achievements` |
| `employment_type` | enum | لا | `full_time`، `part_time`، `contract`، `freelance`، `remote` |
| `employment_type_label` | string | لا | مترجم (مثلاً Full-Time / دوام كامل) |
| `company_url` | string | ممكن `null` | |
| `start_date` | `YYYY-MM-DD` | لا | |
| `end_date` | `YYYY-MM-DD` | **`null` لما `is_current=true`** | |
| `is_current` | bool | لا | حالياً فيه خبرتين حاليتين (`id` 9 و10) |
| `sort_order` | int | لا | |
| `company_logo` | absolute URL | ممكن `null` | حالياً `null` في الكل |
| `technologies` | array من Technology (object كامل فيه `name`) | ممكن `[]` | |

---

## 5. آراء العملاء

### `GET /api/v1/testimonials`
- مفيش params. بيرجع **المفعّل بس**، من غير ترقيم، **مرتب** `sort_order ASC` وبعدين `id ASC`. الآراء اللي بتتبعت من الموقع مش بتظهر هنا قبل موافقة الأدمن.

| الحقل | النوع | null/فاضي؟ | ملاحظات |
| :-- | :-- | :-- | :-- |
| `id` | int | لا | |
| `name` = `client_name` | string | لا | اسمين لنفس القيمة |
| `name_job` = `client_role` | string | ممكن `null` | اسمين لنفس القيمة |
| `company_name` | string | ممكن `null` | حالياً موجود في الكل |
| `description` = `testimonial` | string | لا | اسمين لنفس القيمة |
| `rating` | int 1–5 | لا | |
| `is_featured` | bool | لا | |
| `sort_order` | int | لا | |
| `source` | string | لا | `"dashboard"` أو `"website"` |
| `avatar` | absolute URL | ممكن `null` | حالياً `null` في الكل |
| `project` | `{id, title, slug}` | ممكن `null` | بيرجع **بس لو المشروع منشور ومفعّل**. لو المشروع مؤرشف أو مسودة أو غير مفعّل، أو مفيش مشروع أصلاً، بيرجع `null`. يعني الـ slug هنا مش هيرجّع 404 أبداً |

### `POST /api/v1/testimonials` — throttle 3/60min
الـ Body يا إمّا JSON، يا إمّا `multipart/form-data` لو هتبعت صورة. ممكن تبعت النصوص كـ **string** (تتحفظ في لغة `locale`) أو كـ `{ar, en}`.

| الحقل | إجباري | القواعد |
| :-- | :-- | :-- |
| `name` | ✅ | string بطول 2–80، أو `{ar?, en?}` (كل واحد string بطول 2–80) ولازم واحد منهم على الأقل. **أسماء بديلة:** `client_name` |
| `description` | ✅ | string بطول 10–1000، أو `{ar?, en?}` (كل واحد بطول 10–1000) ولازم واحد على الأقل. **أسماء بديلة:** `testimonial`، `comment`، `message`، `content` |
| `name_job` | ❌ | string أو `{ar?, en?}`، لحد 100. **أسماء بديلة:** `client_role`، `job_title`، `role` |
| `company_name` | ❌ | string أو `{ar?, en?}`، لحد 100. **اسم بديل:** `company` |
| `rating` | ❌ (افتراضياً 5) | integer من 1 لـ 5 |
| `project_id` | ❌ | integer موجود في `projects.id` (حتى لو المشروع مش منشور) |
| `image` أو `avatar` | ❌ | ملف `jpg, jpeg, png, webp` لحد 5MB |
| `locale` | ❌ | `ar` أو `en`. لغة الحفظ للنصوص اللي جاية كـ string. الافتراضي لغة الطلب (`lang`/`Accept-Language`) |
| `consent` | ❌ | لو اتبعت لازم يكون accepted (`true`/`1`/`yes`/`on`) |
| `website`، `honeypot` | ❌ | **فخ للبوتات (honeypot):** لازم يكونوا فاضيين أو مايتبعتوش |
| `hp` | ⛔ | prohibited: وجوده لوحده بيرفض الطلب |

- **201:** `{"code":201,"success":true,"message":"Thank you! Your review has been submitted and is pending approval.","data":<Testimonial>}`. الرأي بيتحفظ دايماً بـ `is_active=false` و`is_featured=false` و`source="website"`.
- **422:** شوف `testimonials.store.422-empty.en.json` و`422-invalid.ar.json`. كل الرسايل مترجمة بالكامل حسب لغة الطلب، بما فيها اسم الحقل (مثلاً `"يجب أن تكون قيمة التقييم بين 1 و 5."`). اختبار بيتأكد إن مفيش أي مفتاح ترجمة خام أو placeholder باقي في الرسايل.

---

## 6. الأسئلة الشائعة — `GET /api/v1/faqs`
- بيرجع المفعّل بس، من غير ترقيم، **مرتب** `sort_order ASC` وبعدين `id ASC`. حالياً فيه 13 سؤال.
- `?category=` **مش مدعوم** (بيتجاهل، والـ ETag بيطلع مطابق للطلب من غير الفلتر).
- الحقول: `id` (int)، `question` (string)، `answer` (string)، `category` (string حر، مش enum. القيم الحالية: `architecture`، `general`، `process`. ممكن يكون `null`)، `sort_order` (int).

---

## 7. التواصل — `POST /api/v1/contact` (throttle 5/min)

| الحقل | إجباري | القواعد |
| :-- | :-- | :-- |
| `name` | ✅ | string لحد 150 |
| `email` | ✅ | email لحد 150 |
| `message` | ✅ | string لحد 5000 |
| `phone` | ❌ | string لحد 50 |
| `subject` | ❌ | string لحد 255 |
| `service` | ❌ | string لحد 150 |
| `budget_range`، `timeline` | ❌ | string لحد 120 |
| `type` | ❌ | `general_contact` (الافتراضي)، `project_inquiry`، `job_offer`، `consultation` |
| `website`، `honeypot` | ❌ | فخ للبوتات: لازم يكونوا فاضيين |

- **201:** `data` = `{id, name, email, phone, subject, service, budget_range, timeline, type, type_label, message, created_at (ISO-8601)}`. الحقول الاختيارية بترجع `null` لو مااتبعتتش.
- **422:** `contact.store.422-*.json`. الرسايل مترجمة بالكامل (مثلاً `type` بالعربي: `"القيمة المختارة في النوع غير صالحة."`).
- **429:** `contact.store.429.json` (`Retry-After: 60`).

---

## 8. CORS والإتاحة

**`config/cors.php`:**
- `paths`: `['api/*', 'sanctum/csrf-cookie']`، يعني ✅ بيشمل `api/*`.
- `allowed_origins` = مجموع:
  - `FRONTEND_URL` (من env، والافتراضي vercel)
  - `CORS_ALLOWED_ORIGINS` (من env، قايمة مفصولة بفواصل)
  - ثلاثة origins مكتوبين ثابت في الكود: `https://eng-abdulrahman-abu-eisha.vercel.app`، `http://localhost:5173`، `http://127.0.0.1:5173`
- `allowed_origins_patterns`: `[]`. يعني **روابط الـ Preview على Vercel مش مسموحة**.
- `allowed_methods`: `GET, POST, OPTIONS, HEAD`. `allowed_headers`: `Content-Type, Accept, Accept-Language, Origin, X-Requested-With, If-None-Match` (مفيش `Authorization`).
- `exposed_headers`: `ETag, Cache-Control, X-RateLimit-Limit, X-RateLimit-Remaining`. `supports_credentials: false`. `max_age: 86400`.

**النتيجة:** ✅ `https://eng-abdulrahman-abu-eisha.vercel.app` و✅ `http://localhost:5173` مسموحين:
- محلياً: preflight رجع `204` مع `Access-Control-Allow-Origin` المطابق.
- على الإنتاج: GET وpreflight رجعوا نفس الـ origin في الهيدر.
- أي origin تاني (مثلاً `https://example.com`) مابيرجعلوش الهيدر.

**الإتاحة وقت الـ build على Vercel:**
- ✅ الرابط العام **شغّال**: `https://eng-abdelrahman.dr-krok.com/api/v1` (`/projects` و`/faqs` رجعوا 200، في حوالي 1.6–2.4 ثانية).
- ⚠️ **الإنتاج شغّال بنسخة كود مختلفة عن المحلي**: المسارات المعلّقة محلياً (`settings`، `home`، `technologies`، `credentials`، `services`، `stats`، `blogs`، `categories`) كلها بترجع **200** على الإنتاج. شكل المشروع هو هو (نفس المفاتيح، و`challenge` array).
- ⚠️ الإنتاج شغّال بـ **`APP_DEBUG=true`**: الـ 404 بيرجّع trace ومسار السيرفر.

### ملاحظات بيانات (مش كود)
- slugs مش مطابقة للمحتوى: المشروع `id=11` (Steel Tech) الـ slug بتاعه `high-throughput-ecommerce-api`، والمشروع `id=10` (24Courses، **مؤرشف**) الـ slug بتاعه `enterprise-erp-inventory-platform`. والرأي `id=5` مربوط بالمشروع 10 المؤرشف ده، فالـ API بيرجّع له `project: null`.
- slug التصنيف `mnsat-taalmy` مكتوب عربي بحروف لاتينية.
- مفيش ولا مشروع `is_featured=true`.
- `achievements` في الخبرة `id=6` (en) فيها كلام زيادة: `"…successfully\nAch 2Helped…"`.
- ScopeERP نوعه `ecommerce`.

---

## 9. نواقص في الباك إند

مرتبة بالأولوية. البنود المعلَّمة ✅ اتنفذت عليها اختبارات (`tests/Feature/API/PublicApiHardeningTest.php` و`tests/Feature/FrontendDeployHookTest.php`). الباقي لسه مقترح بس.

| # | المشكلة | التعديل المقترح |
| :-: | :-- | :-- |
| 1 | **`APP_DEBUG=true` على الإنتاج** بيكشف مسارات السيرفر والـ stack traces | على السيرفر: `APP_DEBUG=false` وبعدين `php artisan config:cache`. (إعداد سيرفر، مش كود) |
| 2 | الإنتاج مختلف عن الريبو (مسارات معلّقة محلياً لسه شغّالة على الإنتاج) | قرار: يا تعمل deploy للفرع الحالي، يا ترجّع المسارات. والفرونت مايعتمدش على المسارات المعلّقة |
| 3 ✅ | روابط الـ pagination كانت بتسقط `lang`/`per_page`/الفلاتر | **اتنفذ:** `appends($request->query())` في `ProjectController::index`، و`PaginationCollection` بقى يبني `first`/`last` بـ `url()` |
| 4 | أخطاء 404-route و429 و500 مش بنفس الـ envelope | `Handler::register()`: `renderable` لـ `api/*` يرجّع `{code, success:false, message}` بس |
| 5 ✅ | رسايل تحقق كانت بترجع كمفاتيح خام | **اتنفذ:** ملفات `validation.php` (ar/en) كانت فاضية واتملت. اتضاف `min_string` وأسماء الحقول الناقصة في `portfolio_validation.php`. و`withValidator` في طلب الآراء بقى يبعت اسم الحقل |
| 6 | مفيش حقول SEO وتواريخ للـ sitemap | إضافة `meta_title`، `meta_description`، `updated_at` (ISO)، `video_url` لـ `ProjectResource`. وحذف `started_at`/`case_study_url` (مالهمش عمود) أو إضافة migration ليهم |
| 7 ✅ | الـ `challenge` نوعه كان بيتغير (`""` أو array) | **اتنفذ:** normalize في `ProjectResource`، فبقى دايماً array |
| 8 | المعرض بيرجّع الأصل من غير مقاسات ولا alt | `registerMediaConversions` (`thumb` بعرض 480 و`large` بعرض 1280، صيغة webp، على queue)، وإضافة مفتاح **جديد** `gallery_images: [{url, thumb, large, alt, width, height}]` مع إبقاء `gallery` كما هو عشان مايتكسرش حاجة |
| 9 | مفيش endpoint لتصنيفات المشاريع | `GET /api/v1/project-categories`: التصنيفات اللي فيها مشاريع منشورة + `projects_count` (موجود جاهز في `CategoryResource` عبر `whenCounted`) |
| 10 ✅ | رأي مربوط بمشروع غير منشور (لينك ميت) | **اتنفذ:** `Project::isPublished()`، و`TestimonialResource` بيرجّع `null` لو المشروع مش منشور |
| 11 ✅ | Vercel مكانش بيعمل rebuild لما المحتوى يتغير | **اتنفذ:** شوف §10 |
| 12 | روابط Preview على Vercel مرفوضة من CORS | `allowed_origins_patterns => ['#^https://eng-abdulrahman-abu-eisha-[a-z0-9-]+\.vercel\.app$#']` |
| 13 | الصور على دومين مختلف (`icodetech7.com`) عن دومين الـ API | توحيد `APP_URL` (أو `filesystems.disks.public.url`) على الإنتاج مع الدومين اللي هيفضل ثابت |
| 14 | `?category=` على FAQs بيتجاهل، مع إن `FaqService::getActive(?string $category)` بيدعمه | تمرير `$request->query('category')` في `FaqController::index` |
| 15 | `per_page=abc` بيتحول لـ 1 | `filter_var(..., FILTER_VALIDATE_INT)` مع fallback لـ 9 |
| 16 ✅ | الـ GETs مكانش عليها rate limit فعلي | **اتنفذ:** السبب كان إن `RouteServiceProvider` بيستدعي `->middleware('ApiSetting')` تاني مرة، فبيمسح مجموعة `api` كلها (ومعاها `throttle:api`). اتصلّحت لـ `middleware(['api', 'ApiSetting'])`، والـ limiter `api` بقى 120 في الدقيقة لكل IP لطلبات GET/HEAD بس (`RouteServiceProvider::PUBLIC_API_READS_PER_MINUTE`) |
| 17 | ملاحظات البيانات في §8 (slugs غلط، "Ach 2"، مفيش مشروع مميز) | تتصلّح من لوحة التحكم (تغيير الـ slug هيكسر أي روابط قديمة) |

---

## 10. Vercel Deploy Hook (إعادة بناء الفرونت تلقائياً)

- **الإعداد:** `config/services.php` ← `services.vercel.deploy_hook_url` = `env('VERCEL_DEPLOY_HOOK_URL')`، و`deploy_hook_debounce_seconds` = `env('VERCEL_DEPLOY_HOOK_DEBOUNCE_SECONDS', 60)`. الرابط **مش مكتوب في الكود**. لو المتغير فاضي، الميزة كلها بتبقى متوقفة.
- **امتى بيتنادى:** عن طريق observers على أحداث Eloquent `saved`/`deleted`:
  - `Project` و`Experience` و`Faq`: أي حفظ أو حذف (`FrontendDeployObserver`).
  - `Testimonial`: بس لو الرأي معتمد (`is_active`)، أو اتغيّرت حالة الاعتماد، أو اتحذف رأي معتمد (`TestimonialDeployObserver`). الآراء الجديدة اللي جاية من الموقع (غير معتمدة) مش بتعمل build.
- **الـ Debounce:** `Cache::add` بقفل مدته 60 ثانية (`FrontendDeployHook::LOCK_KEY`)، يعني نداء واحد بالكتير كل دقيقة. أول تغيير هو اللي بيعمل الـ build، وأي تغييرات تانية في نفس الدقيقة مش بتعمل build جديد.
- **التنفيذ:** `TriggerFrontendDeployJob` بيعمل `POST` على الرابط (اتصال 3 ثواني، timeout 5 ثواني، محاولة واحدة بس). أي فشل بيتسجل في الـ log **من غير الرابط**، ومش بيوقف عملية الحفظ أبداً. مع `QUEUE_CONNECTION=sync` الـ job بيتنفذ جوه نفس الطلب.
- **حدود معروفة:**
  - إعادة الترتيب (`reorder`) بتستخدم `query()->update()`، وده مش بيطلق أحداث Eloquent، فمش بيعمل build.
  - التغييرات اللي بتحصل في نفس الدقيقة بعد أول build مش هتظهر غير مع أول تغيير بعد ما الدقيقة تخلص.
- **الاختبارات:** `phpunit.xml` بيفرض إن `VERCEL_DEPLOY_HOOK_URL` يكون فاضي، فالاختبارات مش ممكن تنادي الهوك الحقيقي.

