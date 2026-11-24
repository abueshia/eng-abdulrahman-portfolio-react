# دليل الوكلاء والمعمارية الهندسية (AGENTS.md)

هذا الملف هو المرجع الإلزامي لأي مطوّر أو وكيل ذكاء اصطناعي يعمل على مشروع البورتفوليو الشخصي لـ **م. عبدالرحمن أبو عيشة (Eng. Abdulrahman Abu Eisha)** — مهندس برمجيات Full-Stack (PHP 8.3 · Laravel · React · Clean Architecture/SOLID).

**قرارات المالك الملزمة:** التهجئة المعتمدة للاسم هي **Abdulrahman Abu Eisha** فقط. الصورة المعتمدة هي `public/images/profile-cutout.png`. ملف CV واحد لكل اللغات تحت `public/cv/`. بيانات الملف الشخصي حقيقية. أي قيمة ناقصة ضرورية قبل النشر تُعلَّم بـ `TODO_REAL_DATA`، وأي ملف mock مؤقت لمورد لا يخدمه الـ API بعد يُعلَّم في رأسه بـ `MOCK_UNTIL_API`. المشاريع والخبرات والتوصيات والأسئلة الشائعة ونموذجا التواصل والمراجعة تأتي من الـ Laravel API الحقيقي (المرحلة 7)، والمرجع الوحيد لشكل بياناتها هو `docs/api-fixtures/` و`API_CONTRACT.md`. راجع `TODO_REAL_DATA.md` والأمر `npm run data:todo`. وتحسين محركات البحث أولوية قصوى (راجع `SEO.md`).

---

## 1) الهوية البصرية ونظام التصميم (Ember × Ion)

- **الفلسفة البصرية:** ثقافة الـ Terminal، هندسة النظم، والمعمارية النظيفة بأسلوب سينمائي فاخر على مستوى استوديوهات Awwwards (بعيداً عن القوالب الجاهزة أو التدرجات البنفسجية المبتذلة).
- **الفكرة المركزية "The Visitor Is The Request" (إلزامية):** الموقع كله رحلة طلب HTTP داخل نظام حي، والتمرير هو حركة الطلب بين المحطات: Gateway (Hero) ← Observability (Stats) ← Auth (About) ← Services (Skills) ← Queue (Experience) ← Database (Projects) ← Endpoints (Services) ← Review (Testimonials) ← Man (FAQ) ← Request Builder (Contact) ← Response 201 (داخل Contact عند قنوات الرد). الـ Footer هو "Build Signature": البناء الذي خدم الاستجابة، وليس محطة على المسار.
  - **محطة داخلية (`inner: true`):** محطة `response` لا تملك قسماً؛ قسم Contact يرسم عنصر `data-station="response" data-station-anchor="true"` بنفسه (على قنوات الرد، وليس على عنصر sticky لأن موضعه يتغير مع التمرير).
  - **Observability محطة "tap" (`tap: true`):** المراقبة تشاهد الطلب وهو يمر ولا توجّهه. تظهر في الـ Route Trace بعلامة مفرغة متقطعة، ولها hub جانبي في الـ mesh، لكن التوجيه يتخطاها (`nextForwardStation`)، فسطر الـ Hero يبقى `forwarding → /auth`.
  - المحطات معرّفة في `src/config/journey.js`، ومواضعها تُقاس من الـ DOM (`data-station-anchor`)، فالقسم المخفي يسقط من المسار تلقائياً.
  - الأقسام الواقعة بين محطتين "في الطريق" وتأخذ محطة ما قبلها.
  - نقطة Ember هي الطلب: تسافر مع الزائر في الـ Service Mesh وفي الـ Route Trace، وتتحول إلى Ion عند محطة الاستجابة.
  - أي قسم جديد تُبنى لحظته المميزة على دور محطته في الرحلة.
- **الإضاءة حسب وقت الزائر:** المتغير `--daylight` (من 0 ليلاً إلى 1 ظهراً) يميل بالإضاءة إلى Ion الباردة ليلاً وإلى Ember الدافئة نهاراً.
- **اللوحة اللونية (Design Tokens في `src/styles/tokens.css`):**
  - **Dark Mode (الافتراضي):** خلفيات عميقة بدرجة near-black باردة (`--bg-0: #07080b`, `--bg-1: #0c0e13`, `--surface: #12151c`) مع لون تمييز **Ember** (`--accent: #ff5a36` يمثل الباك إند والطلبات) ولون ثانوي **Ion** (`--secondary: #3ddcff` يمثل الفرونت إند والاستجابات) ولون إشارة (`--signal: #7cffb2`).
  - **Light Mode ("Paper & Ink"):** ورق دافئ (`--bg-0: #f4f1ea`, `--surface: #fbfaf6`) وحبر داكن (`--text: #14161b`) مع درجات أغمق لـ Ember (`#c2310f`) وIon (`#086f91`) لتحقيق تباين WCAG AA وظلال حبر بدلاً من التوهج.
  - **إدارة الثيم:** عبر خاصية `data-theme="dark|light"` على `<html>`، مع سكربت pre-paint في `index.html` يمنع وميض الثيم (FOUC). الأولوية: اختيار المستخدم الصريح في `localStorage` (`portfolio.theme`) ← الوضع الداكن `dark` (تفضيل النظام `prefers-color-scheme` لا يُستشار عمداً). التبديل ذري عبر `src/lib/theme.js` (إيقاف الانتقالات لإطار واحد وإبلاغ طبقات الـ canvas في نفس اللحظة).
  - **اللغة:** الـ URL هو المصدر، و`/` عربي دائماً إلا إذا اختار الزائر الإنجليزية صراحةً (المفتاح `portfolio.lang` يُكتب عند التبديل فقط، لا عند مجرد زيارة `/en`).
- **الخطوط (مستضافة ذاتياً عبر `@fontsource` مع `unicode-range`):**
  - العناوين (Display): `Bricolage Grotesque Variable` (EN) / `Alexandria Variable` (AR).
  - النصوص (Body): `Geist Variable` (EN) / `IBM Plex Sans Arabic` (AR).
  - الكود والـ Terminal (Mono): `JetBrains Mono Variable`.
  - الاقتباسات (Serif): `Instrument Serif Italic` (EN) / `Alexandria Variable` (AR).

---

## 2) اللغات والاتجاه (i18n & RTL/LTR)

- **العربية (`ar`, `dir="rtl"`) هي اللغة الافتراضية** وتعمل على المسار الجذري (`/`، `/projects/:slug`).
- **الإنجليزية (`en`, `dir="ltr"`)** تعمل تحت البادئة `/en` (`/en`، `/en/projects/:slug`). وجود عنوان URL مستقل لكل لغة ضروري لصحة وسوم `hreflang` وSEO.
- **منع النصوص الثابتة:** يُمنع كتابة أي نص واجهة ثابت داخل المكوّنات؛ جميع نصوص الواجهة تأتي من `src/i18n/locales/{ar,en}.json`، بينما المحتوى الديناميكي يأتي من طبقة البيانات.
- **الخصائص المنطقية (Logical Properties):** استخدم فئات Tailwind المنطقية (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`) بدلاً من `left`/`right` لضمان عمل التصميم في الاتجاهين تلقائياً.
- **خصوصية الخط العربي:** في العربية (`:root[lang='ar']`) يُلغى `letter-spacing` السالب أو الواسع حتى لا تتقطع الحروف المتصلة، ولا يُستخدم تقسيم الحروف (character split) على النصوص العربية أبداً (التقسيم في العربية يكون على مستوى الكلمات فقط).

---

## 3) المعمارية وهيكل المجلدات

```text
src/
  entry-server.jsx  مدخل الـ prerender (يعمل في Node وقت البناء فقط، ولا يُشحن للمتصفح)
  app/            App.jsx · router.jsx (routes + createAppRouter) · query-client.js · prerender-state.js · RouteError.jsx · providers/{AppProviders.jsx, motion-features.js}
  assets/         ملفات مولّدة يستوردها التطبيق (portrait/: صور AVIF/WebP + portrait.json · textures/grain.png)
  components/
    ui/           مكوّنات واجهة ذرية قابلة لإعادة الاستخدام (Button, LocalizedLink, Logo, Magnetic, SectionHeading, Seo, ErrorState, LineIcon...)
    layout/       غلاف التطبيق والطبقات العامة (RootLayout, Navbar, MobileMenu, Footer, PageTransition, ScrollManager, SmoothScroll, Section, SectionFx, ThemeToggle, LocaleSwitch, SoundToggle, BackgroundLayer, AmbientField, RouteTrace, GlobalFx)
  features/       مجلد لكل ميزة يحتوي على components/ و hooks/ و lib/ و fx/ (وحدات GSAP الكسولة)
    stats/        StatsSection (لوحة Observability) + lib/metrics (odometer وsparkline صادقة) + fx/StatsDirector
    about/        AboutSection (بوابة AUTH وREADME وبطاقة الكود) + lib/profile-code (كلاس PHP من البيانات) + fx/AboutDirector
    skills/       SkillsSection (التبويبات + الـ constellation) + lib/constellation + fx/SkillsDirector
    experience/   ExperienceSection (git log --graph) + lib/git-log + fx/ExperienceDirector
    projects/     ProjectsSection (Case Files) + QueryConsole + CaseFile + CaseStudy + ArchitectureDiagram + Gallery (lightbox) · hooks/{useProjects (كل الصفحات من الـ API), useCaseNavigation (View Transitions), useFlip} · lib/{filters, architecture} · fx/{ProjectsDirector, CaseStudyDirector}
    services/     ServicesSection (API Contracts, route:list) + lib/contract + fx/ServicesDirector
    testimonials/ TestimonialsSection (Code Review) + CarouselEngine (embla كسول) + ReviewModal (نموذج "اكتب مراجعتك"، chunk كسول) + Avatar + Stars · lib/{review-schema, avatar, avatar-image (canvas), review-relay} + fx/TestimonialsDirector
    faq/          FaqSection (man faq، `<details name>`) + fx/FaqDirector
    contact/      ContactSection (HTTP Request Builder: react-hook-form + zod) + lib/{schema, relay (واتساب/بريد حين لا يوجد API في الإنتاج)} + fx/ContactDirector
    intro/        BootSequence + boot-store (مراحل الـ Intro ومهام الجاهزية الحقيقية)
    hero/         Hero ومكوّناته + fx/HeroDirector + lib/{mesh/graph, mesh/renderer, terminal, telemetry, portrait}
    journey/      journey-store (تتبع موضع الطلب على مسار المحطات)
  lib/            بنية تحتية بلا واجهة: create-store · idle · events · device (useDeviceTier) · gsap (كسول فقط) · use-director (لوحدات الـ director فقط) · hydrate-on-demand (whenNeeded) · theme · sound/{sfx, engine}
  pages/          صفحات التطبيق المقسمة بـ React.lazy (HomePage, ProjectDetailsPage, NotFoundPage)
  hooks/          خطافات عامة (useTheme, useLocale, useApiQuery, useSettings, useMediaQuery, useReducedMotion, usePointerFine, useInView, useScrollState, useSmoothScroll, useHydrated/useIdleReady, useMagnetic, usePointerParallax)
  context/        سياقات React (ThemeContext, LocaleContext, lenis-context, head-context)
  services/api/   client.js (unwrap/unwrapMapped/requestConfig بدون axios) · axios-client.js (كسول، يختار الـ API أو الـ mock لكل مورد) · http.js (واجهة كسولة + ذاكرة طلبات GET وقت البناء فقط) · endpoints.js · errors.js · rate-limit.js (Retry-After، كسول) + خدمات الموارد (*.service.js) + mappers/ (تحويل رد الـ API لشكل داخلي، chunk كسول) + محول البيانات الوهمية (mock/adapter.js, handlers.js, response.js)
  data/mock/      بيانات ثابتة ثنائية اللغة ({ ar, en }) للموارد التي لا يخدمها الـ API بعد فقط (settings, services, stats, technologies, credentials)
  i18n/           إعداد i18next (loadLocale/changeLocale: نصوص كل لغة chunk مستقل) وملفات الترجمة locales/{ar,en}.json · work.js + locales/work.{ar,en}.json (نصوص Projects/CaseStudy/Services) · sections.js + locales/sections.{ar,en}.json (نصوص Testimonials/FAQ/Contact/Footer)، وكلها تُشحن مع الـ chunks الكسولة
  styles/         tokens.css · globals.css · fx.css (الطبقات العامة) · hero.css · sections.css (أقسام المرحلة 3) · work.css (Projects وCase Study وServices) · content.css (Testimonials وFAQ وContact وFooter) · fonts.js · index.css
  utils/          cn.js (clsx فقط) · storage.js · motion.js · head.js (إدارة <head>) · structured-data.js (JSON-LD) · llms.js (/llms.txt)
  config/         env.js (إعدادات الموقع) · api.js (رابط الـ API والموارد الحية والـ relay، لا يدخل الحزمة الأولية) · routes.js · navigation.js · journey.js (محطات الرحلة)
  test/           setup.js · renderWithProviders.jsx · api-fixtures.js (يخدم ردود الـ API الحقيقية المسجلة للاختبارات)
docs/api-fixtures/ ردود حقيقية من الـ Laravel API: المرجع الوحيد لشكل البيانات وأساس اختبارات الـ mapping
scripts/          prerender.js (الصفحات الثابتة + sitemap + robots + llms.txt + resource hints) · verify-dist.js (فحص ما بعد البناء) · images.js (sharp) · bundle-report.js · real-data-report.js
```

---

## 4) طبقة البيانات وعقد الـ Laravel API (قاعدة صارمة)

1. **فصل صارم:** المكوّنات للعرض فقط، ولا تستورد من `src/data/mock` ولا تستدعي `axios` مباشرة. الجلب يتم عبر خطافات (`useApiQuery` / feature hooks) التي تستدعي خدمات `src/services/api/*.service.js`.
2. **التبديل بين Mock والـ API الحقيقي لكل مورد في طبقة النقل (HTTP Transport):**
   - `VITE_API_RESOURCES` (افتراضياً: `projects,experiences,testimonials,faqs,contact`) يحدد الموارد الحية. أي طلب أول جزء في مساره مورد حي يذهب إلى `VITE_API_URL`، والباقي إلى `mockAdapter` (chunk كسول) في نفس الـ build.
   - إعدادات الـ API في `src/config/api.js` وليس `env.js`، لأن الكود الكسول فقط يحتاجها. ويُقرأ كل متغير بالاسم (`import.meta.env.VITE_X`)، ولا يُقرأ `import.meta.env` ككائن، حتى لا تنسخ Vite كل الـ env في الحزمة الأولية.
   - **طبقة الـ mapping (إلزامية):** كل خدمة لمورد حي تمرر الرد عبر mapper في `services/api/mappers/` (chunk كسول واحد) يعيد شكلاً داخلياً ثابتاً. المكوّنات لا تعرف أسماء حقول الـ API أبداً، وأي تغيير في الـ API يُعالج في الـ mapper واختباره (`mappers.test.js` على الـ fixtures الحقيقية).
   - الموارد الحية بلا بيانات mock: الاختبارات تعمل بـ `VITE_API_RESOURCES=''` وتخدم الـ fixtures الحقيقية عبر `registerMockRoutes` (`src/test/api-fixtures.js`)، فلا تلمس الشبكة.
3. **غلاف الاستجابة الموحد (Laravel Envelope):**
   جميع المسارات تُرجع الغلاف:
   ```json
   {
     "code": 200,
     "success": true,
     "message": "OK",
     "data": {},
     "pagination": { "current_page": 1, "per_page": 9, "total_items": 14, "total_pages": 2 }
   }
   ```
   وتفك الدالة `unwrap()` هذا الغلاف وتحوّل أي خطأ (بما فيه `422` و`404` و`429`) إلى كائن `ApiError` موحد (`isValidation`، `isNotFound`، `isRateLimited`، `isNetwork`). والـ mapper يحوّل ترقيم الـ API إلى `{ current_page, per_page, total, last_page }`. أخطاء 404-route و429 و500 تأتي بشكل Laravel الافتراضي `{ message }` بدون `code`.
4. **اللغة في الطلبات:** كل طلب يمرر `?lang=ar|en` وترويسة `Accept-Language`، ومفتاح التخزين المؤقت في TanStack Query يتضمن اللغة النشطة دائماً.
5. **المحتوى الحقيقي من الـ API:** منطق `is_sample` وشارات "نموذجي" حُذفت. كل مشروع من الـ API عمل حقيقي: صفحته `index, follow` وداخل الـ sitemap (`lastmod` = `completed_at`) ولها JSON-LD من نوع CreativeWork. المقاييس كما يرسلها الـ API فقط (حالياً `[]`)، ولا أرقام مخترعة. و`npm run data:todo` يفشل إذا كان قسم ظاهر لا مورده حي ولا له mock، أو إذا كان نموذج لا يصل لأحد.
   - **البناء يفشل عند فشل الـ API:** أي طلب فاشل وقت التوليد (شبكة، 5xx، 429، غلاف غير صالح) يوقف البناء برسالة فيها الطلب الفاشل. ممنوع توليد صفحات فارغة أو الرجوع للـ mock بصمت. 404 لـ slug غير موجود هو الفشل الوحيد المتوقع.
   - الطلبات المتطابقة وقت البناء تُرسل مرة واحدة (الحد 120 قراءة في الدقيقة لكل IP، والـ build على Vercel IP واحد).
6. **النموذجان (`POST /contact` و`POST /testimonials`):** بحقول العقد كما هي (`API_CONTRACT.md` §5 و§7). المراجعة `multipart/form-data` والنصوص تحت مفتاح لغة الصفحة (`name[ar]`، `description[ar]`…) مع `rating` و`project_id` و`image` و`consent` و`locale`. الـ honeypot هو `website`: إن امتلأ يظهر النجاح ولا يُرسل شيء، و`hp` لا يُرسل أبداً (الـ API يرفضه). بعد `201` تظهر رسالة التأكيد الإلزامية، وأخطاء `422` على حقولها (`name.ar` على حقل الاسم)، و`429` "حاول بعد قليل"، وخطأ الشبكة أو الخادم مع Retry، ولا يضيع ما كتبه الزائر أبداً. القائمة (`GET /testimonials`) تعرض المعتمد فقط، وممنوع إظهار مراجعة جديدة فوراً. الـ relay إلى واتساب يعمل فقط إذا لم يكن المورد حياً.
7. **إظهار/إخفاء الأقسام:** يعتمد كل قسم في الصفحة الرئيسية على `<Section id="...">` الذي يقرأ `settings.sections_visibility[id]`. والقسم المخفي يُحذف أيضاً من التنقل (`useNavItems`) ومن الـ FAQPage ومن `llms.txt`.

---

## 5) التوليد المسبق (Prerender/SSG) وتحسين محركات البحث (قاعدة صارمة)

التفاصيل الكاملة في `SEO.md`، وهذه هي القواعد الملزمة للكود:

1. **`npm run build` يولّد صفحات ثابتة:** بناء العميل ← بناء `src/entry-server.jsx` للخادم ← `scripts/prerender.js` يكتب `dist/<path>/index.html` لكل مسار ولكل لغة، بالإضافة إلى `404.html` و`sitemap.xml` و`robots.txt`. الأمر `npm run build:spa` يبني العميل فقط.
2. **كل ما يُعرض في الصفحة يجب أن يعمل في Node:** يُمنع استخدام `window`/`document`/`localStorage` أثناء الـ render. هذه الواجهات مكانها داخل `useEffect` أو معالجات الأحداث أو دوال محمية بـ `typeof window`. واستعلامات الوسائط تمر عبر `useMediaQuery` (له server snapshot).
3. **الصفحات لا تحتاج كوداً خاصاً بالـ SSR:** أي استعلام عبر `useApiQuery` يُجلب تلقائياً وقت التوليد ويُحقن في الصفحة (`window.__PRERENDER__`)، ثم يعمل العميل عليه `hydrate` ببيانات مطابقة.
4. **`<Seo>` واحد لكل صفحة:** هو المصدر الوحيد للـ `<title>` والوصف والـ canonical والـ hreflang والـ Open Graph والـ JSON-LD (عبر الخاصية `jsonLd`). تُبنى الوسوم بدوال نقية في `src/utils/head.js`. لا تُستخدم `react-helmet-async`، ولا يُكتب أي وسم `<head>` يدوياً.
5. **حالة الثيم:** القيمة على `<html data-theme>` هي المصدر، وتُقرأ عبر `useSyncExternalStore` (القيمة على الخادم `dark`). يُمنع الكتابة فوق `data-theme` أثناء الـ hydration.
6. **التحقق:** `src/entry-server.test.jsx` يختبر مخرجات التوليد، و`src/app/hydration.test.jsx` يفشل عند أي hydration mismatch. وأي ميزة جديدة لا تُعتبر منتهية قبل نجاح `npm run build`.
7. **حالة الصفحة (`status`):** الـ prerender يأخذ الحالة من `<Seo status>` (صفحة 404 فقط تمرر `status={404}`)، وليس من `noindex`. لذلك صفحة نموذجية `noindex` تبقى صفحة 200 حقيقية.
8. **محتوى HTML من الـ API:** المدونة حُذفت. لو عادت، أو ظهر أي حقل HTML من الـ API، يُعقَّم داخل الـ query نفسه وقت التوليد (DOMPurify بقائمة سماح) قبل العرض. يُمنع عرض HTML خام.
9. **النشر:** المحتوى يُثبَّت وقت البناء، فأي نشر من Laravel يجب أن يستدعي Vercel Deploy Hook لإعادة البناء.
10. **الـ Intro والطبقات العميلة لا تدخل الـ HTML المولّد أبداً:** تُركَّب بعد الـ hydration فقط (`useHydrated` / `useIdleReady`).
   - الاسم والعنوان ونص الـ Hero والصورة كلها في الـ HTML، ويختبر ذلك `entry-server.test.jsx`.
   - الـ LCP هو نص الاسم: يُرسم مع أول رسم تحت غطاء الـ Intro، ولا يُخفى بـ `opacity` قبل ذلك.
   - أي قيمة تعتمد على المتصفح (الوقت، اللغة الزمنية، قياسات الأداء) تُملأ بعد التركيب في مكان محجوز مسبقاً، فلا يحدث hydration mismatch ولا layout shift.
11. **Resource hints:** `scripts/prerender.js` يقرأ manifest الـ Vite ويضيف:
   - `modulepreload` لـ chunk الصفحة ولـ chunk نصوص لغة الصفحة، فلا ينتظر الـ hydration سلسلة طلبات.
   - `preload` لخط العرض الخاص بلغة الصفحة (خط الاسم).

   ثم يحذف الـ manifest من `dist/`، ويكتب `llms.txt`، ثم يتحقق `scripts/verify-dist.js` من المخرجات كلها.

---

## 6) فلسفة الحركة (إلزامية لكل المراحل)

1. **لكل حركة سبب ووزن:** لا fade-in عادي ولا حركة خطية.
   - كل حركة تستخدم مفردات الـ easing المشتركة:
     - `ember`: وصول ثقيل واستقرار طويل.
     - `shutter`: توقف ثم انفتاح حاسم.
     - `snap`: استجابة سريعة.
     - `drift`: حركة محيطية بطيئة.
     - `weight`: جسم ثقيل يتجاوز قليلاً ثم يستقر.
   - مصادرها: `src/utils/motion.js` لـ motion، و`src/lib/gsap.js` لـ GSAP، و`tokens.css` لـ CSS. يُمنع اختراع easing خارجها.
2. **لكل قسم لحظة مميزة (signature moment)** تُحَس أثناء التمرير ومرتبطة بدور محطته في الرحلة.
   - لحظة الـ Hero هي "البوابة تقبل الطلب": تثبيت مع scrub.
   - الاسم ينشق وحروفه تتباعد، والصورة تتراجع وحلقاتها تنفتح.
   - سطر الإرسال `GET / → 200 OK · forwarding → /auth` يُفك تشفيره، وكاميرا الـ mesh تبدأ تتبع الطلب.
3. **التمرير هو المخرج السينمائي:** pinning وscrub وأقسام أفقية وكشف بالـ clip-path وتحوّل إضاءة الخلفية بين المحطات.
4. **لا حركة تظهر عند الدخول ثم تموت:** كل حركة مستمرة مرتبطة بالتمرير أو المؤشر أو الحالة. أمثلة:
   - فك تشفير الحرف عند المرور عليه.
   - ميل الـ marquee مع سرعة التمرير.
   - عدسة الـ x-ray على الصورة.

   الاستثناء الوحيد هو تسليم الـ Intro لأنيميشن الاسم.
5. **التباين:** لحظات هادئة ثم لحظة قوية، ولا يتحرك كل شيء معاً.
6. **تفاصيل حية:** magnetic، ضوء يتبع المؤشر، tilt بحد أقصى 6°، grain، وparallax بطبقات عمق `--d`.
7. **ملكية الحركة:** لا تُحرَّك نفس الخاصية على نفس العنصر بنظامين.
   - **GSAP:** الحركة المرتبطة بالتمرير (ScrollTrigger) والتسلسلات المصمَّمة (timelines وSplitText وScrambleText).
     - يُستورد فقط من وحدات "director" الكسولة (`features/*/fx/*Director.jsx`) عبر `@/lib/gsap`.
     - لا يدخل الحزمة الأولية أبداً.
   - **motion:** حركات حالة React (mount/unmount، فتح/إغلاق، فلاتر، انتقالات الصفحات). ميزاته تُحمَّل غير متزامنة عبر `LazyMotion`.
   - **CSS:** الـ hover والـ focus والحلقات المحيطية (grain، الحلقات، الـ marquee).
   - **rAF مباشر:** حلقات المؤشر والـ canvas. تكتب متغيرات CSS أو ترسم على الـ canvas، بدون أي re-render في React.
   - عند الحاجة لنظامين على نفس الشيء يُضاف غلاف: الخارجي لنظام والداخلي للآخر. مثال الصورة:
     - `.portrait` للتمرير.
     - `.portrait__settle` للدخول.
     - `.portrait__tilt` و`.portrait__layer` للـ CSS.
8. **الأداء جزء من التصميم:**
   - الحركة على transform وopacity وclip-path فقط.
   - الطبقات الثقيلة تُحمَّل بعد أول رسم (`useIdleReady`) وتتوقف عند إخفاء التبويب.
   - تخضع لـ `useDeviceTier()` (`high`/`mid`/`low`) ولحارس الـ FPS، الذي يخفض الجودة تلقائياً ثم يكتفي بإطار ثابت.
9. **تقليل الحركة (`prefers-reduced-motion`):** نسخة هادئة كاملة مع بقاء كل المحتوى:
   - بدون director وبدون scrub أو pin.
   - الـ mesh إطار ثابت.
   - الـ Intro يتلاشى في 400ms.
   - بدون Lenis، و`<MotionConfig reducedMotion="user">`.
10. **الأجهزة اللمسية:** أي تفاعل يعتمد على الماوس (Magnetic، Tilt، فك التشفير عند المرور) يُحصر عبر `usePointerFine()` أو `@custom-variant pointer-fine`، ويُستبدل على اللمس بانجراف ذاتي هادئ وparallax مرتبط بالتمرير.

---

## 7) بنية الـ Hero والطبقات العامة

- **`features/intro/`:**
  - `BootSequence.jsx`: portal يعمل بـ WAAPI فقط، مرة واحدة لكل جلسة وعلى الصفحة الرئيسية فقط.
  - `boot-store.js`: المراحل `off → pending → running → revealing → done`، ومهام الجاهزية الحقيقية (الخطوط، فك ترميز الصورة، بيانات settings، chunks الـ director والـ mesh)، بحد أدنى 2.5 ثانية وأقصى 4 ثوانٍ.
  - سكربت الـ pre-paint يضع `data-boot="play"` فيظهر غطاء CSS حتى يتسلّم React.
  - الخروج: الأسطر تنهار إلى خط Ember، ثم شق كاميرا (clip-path)، وفي نفس اللحظة تبدأ أنيميشن الاسم.
- **`features/hero/components/`** (كلها prerendered ما عدا الطبقات الكسولة):
  - `Hero`: التكوين.
  - `HeroName`: الـ `<h1>` وطبقات العمق. السطر الأول z1 خلف الصورة، والصورة z2، والسطر الثاني z3 أمامها بحدود SVG (`#hero-outline`). يُمنع تحريك الـ `<h1>` نفسه أو تغيير شفافيته.
  - `HeroStatus` و`HeroRole` و`HeroCtas`.
  - `Portrait`: Monolith Portal.
  - `HeroTerminal`: shell حقيقي بأوامر من البيانات، وفيه الأمر السري `php artisan down`.
  - `HeroMarquee`: سجل الخدمات، وtelemetry حقيقية من زيارة الزائر نفسه.
  - `HeroFx`: المحمّل الكسول.
  - `ServiceMesh` و`OutageOverlay`.
- **`features/hero/fx/HeroDirector.jsx`:** كل GSAP الخاص بالـ Hero، وهو الوحيد الذي يقسّم الاسم (حروف للإنجليزي وكلمات للعربي).
- **`features/hero/lib/`:**
  - `mesh/graph.js`: رسم بياني حتمي فيه hub لكل محطة.
  - `mesh/renderer.js`: Canvas2D بملفات جودة `high`/`mid`/`mobile` وحارس FPS.
  - `terminal.js`: مفسّر أوامر نقي.
  - `telemetry.js` و`portrait.js`.
- **هندسة التكوين:** حجم الاسم وموضع الصورة يعتمدان على نفس المرجع (`cqw` لعرض `.hero__grid`)، فيبقى الرأس عند نهاية السطر الأول في كل المقاسات.
  - المتغيرات `--line-ratio` و`--head-at` في `hero.css`.
  - أي تغيير في خط العرض أو في الاسم يتطلب إعادة قياس `--line-ratio`.
- **خط الصورة (`npm run images`، sharp):**
  - يكتشف الشفافية الحقيقية، ويقص الهوامش، ويحدد موضع الرأس.
  - يولّد AVIF/WebP ويكتب `src/assets/portrait/portrait.json`.
  - يعمل تلقائياً من Vite plugin في `dev` و`build` ومع أي تبديل للملف، فتبديل `public/images/profile-cutout.png` هو كل المطلوب.
  - الأوضاع: `cutout` (الرأس يكسر الإطار)، و`photo` (قص وتدريج داخل الإطار)، و`missing` (monogram).
- **الطبقات العامة (`components/layout/`):**
  - `BackgroundLayer`: إضاءة المحطات، و`AmbientField` (WebGL) على `high` فقط.
  - `RouteTrace`: يحل محل ScrollProgress.
  - المؤشر هو مؤشر المتصفح العادي (المؤشر المخصص حُذف لأنه يشتت الزائر).
  - `PageTransition`: ستارة Ember مع `GET /path`.
  - `SoundToggle`: صوت اختياري مطفأ افتراضياً، مولَّد بالـ Web Audio بدون ملفات.
  - `GlobalFx`: المحمّل الكسول.
- **ممنوع CSS داخل الـ chunks الكسولة:** كل الأنماط في `src/styles/` (`fx.css` و`hero.css` و`sections.css` و`work.css` و`content.css`)، حتى تظهر الصفحات المولّدة مسبقاً مكتملة التنسيق.
- **`VITE_FX=off`** يعطل كل الطبقات العميلة، ويُستخدم في الاختبارات. المحتوى لا يعتمد عليه أبداً.

---

## 7.1) بنية الأقسام وطبقات حركتها (إلزامية لكل قسم جديد)

- **القسم chunk كسول:** كل قسم حقيقي في الرئيسية `React.lazy` داخل `<Suspense fallback={null}>`.
  - الـ prerender ينتظره، فنصه كاملاً في الـ HTML.
  - العميل يعمل له hydrate عند وصول الـ chunk، فلا يزيد الـ JS الأولي.
- **الـ hydration عند الحاجة (إلزامي):** chunk كل قسم يُغلَّف بـ `whenNeeded('#id')` (`src/lib/hydrate-on-demand.js`)، فلا يُحمَّل (ولا يعمل له hydrate) إلا قبل ظهوره بشاشة أو عند أول تفاعل (pointer/touch/key). حتى ذلك الحين يبقى HTML الخادم ظاهراً كما هو. على الخادم وعند الرسم الجديد في العميل يُحل فوراً. نفس القاعدة على الـ Footer.
- **`content-visibility` على الموبايل:** `.section-y` تحت 64rem تأخذ `content-visibility: auto` مع `contain-intrinsic-size: auto`. أي عنصر زخرفي يجب ألا يعتمد على الخروج خارج حدود قسمه على الموبايل (الـ paint containment يقصّه).
- **`cn()` هو `clsx` فقط (بدون tailwind-merge):** المكوّن لا يستقبل `className` يتعارض مع classes داخله. الاختلافات تكون props صريحة (`size`, `desktopOnly`) أو فروع متنافية (`current ? 'text-ink' : 'text-ink-muted'`).
- **نصوص اللغة الأساسية كسولة:** `ar.json`/`en.json` كل منهما chunk مستقل. المتصفح ينتظر لغة الصفحة قبل الـ hydration (والصفحة فيها `modulepreload` له)، واللغة الأخرى تُحمَّل في الخمول. استخدم `changeLocale` بدل `i18n.changeLanguage` مباشرة لأي لغة قد لا تكون محمّلة.
- **الحركة في director كسول يُحمَّل عند الاقتراب فقط:** `<SectionFx target="id">` يحمّله بعد الـ hydration والخمول، وعند اقتراب القسم من الشاشة، ولا يحمّله أبداً مع تقليل الحركة.
- **`useDirector` (`src/lib/use-director.js`) إلزامي لكل director:**
  - ينتظر الخطوط، ويُنشئ كل شيء متزامناً داخل `gsap.context` واحد.
  - الـ cleanup يرجّع كل شيء، بالإضافة إلى ما يُسجَّل عبر `onCleanup`: حلقات rAF، والمستمعين، وأي `dataset` أو tween يُنشأ من callbacks الـ scroll خارج الـ context.
  - هذا هو درس الـ Hero مع StrictMode وتبديل اللغة.
- **ترتيب الـ refresh:** كل ScrollTrigger في قسم يأخذ `sectionTrigger(order)`، فتُحسب الأقسام الأعلى أولاً.
- **ممنوع `pin` في الأقسام:** المشاهد الطويلة تُبنى بـ CSS `position: sticky` داخل غلاف طويل يُفعَّل بـ `[data-fx='on']` (يضعه الـ director)، وتُحرَّك بالـ scrub.
- **الحالة الافتراضية لكل عنصر هي حالته النهائية المقروءة.** الـ director يضيف حالات "قبل" فقط. بدون JS أو مع تقليل الحركة يظهر كل المحتوى.
- **نصوص الميزات الكسولة:** نصوص الأقسام الجديدة الكبيرة تُوضع في bundle منفصل يُسجَّل عند استيراد الـ chunk (مثل `src/i18n/work.js`)، لا في `ar.json`/`en.json` الأساسيين اللذين يدخلان الحزمة الأولية.
- **الأيقونات في الـ chunks الكسولة:** `react-icons/lu` وحدة واحدة موجودة في الحزمة الأولية (الـ Navbar)، فأي أيقونة جديدة منها تكبر الـ JS الأولي. الأيقونات الجديدة في الميزات الكسولة تستخدم `LineIcon`.
- **Carousel وأي مكتبة تفاعل ثقيلة:** الـ markup المولّد مسبقاً يعمل وحده (مثلاً صف scroll-snap يُسحب بدون JS)، والمكتبة (embla) تُحمَّل كـ chunk كسول قرب الشاشة وتتسلم نفس العناصر بدون إعادة رسم، وتُدمَّر عند الـ unmount. التشغيل التلقائي يتوقف عند hover/focus وخارج الشاشة، ولا يعمل مع تقليل الحركة.
- **Accordion:** `<details>` أصلي (يعمل بدون JS، ويعلن حالته لقارئ الشاشة، ويفتح مع البحث في الصفحة). "واحد مفتوح فقط" عبر `name` مع معالج `toggle` احتياطي، والارتفاع يتحرك بـ CSS (`::details-content` و`interpolate-size`) حيث يدعمه المتصفح.
- **الـ Footer كسول:** chunk منفصل داخل `<Suspense>` في `RootLayout`، مولّد مسبقاً بالكامل. أي قيمة تعتمد على "الآن" (الساعة المحلية) تُقرأ عبر `useSyncExternalStore` بقيمة خادم `null`.
- **FLIP:** ممنوع تحميل `domMax` من motion (يعيد تقسيم نواة motion خارج الـ entry فيكبر الـ JS الأولي). دخول وخروج العناصر بـ AnimatePresence (motion)، وانزلاق العناصر الباقية بـ `useFlip` (WAAPI على `transform`).
- **في الموبايل:** أي grid فيه محتوى عرضه `max-content` (كود، شريط تبويبات قابل للتمرير) يأخذ `minmax(0, 1fr)`، حتى لا يتسع عرض الصفحة.

---

## 8) قواعد الإتاحة والجودة

- **الإتاحة:**
  - Skip link يعمل، والـ focus ظاهر دائماً.
  - الـ canvas ومخرجات الـ Terminal الزخرفية والـ marquee كلها `aria-hidden`.
  - حقل الـ Terminal مُعنوَن، وردوده تُعلَن عبر `aria-live`.
  - لا معلومة مهمة تُنقل بالحركة وحدها.
  - أثناء الـ Intro تكون الصفحة `inert`، ويُتخطى بزر واضح أو بمفتاح `Esc`.
- **الجودة والتوثيق:**
  - جميع التعليقات وJSDoc وREADME تُكتب **بالإنجليزية فقط**. هذا الملف (`AGENTS.md`) يبقى **بالعربية فقط**.
  - لا يُسمح بوضع أي مفاتيح سرية في الكود أو في `AGENTS.md`؛ المتغيرات العامة فقط توثق في `.env.example`.
  - قبل إنهاء أي مرحلة يجب أن تنجح الأوامر الثلاثة بدون أخطاء أو تحذيرات:
    - `npm run lint`
    - `npm run test`
    - `npm run build`

---

## 9) سجل التغييرات (Changelog)

### المرحلة 7 (الجزء 1) — ربط الفرونت بالـ Laravel API الحقيقي
- **النطاق:** المشاريع (القائمة والتفاصيل)، والخبرات، والتوصيات (GET وPOST)، والأسئلة الشائعة، والتواصل (POST). الباقي (settings والخدمات والإحصائيات والـ About والمهارات) بقي static كما هو.
- **الإعداد:** `VITE_API_RESOURCES` لكل مورد، و`VITE_API_URL` (الافتراضي: الإنتاج). النقل يختار الـ API أو الـ mock لكل طلب في نفس الـ build. والإعدادات في `src/config/api.js`.
- **الـ mapping:** `services/api/mappers/` لكل مورد مع اختبارات على الـ fixtures الحقيقية. تطبيع الإنجازات (نص بأسطر أو مصفوفة، trim، حذف علامات القوائم)، والفقرات (`\r\n`)، وحذف `[cite: …]`، وروابط الصور، والتقييم، والترقيم.
- **التوليد المسبق:** المشاريع وكل الـ slugs من الـ API وقت البناء، والـ sitemap فيه كل مشروع حقيقي بلغتين (`lastmod` = `completed_at`)، وCreativeWork لكل مشروع، وFAQPage من `GET /faqs`. البناء يفشل برسالة واضحة إذا فشل الـ API.
- **التنظيف:** حذف بيانات الـ mock للمشاريع والخبرات والتوصيات والأسئلة، و`SampleBadge`، والشاشات النموذجية SVG، والأمر `npm run visuals`.
- **الأقسام:** الخبرات بتسمية نوع التوظيف من الـ API، والـ director يعيد بناء الـ ScrollTrigger عند تغير الصفوف (`graphKey`)، ومختبرة بـ 1 و2 و4 و8 سجلات ونصوص طويلة. التوصيات تعرض التقييم والأفاتار (أو الحرفين) والمشروع المرتبط (رابط لصفحته) وشارة "مراجعة مميزة". نموذج المراجعة بحقول العقد مع اختيار المشروع.
- **رسائل ما بعد الإرسال:** "تم استلام طلبك وسيتم الرد عليك في أقرب وقت." و"شكراً لك! تم استلام رأيك وسيظهر في الموقع بعد المراجعة." مع 422 على الحقول، و429، وخطأ الشبكة مع Retry.
- **الأداء:** الـ JS الأولي 172,646 ← 172,628 بايت gzip (168.6 KB، بدون زيادة): الـ mappers وحلقة الترقيم وتحليل `Retry-After` كسولة، وذاكرة طلبات البناء تُحذف من حزمة المتصفح، وإعدادات الـ API خارج `env.js`.
- **قاعدة:** ممنوع قراءة `import.meta.env` ككائن. وممنوع أن يعتمد مكوّن على أسماء حقول الـ API. وأي مورد حي جديد يحتاج mapper واختباراً على fixture حقيقي.
- التفاصيل والفروقات ونواقص الباك إند في `INTEGRATION_REPORT.md`.

### أداء — التهنيج وحمل المعالج أثناء التمرير
- **العَرَض:** تهنيج عند التمرير وعند القفز لقسم من الـ Navbar، والمراوح تعمل.
- **الأسباب:**
  - الـ Service Mesh (canvas ثابت على كل الصفحة) كان يعمل بـ 60fps طوال الوقت خلف كل الأقسام.
  - طبقة WebGL (`AmbientField`) فوقه بـ 30fps.
  - `backdrop-filter: blur` في الـ Navbar فوق canvas يتغير كل إطار، فيُعاد حساب الـ blur كل إطار.
  - القفز البعيد بـ Lenis يمر على كل الأقسام، فيحمّل كل directors وchunks الطريق أثناء الحركة.
  - أول ضغطة (`pointerdown`) كانت تعمل hydrate لكل الأقسام في نفس اللحظة.
- **الإصلاح:**
  - `src/lib/scroll-activity.js`: إشارة مشتركة "الصفحة تتحرك الآن".
  - الـ Mesh بكامل معدله فقط والـ Hero ظاهر. بعده يعمل بـ 30fps أثناء التمرير فقط، ثم يقف على آخر إطار بعد 900ms (`renderer.setFps`، وحارس الـ FPS يبدأ نافذته من جديد مع كل `start`).
  - `AmbientField`: بـ 20fps ودقة 40%، ويثبت إطاره أثناء التمرير.
  - الـ Navbar: `.nav-surface` شبه معتم بدون blur.
  - `useSmoothScroll`: الهدف الأبعد من 1.5 شاشة = قفزة فورية لقبله بـ 0.75 شاشة ثم انزلاق.
  - `whenNeeded`: الإطلاق عند التفاعل أصبح قسماً قسماً في الخمول، الأقرب أولاً.
  - Projects: حقول السجل بـ transform/opacity بدل clip-path.
- **السبب الأكبر (bug، مقاس بالـ trace):** حلقة لا نهائية. `HeroDirector` يحوّل كل `refresh` لـ ScrollTrigger إلى `EVENTS.layout`، و`ProjectsDirector` كان يرد على `EVENTS.layout` بـ `ScrollTrigger.refresh()`، فكان refresh كامل للصفحة يتكرر كل إطار للأبد (2.2 ثانية من كل 3 والصفحة واقفة). الإصلاح: حدث مستقل `EVENTS.casesMoved` لحركة سجلات المشاريع.
- **إيقاف الحلقات خارج الشاشة:** `src/lib/offscreen-animations.js` يوقف حركات CSS اللانهائية (marquee، المدارات، النبضات) في أي قسم خارج الشاشة عبر Web Animations API، بدون كتابة attributes على عناصر React. ويعيد المسح عند توقف التمرير وعند `EVENTS.layout`، لأن الـ pin يعيد إنشاء الحركات.
- **Lenis ينام:** حلقة الـ rAF في `SmoothScroll` تتوقف حين لا يوجد تمرير، وتستيقظ عبر `scrollTo` (والعجلة تمر به).
- **المؤشر المخصص حُذف:** المؤشر العادي للمتصفح في كل الموقع (`Cursor.jsx` وأنماطه و`data-cursor` ومفتاح `cursor.view`).
- **القياس (Chrome، Intel UHD، 1536×695):** المعالج والصفحة واقفة تحت الـ Hero من ≈560 إلى ≈300ms/s، والتمرير العميق من 30fps و21 long task (1.2s) إلى ≈53fps و3 (≈0.3s).
- **قاعدة:** أي طبقة canvas/WebGL مستمرة لا تعمل بكامل معدلها إلا في قسمها، وخارجها تتبع `scroll-activity`. ممنوع `backdrop-filter` على عنصر ثابت فوق canvas متحرك. ممنوع أن يستدعي مستمع لـ `EVENTS.layout` الدالة `ScrollTrigger.refresh()`. ممنوع rAF دائم بدون سبب (الحلقة تنام حين لا شيء يتحرك).

### إصلاح — اختفاء الأقسام بعد الـ hydration
- **العَرَض:** على `/` كانت كل الأقسام تحت الـ Hero تختفي بعد ثانية ولا ترجع، مع الوضع الفاتح، أو تقليل الحركة، أو أي بناء عمره أكثر من 5 دقائق (أي زائر حقيقي في الإنتاج).
- **السبب:** أي re-render فوق قسم لم يعمل له hydrate بعد يجعل React يحذف الـ HTML المولّد ويرسمه في العميل. الرسم ينتظر `whenNeeded()`، و`whenNeeded()` كان يراقب العنصر المحذوف، فلا ينتهي أبداً (deadlock). المسببات: `ThemeContext` (قيمته تتغير من `dark` إلى `light` بعد الـ hydration)، و`PageTransition` (كان يشترك في `useReducedMotion`)، والـ refetch لأن `dataUpdatedAt` في بيانات الـ prerender هو وقت البناء.
- **الإصلاح:**
  - `whenNeeded()` ينتهي أيضاً عند خروج عنصره من الـ DOM.
  - `ThemeContext` يحمل الدوال الثابتة فقط، و`useTheme()` يقرأ الثيم من الـ store مباشرة.
  - `PageTransition` بلا اشتراك في تقليل الحركة (MotionConfig يكفي).
  - `markFresh()` يجعل بيانات الـ prerender حديثة عند التحميل، فلا refetch.
- **قاعدة:** ممنوع أي مكوّن فوق الأقسام (Providers، `RootLayout`، `PageTransition`، `HomePage`) يشترك في قيمة تختلف بين الخادم والعميل. مكانها المكوّن الذي يحتاجها نفسه.

### تعديل — مراجعات الزوار في Testimonials
- **الزر:** "اكتب مراجعتك / Write a review" في آخر صندوق الـ PR بأسلوب "Review changes" في GitHub (Ember)، وهو `<button>` حقيقي في الـ HTML المولّد مع `aria-haspopup="dialog"`.
- **الـ modal (`ReviewModal`):** chunk كسول (react-hook-form + zod داخله) يُحمَّل عند اقتراب الزر من الشاشة أو المرور/التركيز عليه أو الضغط، ولا يدخل الـ HTML المولّد أبداً.
  - `<dialog>` أصلي بـ `showModal` (الصفحة خلفه inert)، و`aria-labelledby` و`aria-describedby` و`aria-modal`. Esc والضغط على الخلفية يغلقان، والتركيز يرجع للزر بعد الإغلاق. قفل التمرير بـ `html:has(.rv-dialog[open])` وإيقاف Lenis. على الموبايل bottom sheet بارتفاع 94dvh.
  - الحقول: الاسم (2-60)، المسمى (2-80)، الشركة (اختياري ≤ 80)، النجوم 1-5 (radios أصلية، الأسهم تتبع اتجاه القراءة، Home/End، وتسمية نصية متغيرة)، النص (20-600) بعدّاد، الصورة (اختيار أو سحب وإفلات، JPG/PNG/WebP أقل من 5MB، قص مربع 256×256 بـ canvas وإعادة ترميز WebP/JPEG تحذف EXIF، معاينة دائرية وزر إزالة)، وأفاتار مولّد من حرفين بتدرج Ember/Ion يتحدث مع الكتابة، وموافقة إجبارية، وhoneypot (`hp`).
  - الحالات: شريط تقدم، ثم شاشة شكر (يظهر بعد المراجعة وليس فوراً)، أو أخطاء 422 على حقولها (والصورة)، أو "500 — Retry". لا إرسال مزدوج، ورفض HTML في كل الحقول، وتعقيم النص في العرض أيضاً (`plainText`).
  - StrictMode: الـ object URL للمعاينة يُنشأ داخل effect ويُلغى (`revokeObjectURL`) عند التغيير والإغلاق، ونتيجة معالجة الصورة تُتجاهل بعد الإغلاق.
- **الكروت:** النجوم SVG كصورة مسماة ("Rated 4 out of 5")، والأفاتار صورة بـ `alt` أو monogram زخرفي. التوصيات النموذجية الأربع أخذت تقييمات بسيطة وبقيت بشارة "نموذجي". ممنوع JSON-LD من نوع Review أو AggregateRating، والاختبار يفحص الـ graph والـ HTML كله.
- **الـ API والـ mock:** `testimonialsService.submit()` و`POST /testimonials` في الـ mock adapter بنفس التحقق والـ latency ورسائل 422، بدون تخزين. الـ adapter يقرأ `FormData`. وأُضيف `env.reviewRelay` (`VITE_REVIEW_RELAY`).
- **data:todo:** حالة نموذج المراجعات مستقلة: API متصل، أو relay (موصى به)، أو mock خالص (مانع)، مع سطر `ℹ Forms in production`.
- **الأداء:** الـ JS الأولي 169.4 ← 167.8 KB (الميزة لا تضيف شيئاً للحزمة الأولية: الـ modal و`testimonials-submit.js` كسولان، والنقص من إعادة تجميع الـ chunks). الـ CSS الأولي 37.4 ← 38.8 KB (راجع `SEO.md` §9).
- **الإتاحة:** axe (WCAG 2.2 AA + best practices) على الـ modal: صفر مخالفات في الثيمين واللغتين، ديسكتوب وموبايل، فارغاً ومع الأخطاء.

### المرحلة 1 — الأساس والمعمارية وطبقة البيانات (مكتملة)
- إعداد Tailwind CSS v4.3 عبر `@theme inline` ومتغيرات CSS للثيمين (`dark` افتراضي و`light` "Paper & Ink") مع سكربت pre-paint في `index.html` لمنع وميض الثيم والاتجاه.
- استضافة الخطوط ذاتياً عبر `@fontsource` (Bricolage Grotesque, Alexandria, Geist, IBM Plex Sans Arabic, JetBrains Mono, Instrument Serif).
- إعداد `i18next` مع `LocaleProvider` وربط اللغة بالـ URL (`/` للعربية RTL و`/en` للإنجليزية LTR) وتحديث `<html lang dir>` فورياً بدون إعادة تحميل.
- بناء الهيكل العام (`RootLayout`, `Navbar` المتجاوب مع التمرير، `MobileMenu` مع حصر التركيز وقفل التمرير، `Footer` المبدئي مع توقيع البناء، `ScrollProgress`, `SmoothScroll` بـ Lenis، `PageTransition`, `ScrollManager`, `Section`, `Seo`).
- بناء طبقة البيانات الكاملة (`createApiClient`, `unwrap`, `ApiError`) مع `mockAdapter` يحاكي جميع مسارات الـ Laravel API (`/settings`, `/home`, `/projects`, `/projects/:slug`, `/technologies`, `/experiences`, `/credentials`, `/services`, `/testimonials`, `/blogs`, `/blogs/categories`, `/blogs/:slug`, `/faqs`, `/stats`, `POST /contact`) وبيانات وهمية ثنائية اللغة.
- إعداد ESLint وPrettier وVitest وReact Testing Library وكتابة اختبارات المرحلة 1 (الثيم، اللغة والاتجاه، فك الغلاف ومعالجة الأخطاء، ومحول الـ mock والخدمات).
- **التوليد المسبق (SSG) وتحسين محركات البحث:** إضافة `src/entry-server.jsx` و`scripts/prerender.js` (24 صفحة بلغتين + `404.html` بحالة 404 حقيقية + `sitemap.xml` مع hreflang + `robots.txt`)، مع `vercel.json` (`trailingSlash: false` وتخزين مؤقت دائم للـ assets). العميل يعمل `hydrate` فقط عندما يطابق المسار المولَّد الـ URL الحالي.
- استبدال `react-helmet-async` بمدير `<head>` خاص (`utils/head.js` + `HeadContext`) يعمل في المتصفح ووقت التوليد، ودعم JSON-LD (`Person` + `WebSite` في الرئيسية).
- إزالة `i18next-browser-languagedetector`: ترتيب الاكتشاف (URL ← localStorage ← العربية) أصبح في `main.jsx` و`LocaleProvider` فقط، وإنشاء الـ router بعد إعادة كتابة الـ URL (`createAppRouter`) لإصلاح خلل كان يبدأ فيه الـ router بالمسار القديم.
- `ThemeProvider` عبر `useSyncExternalStore` بقيمة خادم ثابتة (لا hydration mismatch ولا قلب الوضع الفاتح إلى الداكن).
- تطبيق قرارات المالك: تهجئة **Abdulrahman Abu Eisha** في كل مكان، والصورة `profile-cutout.png`، وCV واحد (`/cv/abdulrahman-abu-eisha-cv.pdf`)، وتعليم البيانات الناقصة بـ `TODO_REAL_DATA` مع `TODO_REAL_DATA.md` و`npm run data:todo`، وجعل `VITE_SITE_URL` الافتراضي هو أصل الإنتاج.
- توثيق `SEO.md`، واختبارات جديدة: مخرجات التوليد (المحتوى، الـ head، الـ JSON-LD، حالة 404، قائمة المسارات)، وأدوات الـ head ومكوّن `<Seo>`، وhydration الصفحات المولّدة (بما فيها زائر الوضع الفاتح).
- **البيانات الحقيقية:** البريد والهاتف وواتساب والموقع (القاهرة، حدائق الأهرام) والمنطقة الزمنية `Africa/Cairo` وGitHub وLinkedIn وFacebook، وحذف X نهائياً، وCV في `public/cv/Abdulrahman_Saad_Backend_Engineer_CV.pdf`. والـ `sameAs` في JSON-LD يضم الحسابات فقط (بدون واتساب).
- إخفاء `credentials` و`testimonials` و`blog` لحين وجود محتوى حقيقي، وتحويل بيانات الخبرات والمشاريع والإحصائيات إلى نماذج واضحة (`Sample ·` و`sample-*` و`Sample Company A/B/C` وأرقام صفرية، ما عدا سنوات الخبرة 4).
- `npm run data:todo` أصبح يفرّق بين «ناقص ضروري قبل النشر» (يفشل الأمر) و«mock مؤقت لحين الـ API» (للعلم فقط)، ويتحقق من صيغة الصور وأبعادها.

### المرحلة 6 — الصقل والإغلاق النهائي (مكتملة)
- **النشر على Vercel (بالقياس):**
  - الموقع المنشور يخدم الـ CSS والـ JS بنوع صحيح، وملف تحقق جوجل يعمل.
  - الخلل المقاس: أي ملف `/assets/*` غير موجود كان يرجع `404 text/html` مع `immutable` لسنة كاملة. تبويب من نشر سابق (أو rollback) يطلب chunks لم تعد موجودة، فيُخزَّن الـ 404 ويظهر الـ HTML خاماً.
  - `vercel.json`:
    - `immutable` للملفات المجزّأة فقط، و`max-age=0, must-revalidate` للـ HTML.
    - headers أمان: nosniff، Referrer-Policy، Permissions-Policy، X-Frame-Options.
    - `framework: null` و`npm ci`، وبدون أي rewrite شامل (لا soft 404).
  - إعادة تحميل واحدة محمية عند `vite:preloadError`.
  - `scripts/verify-dist.js` جزء من `npm run build`، ويفشل البناء لو:
    - صفحة ناقصة وسوم CSS/JS، أو ملف مذكور فيها غير موجود.
    - head ناقص أو JSON-LD غير صالح.
    - الرئيسية `noindex`، أو الـ sitemap فيه رابط غير قابل للفهرسة.
    - `llms.txt` ناقص، أو ذكر لـ localhost.
- **السيو:**
  - title/description للرئيسية من `settings.seo` (59/64 حرفاً، و≈155 للوصف) عبر `<Seo fullTitle>`.
  - ملخص الـ Hero يذكر المسمى والقاهرة وLaravel/PHP/React طبيعياً، وفقرة صادقة في About عن العمل من القاهرة مع عملاء في مصر والعالم العربي.
  - `alternate_names` (8 تهجئات) في `alternateName`، وسطر ظاهر "يُكتب الاسم أيضاً" في About.
  - Person: `address` (القاهرة، EG فقط)، و`areaServed`، و`knowsLanguage`، و`knowsAbout` أوسع، و`description`. ProfessionalService بنفس العنوان المختصر بدل العنوان التفصيلي.
  - 5 أسئلة FAQ جديدة (المجموع 13)، وأوصاف الخدمات بعبارات البحث الطبيعية (تطوير REST API بـ Laravel، تكامل بوابات الدفع في مصر).
  - `alt` الصورة = الاسم + المسمى.
  - `/llms.txt` مولّد من نفس البيانات.
  - `SEO_KEYWORDS.md` (خريطة الكلمات بالقياس)، و`SEO.md` (خطوات Search Console وقائمة ما بعد النشر وخطة المتابعة).
  - الدومين المعتمد `https://eng-abdulrahman-abu-eisha.vercel.app`.
- **الأداء:**
  - JS الأولي للرئيسية 204.1 ← 169.4 KB:
    - axios كسول في أول طلب حقيقي.
    - Lenis كسول.
    - حذف tailwind-merge.
    - نصوص اللغة غير النشطة خارج الحزمة.
  - hydration الأقسام والـ Footer عند الحاجة.
  - `content-visibility` للأقسام على الموبايل.
  - إصلاح CLS 0.16 (خانة الساعة في الـ Hero تحجز عرضها الكامل).
  - `fetchpriority="high"` للصورة (عنصر الـ LCP على الموبايل).
  - الـ mesh إطار ثابت على اللمس تحت الـ high، والأجهزة اللمسية الضعيفة (≤ 4 أنوية أو ≤ 4GB) أصبحت `low`.
  - Lighthouse محلياً: موبايل 37–42 ← 47–52، وديسكتوب 70–71 ← 70–82، وCLS 0. الموبايل أقل من 90 بسبب كلفة تخطيط الـ Hero نفسه، والرقم مسجّل كما هو في `SEO.md` §9.
- **الإتاحة (axe في Chrome، WCAG 2.2 AA + best practices: صفر مخالفات في الثيمين واللغتين):**
  - `--text-dim` أصبح يحقق 4.5:1 في الثيمين، و`--signal` الفاتح أغمق قليلاً.
  - الاسم الظاهر داخل الاسم المتاح للشعار وزر اللغة.
  - الـ carousel بدون قائمة (slides كمجموعات)، والمناطق القابلة للتمرير تأخذ focus.
  - نقاط الـ carousel بمساحة لمس 24px.
- **التواصل:** في الإنتاج بدون API يفتح الإرسال واتساب برسالة معبّأة من الحقول (أو البريد)، مع نص واضح قبل الإرسال. في الـ dev يبقى "Mock mode". `data:todo` يفرّق بين relay (موصى به) وmock خالص (مانع).
- **الاختبارات:**
  - أقسام Stats وAbout وSkills (لوحة المفاتيح RTL) وExperience وProjects وServices وTestimonials وFooter.
  - relay التواصل، و`llms.txt`، و`verify-dist`.
  - head كل صفحة مولّدة (title فريد، description، canonical، hreflang، JSON-LD صالح، الرئيسية indexable)، وحقول Person الجديدة.
- **التوثيق:** README جديد بالإنجليزية (التشغيل، المتغيرات، البنية، النشر، ربط الـ API).

### المرحلة 5 — Testimonials وBlog وFAQ وContact وFooter (مكتملة، والمدونة حُذفت لاحقاً)
- **الرحلة:** محطات جديدة `review` (Testimonials) و`docs` (Blog) و`man` (FAQ) و`request` (Contact)، و`response` أصبحت محطة داخلية على قنوات الرد في نهاية Contact. hubs جديدة في الـ mesh ومشاهد إضاءة، والـ Navbar والـ Route Trace يتبعانها تلقائياً.
- **الإظهار:** `testimonials` و`blog` ظاهران بمحتوى نموذجي معلَّم (`is_sample`)، و`credentials` مخفي.
- **Testimonials ← REVIEW ("Code Review"):** كل توصية مراجعة Pull Request (✓ approved these changes) برأس PR يجمع المراجعين والفحوصات من البيانات. الـ director يشغّل الفحوصات مع التمرير ويقلب الحالة إلى Approved. carousel: صف scroll-snap مولّد مسبقاً، ثم embla كسول مع autoplay يتوقف عند hover/focus وخارج الشاشة.
- **Blog ← DOCS ("Changelog"):** فهرس تحريري بعناوين ضخمة تمتلئ بالحبر مع التمرير، ومعاينة صورة تتبع المؤشر (ديسكتوب وماوس فقط)، وفلتر بالتصنيف في الـ URL. صفحة المقال: 68ch، TOC ثابت يعلّم العنوان الحالي، شريط تقدم القراءة، وقت القراءة، كود Shiki بتبويب اسم الملف وزر نسخ، ومقالات ذات صلة. 3 مقالات نموذجية (Idempotency في الدفع، Queues في Laravel، Core Web Vitals) بغلافات SVG من `npm run visuals`.
- **FAQ ← MAN ("man faq"):** صفحة man (NAME / SYNOPSIS / DESCRIPTION) و8 أسئلة صادقة بدون أسعار أو مدد أو وعود بالترتيب، و`<details name="faq">`، وسطر pager بأسلوب `less` يتحدث مع التمرير.
- **Contact ← REQUEST BUILDER ثم RESPONSE 201:** عنوان حركي بالكلمات، والمسار الذي قطعه الطلب، ثم نموذج (react-hook-form + zod، والأخطاء مفاتيح i18n) بجانبه معاينة حية لـ `POST /contact`. الزر يصير شريط تقدم، ثم `201 Created` أو `500 — Retry` أو أخطاء 422 على الحقول. honeypot، ومنع إرسال نفس الطلب مرتين، ورفض HTML. في وضع الـ mock يظهر "Mock mode: not delivered" بوضوح. القنوات المباشرة (بريد، واتساب، هاتف) و`ls ~/socials` من settings الحقيقية.
- **Footer ← BUILD SIGNATURE:** اسم ضخم بحدود فقط يمتلئ عند الوصول إليه، وخريطة موقع للأقسام الظاهرة فقط، والساعة المحلية (Africa/Cairo)، والسوشيال، و`v{version} · commit {hash}`، وCEO of iCode Tech. أصبح chunk كسولاً.
- **SEO:** `FAQPage` في JSON-LD الرئيسية، و`BlogPosting` + `BreadcrumbList` للمقالات الحقيقية فقط، وبدون Review JSON-LD (توصيات ذاتية ونماذج). المقالات النموذجية وصفحة `/blog` (وكل مقالاتها نماذج) `noindex` وخارج الـ sitemap.
- **data:todo:** أي قسم ظاهر بمحتوى `is_sample`، ونموذج التواصل على الـ mock في الإنتاج، أصبحا ضمن "Required before publishing".
- **الأداء:** الـ JS الأولي 192.9 ← 192.7 KB (الـ Footer الكسول عوّض الزيادة). Shiki وDOMPurify وembla وreact-hook-form وzod كلها في chunks كسولة، وShiki لا يُحمَّل في المتصفح لأي مقال مولّد مسبقاً.
- **اختبارات جديدة:** مسار المقال (التعقيم، المعرّفات، Shiki)، مخطط التواصل، تدفق النموذج (201 وملاحظة الـ mock و422 و500)، الـ FAQ (سؤال واحد مفتوح)، مخرجات التوليد (الأقسام والـ footer والمقال وFAQPage وصفحة /blog)، وhydration مقال مولّد.

### المرحلة 4 — Projects وServices (مكتملة، بانتظار المراجعة البصرية)
- **Projects ← DATABASE ("Cinematic Case Files"):**
  - قائمة بعرض الشاشة وكروت متناوبة الاتجاه، وكل مشروع `<article>` كامل في الـ HTML (رقم الصف، المفتاح، النوع، السنة، الدور، التقنيات، المقاييس).
  - hover بالماوس فقط: كشف clip-path من موضع المؤشر لشاشة ثانية مع قراءة SQL للمقاييس، والمؤشر يصير قرص "View/عرض".
  - الفلترة بالنوع والتقنية في الـ URL (`?type=&tech=`)، تُطبَّق بعد الـ hydration فقط، وسطر الـ SQL يُعاد كتابته حسب الفلتر، والنتيجة تُعلَن بـ `aria-live`. الدخول والخروج بـ AnimatePresence والانزلاق بـ `useFlip`.
  - الـ director: كل سجل "يُقرأ من القرص" (خط مسح وclip-path مع التمرير)، وparallax للصورة والرقم الضخم، ومؤشر الاستعلام (نقطة Ember) على عمود الفهرس.
  - الموبايل: deck أفقي بالسحب (scroll-snap) مع عدّاد وشريط تقدم.
- **Case Study:** الغلاف يتمدد ليصير رأس الصفحة بـ View Transitions (`useCaseNavigation`، والستارة تتنحى عبر `state.viewTransition`)، ثم Request/Response، ثم مخطط معماري SVG مبني من البيانات (`lib/architecture`) مع قرارات ADR تضيء أجزاءه مع القراءة، ثم التقنيات، والتحديات كـ incidents محلولة، والمقاييس الوصفية، ومعرض بـ lightbox (`<dialog>`، الأسهم تتبع اتجاه القراءة، Home/End، Esc، وإرجاع التركيز)، والروابط، والمشاريع ذات الصلة، و"Next case →" ضخم يمتلئ مع التمرير.
- **Services ← ENDPOINTS ("API Contracts"):** 14 خدمة في 5 مجموعات بأسلوب `php artisan route:list`. كل خدمة `<details>` أصلي (يعمل بدون JS)، وفتحه يكشف `200 OK` وجسم JSON مبني من عناصر حقيقية (القيم نص، والترقيم مخفي عن قارئ الشاشة). spotlight على الحدود يتبع الماوس، وانجراف ذاتي على اللمس. الـ director: خط مسح يسجّل المسارات (الـ method يضيء) ورسم الـ leaders، وفهرس المجموعات يعلّم المجموعة الحالية.
- **البيانات:** 3 مشاريع نموذجية (SaaS متعدد المستأجرين، مخزون ونقاط بيع، API توصيل لحظي) بعلم `is_sample`، وشاشات SVG مولّدة بـ `npm run visuals`. الخدمات بمجموعاتها من `GET /services` (`group` كائن).
- **الرحلة:** محطة `endpoints` جديدة على قسم Services، مع hub في الـ mesh ومشهد إضاءة، وتظهر في الـ Route Trace والـ Navbar تلقائياً.
- **SEO:** `ProfessionalService` + `OfferCatalog` بالخدمات في JSON-LD الرئيسية، و`CreativeWork`/`SoftwareSourceCode` + `BreadcrumbList` للمشاريع الحقيقية فقط. المشاريع النموذجية `noindex` وخارج الـ sitemap. `<Seo status>` هو مصدر حالة الـ prerender.
- **الأداء:** الأقسام والصفحة والـ directors كلها كسولة. الـ JS الأولي 192.4 ← 192.9 KB (الزيادة: محطة الرحلة ومنطق الستارة)، والنصوص الجديدة في bundle كسول، والـ SVG packets في المخطط تتوقف خارج الشاشة.
- **اختبارات جديدة:** architecture، filters، contract، structured-data (المشاريع)، lightbox بالكيبورد (LTR وRTL)، مخرجات التوليد (noindex للنماذج، الخدمات والمشاريع نصاً، الـ sitemap)، وhydration رابط مفلتر.

### المرحلة 3 — Stats وAbout وSkills وExperience (مكتملة، بانتظار المراجعة البصرية)
- **Stats ← Observability (محطة tap):**
  - لوحة bento غير متماثلة بأسلوب Grafana.
  - odometer لكل رقم على حدة، والرقم الحقيقي نص في الـ HTML والبكرات زخرفية.
  - سلسلة sparkline متدرجة صادقة (خطوة لكل سنة).
  - لوحة صحة من بيانات حقيقية (الإتاحة والمنطقة الزمنية).
  - مسح "query refresh" مع التمرير.
  - القيم الصفرية أو الـ sample تظهر كلوحة "No data"، ولا تظهر كرقم أبداً.
- **About ← AUTH:**
  - بوابة sticky تتحقق من الـ token حرفاً حرفاً، ثم يفتح القفل وتنفتح الأبواب على الترحيب.
  - README تحريري: الاقتباس serif كـ `h2`، وسطر `whoami` بالمسمى الثانوي "CEO of iCode Tech" (`settings.general.company`).
  - النص يتضح كلمة كلمة مع التمرير.
  - بطاقة كود PHP 8.3 حقيقية مولّدة من البيانات (readonly وenum وconstructor promotion)، وسطرها المضاء يتزامن مع الفقرة المقروءة (فقرة الاختبارات تضيء `->test()`)، وعلى الموبايل تصير شريطاً sticky مضغوطاً.
- **Skills ← SERVICES:**
  - التبويبات هي مصدر الحقيقة: WAI-ARIA tabs مع roving tabindex وأسهم معكوسة في RTL، وكل اللوحات وكل المهارات نص في الـ HTML.
  - على الديسكتوب: constellation (نواة و5 مدارات، والحجم والسطوع = الإتقان)، والاختيار يضيء المدار ويخفت الباقي، وتمرير المؤشر يربط العقدة بسطرها.
  - إقلاع "الخدمات تبدأ" مع التمرير، وميل للمؤشر حتى 6°.
  - على الموبايل: شريط تبويبات قابل للسحب ولوحات تتبدل بالسحب (pointer events بدون `domMax`).
- **Experience ← QUEUE:**
  - `git log --graph`: كل دور commit بـ hash ثابت، وفرعه اسم الشركة، وtag الدور، والإنجازات أسطر diff (+).
  - العمل الحر فرع ينشق ثم يندمج (merge commit في الأعلى ما دام مستمراً).
  - الرسم يُكتب مع التمرير، ونقطة HEAD (الطلب) تسافر على `main`، والرسم معكوس في RTL.
- **الرحلة:** محطة `observability` (tap) مع hub في الـ mesh ومشهد إضاءة. الـ Navbar يعلّم محطة الطلب الحالية (`aria-current="location"`).
- **SEO:** JSON-LD أصبح `ProfilePage` + `Person` (`jobTitle` بالمسميين و`worksFor` iCode Tech) + `WebSite`.
- **البنية:** الأقسام chunks كسولة، و`SectionFx`، و`useDirector`، و`sections.css`.
- **اختبارات جديدة:** metrics، profile-code، constellation، git-log، الرحلة، والـ JSON-LD.

### المرحلة 2 — Intro وHero والطبقات العامة (مكتملة، بانتظار المراجعة البصرية)
- **الفكرة المركزية "The Visitor Is The Request":**
  - المحطات في `config/journey.js`.
  - `journey-store` يتتبع موضع الطلب من الـ DOM.
  - الأقسام تحمل `data-station` و`data-station-anchor`.
- **Boot Sequence:**
  - terminal يُكتب بإيقاع بشري، وعدّاد مرتبط بجاهزية حقيقية، وخط Ember، وشق كاميرا بالـ clip-path.
  - تسليم متصل لأنيميشن الاسم.
  - Skip وEsc، وsessionStorage، ونسخة تقليل حركة (تلاشٍ 400ms).
  - غطاء CSS قبل React مع failsafe.
- **Hero "The Architect's Core":**
  - الاسم بطبقات عمق (الرأس أمام السطر الأول، والسطر الثاني بحدود SVG نظيفة أمام الجسم).
  - فك تشفير بالرموز للإنجليزي، وكشف بالكلمة للعربي.
  - سطر الدور المتبدّل، والحالة مع الساعة المحلية، وCTAs مغناطيسية.
  - Monolith Portal: حلقات blueprint، وrim light، ومسح نقطي يتحول للصورة، وعدسة x-ray، وtilt وparallax بطبقات.
  - Terminal حقيقي بأوامر من البيانات والأمر السري `php artisan down` (انهيار متتالٍ ثم إعادة تشغيل بموجة Ion).
  - شريطان حيّان: سجل الخدمات، وtelemetry حقيقية للزيارة.
- **Service Mesh:** Canvas2D على مستوى الصفحة الرئيسية.
  - الـ Gateway خلف الصورة، والكاميرا تتبع الطلب بين المحطات.
  - دورة REST مرسومة (Ember ذهاباً وIon إياباً)، وتفاعل مع المؤشر، ونقرة تطلق دفعة طلبات.
  - حارس FPS، وملف خفيف للموبايل، وإطار ثابت لتقليل الحركة والأجهزة الضعيفة.
- **مشهد التمرير المثبّت "البوابة تقبل الطلب"** على الديسكتوب، وparallax خفيف على الموبايل.
- **الطبقات العامة:**
  - `BackgroundLayer`: إضاءة تتغير مع المحطة ومع وقت الزائر، و`AmbientField` (WebGL خام) على الأجهزة القوية فقط.
  - `RouteTrace` بدل ScrollProgress.
  - مؤشر مخصص بأثر طلب يتلاشى.
  - ستارة انتقال Ember.
  - صوت اختياري مطفأ افتراضياً.
- **خط الصور (`npm run images`، sharp):** AVIF/WebP، واكتشاف الشفافية والرأس، وحبيبات grain حتمية، وVite plugin يعيد التوليد تلقائياً.
- **الأداء:**
  - GSAP والـ mesh والـ WebGL والمؤشر والـ Intro في chunks كسولة.
  - ميزات motion أصبحت غير متزامنة.
  - `modulepreload` لـ chunk الصفحة و`preload` لخط الاسم في الصفحات المولّدة.
  - `npm run size` يقيس الحزمة الأولية.
- **الجودة:**
  - `useDeviceTier` و`useHydrated`/`useIdleReady`، و`VITE_FX`.
  - اختبارات جديدة: مفسّر الـ Terminal، والـ mesh، والرحلة، وتصنيف الجهاز، وتقدم الـ Intro، ووجود محتوى الـ Hero كاملاً في الـ HTML المولّد.
  - `data:todo` أضاف فئة «موصى به، غير مانع».
- **البيانات:**
  - `cv_url` يشير إلى `public/cv/Abdulrahman_abu_eisha_CV.pdf` بعد إعادة تسمية المالك للملف.
  - الصورة المفرغة الجديدة (PNG شفاف) أصبحت في وضع `cutout`.
