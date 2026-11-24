# تقرير ربط الفرونت بالـ API — المرحلة 7 (الجزء 1)

> المرجع: `API_CONTRACT.md` و`FRONTEND_HANDOFF.md` (منسوخين من ريبو الباك إند) والردود الحقيقية في `docs/api-fixtures/`.
> مشروع الباك إند لم يُعدَّل. كل ما يحتاج تعديلاً هناك مكتوب في §3.

## 1. ما تم ربطه

| المورد | المسار | ملاحظات |
| :-- | :-- | :-- |
| المشاريع | `GET /projects` (كل الصفحات بـ `per_page=50`)، `GET /projects/{slug}` | القائمة والتفاصيل والمشاريع ذات الصلة والـ sitemap وCreativeWork |
| الخبرات | `GET /experiences` | `achievements` تتحول لقائمة نظيفة |
| التوصيات | `GET /testimonials`، `POST /testimonials` | multipart، النصوص تحت مفتاح لغة الصفحة |
| الأسئلة الشائعة | `GET /faqs` | القسم + FAQPage JSON-LD + `llms.txt` |
| التواصل | `POST /contact` | بدون relay واتساب ما دام المورد حياً |

الباقي (settings والخدمات والإحصائيات والـ About والمهارات) بقي static كما هو.

## 2. الفروقات بين العقد وما كان الفرونت يتوقعه (وكيف عولجت)

| # | الفرق | المعالجة في الفرونت |
| :-: | :-- | :-- |
| 1 | المشروع: `short_description` بدل `summary`، و`project_type`/`project_type_label` بدل `type`، و`challenge[{title, description}]` بدل `challenges[{title, body}]`، و`repo_url` بدل `github_url` | الـ mapper (`services/api/mappers/projects.js`) |
| 2 | لا يوجد `architecture` ولا `decisions` ولا `preview_image` ولا `cover_alt` ولا alt للمعرض | المخطط المعماري لا يظهر للمشاريع الحقيقية (يظهر تلقائياً لو أضيفت الحقول). شاشة الـ hover = أول صورة في المعرض. الـ alt = العنوان، وفي المعرض العنوان مرقّماً `(1/17)` |
| 3 | `description`/`solution`/`results` نصوص خام بـ `\r\n`، وفيها بقايا محرر `[cite: 54, 56, 60, 61]` | تُقسَّم لفقرات وتُحذف البقايا. `results` أصبحت فقرة "النتائج" تحت الحل |
| 4 | `metrics` دائماً `[]`، و`client_name`/`role_title`/`duration` دائماً `""`، و`case_study_url`/`started_at` دائماً `null` | المقاييس والحقائق الفارغة تختفي (لا "No data" ولا أرقام مخترعة) |
| 5 | لا يوجد `updated_at` ولا `published_at` | `lastmod` في الـ sitemap و`dateCreated` في JSON-LD = `completed_at`. الرئيسية = تاريخ البناء |
| 6 | الترقيم: `total_pages`/`total_items` بدل `last_page`/`total`، والافتراضي 9 | الـ mapper يوحّد الشكل، والقائمة تُجلب كلها (`per_page=50`) ويُتتبَّع الترقيم |
| 7 | الخبرات: `achievements` نص واحد بـ `\n` (و`highlights` نسخة منه)، و`end_date` = `null` للحالية | تطبيع: مصفوفة أو نص، trim، حذف علامات القوائم (`-`، `•`، `1.`…)، وحذف الأسطر الفارغة |
| 8 | `employment_type` فيه `remote` (ليس نوع توظيف) | يُعرض `employment_type_label` من الـ API كما هو |
| 9 | التوصيات: `name_job`/`company_name`/`description` بدل `role`/`company`/`quote`، ولا يوجد `status` (القائمة معتمدة فقط) | الـ mapper يقرأ الأسماء البديلة (`client_name`، `client_role`، `testimonial`) كاحتياط |
| 10 | التوصيات داخل `GET /projects/{slug}` بدون مفتاح `project` (عكس القائمة) | `project: null` |
| 11 | `POST /testimonials`: الحقول `name`/`name_job`/`company_name`/`description` (نص أو `{ar, en}`) و`image`، و`hp` **ممنوع** (وجوده يرفض الطلب) | النموذج يرسل `name[<locale>]`… و`locale` و`image` و`consent=1`. الـ honeypot هو `website`، وإن امتلأ يظهر النجاح ولا يُرسل شيء. `hp` لا يُرسل أبداً |
| 12 | حدود المراجعة: الاسم 2–80، الرأي 10–1000، المسمى والشركة ≤ 100 واختياريان، والتقييم اختياري (افتراضياً 5) | التحقق في المتصفح على نفس الحدود. التقييم إجباري في الواجهة عمداً |
| 13 | `project_id` يقبل أي مشروع حتى غير المنشور | القائمة في النموذج تعرض المشاريع المنشورة فقط |
| 14 | `POST /contact`: `type` enum (`general_contact`، `project_inquiry`، `job_offer`، `consultation`) لا يطابق أنواع المشاريع في settings | `type` يُشتق من الاختيار (استشارة ← `consultation`، أخرى ← `general_contact`، غيرها ← `project_inquiry`) واسم النوع يُرسل في `service` |
| 15 | أخطاء 422 بمفاتيح مثل `name.ar`، و429 و404-route بشكل Laravel الافتراضي `{message}` | المفتاح يُطابق حقله (`name.ar` ← الاسم، `avatar` ← الصورة)، و429 يعرض "حاول بعد قليل" (مع `Retry-After`: ساعة للمراجعات) |
| 16 | `rating` خارج 1–5 أو `avatar` ليس رابط http(s) | النجوم تختفي، والأفاتار المولّد بالحرفين يظهر |

## 3. نواقص في الباك إند (للتنفيذ هناك)

مرتبة بالأولوية:

1. **🚨 الإنتاج غير قابل للوصول من جهاز التطوير وقت التنفيذ:** `eng-abdelrahman.dr-krok.com` (162.0.216.203) و`icodetech7.com` انتهت مهلة الاتصال على 443 و80، بينما مواقع أخرى تعمل. لذلك نُفِّذ البناء على الباك إند المحلي (`localhost:8003`، نفس كود العقد). **لازم التأكد أن Vercel يصل للإنتاج** (أول deploy سيقول، لأن البناء يفشل برسالة واضحة إذا لم يصل).
2. **الإنتاج يعمل بنسخة أقدم من الريبو و`APP_DEBUG=true`** (العقد §8 و§9 بند 1–2): deploy للفرع الحالي و`APP_DEBUG=false` قبل ربط Vercel، لأن الفرونت مبني على شكل الريبو.
3. **حقول SEO للمشاريع:** `meta_title` و`meta_description` و`updated_at` (ISO) في `ProjectResource` (العقد §9 بند 6). الآن العنوان = `title` والوصف = `short_description` و`lastmod` = `completed_at`.
4. **الصور:** المعرض والغلاف ملفات أصلية كبيرة (WhatsApp JPEG) بدون مقاسات ولا alt. هذا يضر LCP في صفحة المشروع. المطلوب: `registerMediaConversions` (webp 480/1280) ومفتاح جديد `gallery_images: [{url, thumb, large, alt, width, height}]` و`cover_image_alt` (العقد §9 بند 8).
5. **دومين الصور مختلف عن دومين الـ API** (`icodetech7.com`): توحيد `APP_URL`. وأي build على API محلي يُنتج روابط `localhost` فيرفضه `verify-dist` (مقصود).
6. **CORS لروابط Preview على Vercel** (`allowed_origins_patterns`)، وإلا فالنماذج والـ refetch على الـ previews محجوبة.
7. **شكل الأخطاء موحّد** لـ 404-route و429 و500 (`{code, success:false, message}`).
8. **التوصيات داخل المشروع** ترجع بدون `project`. يفضّل نفس شكل القائمة.
9. **`project_id` في `POST /testimonials`** يقبل مشروعاً غير منشور: يفضّل `exists` مع شرط النشر.
10. **حقول المخطط المعماري** (`architecture{nodes, edges}` و`decisions[]`) غير موجودة: قسم "Architecture" في صفحة المشروع لا يظهر. اختياري، ولو أضيفت يظهر تلقائياً.

### ملاحظات بيانات (تُصلح من لوحة التحكم)
- slug المشروع 11 (Steel Tech) هو `high-throughput-ecommerce-api`. تغييره يحتاج redirect 308 في `vercel.json`.
- الخبرة `id=6` (en): `"…successfully\nAch 2Helped…"` (كلمة "Ach 2" زائدة).
- بقايا `[cite: …]` في نصوص بعض المشاريع (الفرونت يحذفها، والأفضل حذفها من المصدر).
- لا يوجد مشروع `is_featured`، وكل التوصيات بدون صورة (`avatar: null`)، والتوصية `id=5` مربوطة بمشروع مؤرشف فترجع `project: null`.
- التوصية `id=7` تظهر بالاسم العربي في الصفحة الإنجليزية (fallback الترجمة).
- إعادة الترتيب في لوحة التحكم لا تستدعي الـ Deploy Hook: يلزم rebuild يدوي بعدها.

## 4. البناء والتحقق (ما تم تشغيله)

- `npm run lint`: نجح بدون تحذيرات.
- `npm run test`: 36 ملفاً و202 اختباراً ناجحاً. اختبارات الـ mapping على الـ fixtures الحقيقية، والخبرات بـ 1 و2 و4 و8 سجلات ونصوص طويلة، وإعادة بناء الـ director عند وصول البيانات، و201/422/429/خطأ الشبكة في النموذجين.
- `npm run build` على الـ API الحقيقي المحلي (`VITE_API_URL=http://localhost:8003/api/v1`):
  - البناء والـ SSR والـ prerender نجحت: 30 صفحة + 404 + sitemap (30 رابطاً بـ `lastmod` من `completed_at`) + llms.txt، كلها من الـ API.
  - `verify-dist` رفض الناتج لسبب واحد فقط: روابط صور `localhost:8003` في الصفحات، وهذا مقصود (حماية من نشر build محلي). كل فحوص SEO الأخرى نجحت.
  - البناء على الإنتاج لم يُختبر من هنا (§3 بند 1).
- `npm run size`: الـ JS الأولي 168.6 KB gzip (172,628 بايت مقابل 172,646 قبل التغيير، بدون زيادة).

## 5. خطوات مراجعة قصيرة

1. في Vercel (Production): `VITE_API_URL=https://eng-abdelrahman.dr-krok.com/api/v1` و`VITE_API_RESOURCES=projects,experiences,testimonials,faqs,contact`، ثم Redeploy وراجع الـ log: يجب أن يظهر `✓ prerendered 30 pages` و`✓ dist verified`.
2. أنشئ Deploy Hook في Vercel وضع رابطه في `VERCEL_DEPLOY_HOOK_URL` على السيرفر، ثم عدّل سؤالاً شائعاً وتأكد أن build جديد بدأ.
3. افتح `/` و`/en`: 14 مشروعاً، و5 خبرات بأسطر `+`، و3 توصيات (مميزة + رابط المشروع)، و13 سؤالاً، وبدون أي شارة "نموذجي".
4. افتح صفحة مشروع: المعرض والتحديات والمشاريع ذات الصلة، وفي المصدر `CreativeWork` وبدون `noindex`.
5. أرسل نموذج تواصل حقيقياً: رسالة "تم استلام طلبك…" ووصول إيميل الإشعار. وأرسل 6 طلبات في دقيقة: يظهر "حاول بعد قليل" والنص باقٍ.
6. أرسل مراجعة بصورة: رسالة "شكراً لك! تم استلام رأيك…"، وتظهر في لوحة التحكم غير مفعّلة، وبعد الاعتماد يبدأ build وتظهر في الموقع.
7. `npm run data:todo`: لا شيء يمنع النشر، والسطر `ℹ Live API resources` يذكر الموارد الخمسة.
