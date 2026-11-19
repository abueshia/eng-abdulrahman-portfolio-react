# دليل الوكلاء والمعمارية الهندسية (AGENTS.md)

هذا الملف هو المرجع الإلزامي لأي مطوّر أو وكيل ذكاء اصطناعي يعمل على مشروع البورتفوليو الشخصي لـ **م. عبدالرحمن أبو عيشة (Eng. Abdulrahman Abu Eisha)** — مهندس برمجيات Full-Stack (PHP 8.3 · Laravel · React · Clean Architecture/SOLID).

**قرارات المالك الملزمة:** التهجئة المعتمدة للاسم هي **Abdulrahman Abu Eisha** فقط. الصورة المعتمدة هي `public/images/profile-cutout.png`. ملف CV واحد لكل اللغات تحت `public/cv/`. البيانات حقيقية، وأي قيمة ناقصة تُعلَّم بـ `TODO_REAL_DATA` (راجع `TODO_REAL_DATA.md` والأمر `npm run data:todo`). وتحسين محركات البحث أولوية قصوى (راجع `SEO.md`).

---

## 1) الهوية البصرية ونظام التصميم (Ember × Ion)

- **الفلسفة البصرية:** ثقافة الـ Terminal، هندسة النظم، والمعمارية النظيفة بأسلوب سينمائي فاخر على مستوى استوديوهات Awwwards (بعيداً عن القوالب الجاهزة أو التدرجات البنفسجية المبتذلة).
- **اللوحة اللونية (Design Tokens في `src/styles/tokens.css`):**
  - **Dark Mode (الافتراضي):** خلفيات عميقة بدرجة near-black باردة (`--bg-0: #07080b`, `--bg-1: #0c0e13`, `--surface: #12151c`) مع لون تمييز **Ember** (`--accent: #ff5a36` يمثل الباك إند والطلبات) ولون ثانوي **Ion** (`--secondary: #3ddcff` يمثل الفرونت إند والاستجابات) ولون إشارة (`--signal: #7cffb2`).
  - **Light Mode ("Paper & Ink"):** ورق دافئ (`--bg-0: #f4f1ea`, `--surface: #fbfaf6`) وحبر داكن (`--text: #14161b`) مع درجات أغمق لـ Ember (`#c2310f`) وIon (`#086f91`) لتحقيق تباين WCAG AA وظلال حبر بدلاً من التوهج.
  - **إدارة الثيم:** عبر خاصية `data-theme="dark|light"` على `<html>`، مع سكربت pre-paint في `index.html` يمنع وميض الثيم (FOUC). الأولوية: اختيار المستخدم في `localStorage` (`portfolio.theme`) ← تفضيل النظام `prefers-color-scheme: light` ← الوضع الداكن `dark`.
- **الخطوط (مستضافة ذاتياً عبر `@fontsource` مع `unicode-range`):**
  - العناوين (Display): `Bricolage Grotesque Variable` (EN) / `Alexandria Variable` (AR).
  - النصوص (Body): `Geist Variable` (EN) / `IBM Plex Sans Arabic` (AR).
  - الكود والـ Terminal (Mono): `JetBrains Mono Variable`.
  - الاقتباسات (Serif): `Instrument Serif Italic` (EN) / `Alexandria Variable` (AR).

---

## 2) اللغات والاتجاه (i18n & RTL/LTR)

- **العربية (`ar`, `dir="rtl"`) هي اللغة الافتراضية** وتعمل على المسار الجذري (`/`، `/projects/:slug`، `/blog`).
- **الإنجليزية (`en`, `dir="ltr"`)** تعمل تحت البادئة `/en` (`/en`، `/en/projects/:slug`، `/en/blog`). وجود عنوان URL مستقل لكل لغة ضروري لصحة وسوم `hreflang` وSEO.
- **منع النصوص الثابتة:** يُمنع كتابة أي نص واجهة ثابت داخل المكوّنات؛ جميع نصوص الواجهة تأتي من `src/i18n/locales/{ar,en}.json`، بينما المحتوى الديناميكي يأتي من طبقة البيانات.
- **الخصائص المنطقية (Logical Properties):** استخدم فئات Tailwind المنطقية (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`) بدلاً من `left`/`right` لضمان عمل التصميم في الاتجاهين تلقائياً.
- **خصوصية الخط العربي:** في العربية (`:root[lang='ar']`) يُلغى `letter-spacing` السالب أو الواسع حتى لا تتقطع الحروف المتصلة، ولا يُستخدم تقسيم الحروف (character split) على النصوص العربية أبداً (التقسيم في العربية يكون على مستوى الكلمات فقط).

---

## 3) المعمارية وهيكل المجلدات

```text
src/
  entry-server.jsx  مدخل الـ prerender (يعمل في Node وقت البناء فقط، ولا يُشحن للمتصفح)
  app/            App.jsx · router.jsx (routes + createAppRouter) · query-client.js · prerender-state.js · RouteError.jsx · providers/AppProviders.jsx
  components/
    ui/           مكوّنات واجهة ذرية قابلة لإعادة الاستخدام (Button, LocalizedLink, Logo, SectionHeading, Seo, ErrorState...)
    layout/       غلاف التطبيق (RootLayout, Navbar, MobileMenu, Footer, PageTransition, ScrollManager, ScrollProgress, SmoothScroll, Section, ThemeToggle, LocaleSwitch)
  features/       مجلد لكل ميزة (hero, stats, about, skills, experience, projects, services, credentials, testimonials, blog, faq, contact) يحتوي على components/ و hooks/
  pages/          صفحات التطبيق المقسمة بـ React.lazy (HomePage, ProjectDetailsPage, BlogListPage, BlogDetailsPage, NotFoundPage)
  hooks/          خطافات عامة (useTheme, useLocale, useApiQuery, useSettings, useMediaQuery, useReducedMotion, usePointerFine, useInView, useScrollState, useSmoothScroll)
  context/        سياقات React (ThemeContext, LocaleContext, lenis-context, head-context)
  services/api/   عميل axios (client.js, http.js, endpoints.js, errors.js) + خدمات الموارد (*.service.js) + محول البيانات الوهمية (mock/adapter.js, handlers.js, response.js)
  data/mock/      بيانات وهمية ثنائية اللغة ({ ar, en }) تحاكي استجابات Laravel تماماً
  i18n/           إعداد i18next وملفات الترجمة locales/{ar,en}.json
  styles/         tokens.css · globals.css · fonts.js · index.css
  utils/          cn.js · storage.js · motion.js · head.js (إدارة <head>) · structured-data.js (JSON-LD)
  config/         env.js · routes.js · navigation.js
  test/           setup.js · renderWithProviders.jsx
scripts/          prerender.js (توليد الصفحات الثابتة + sitemap + robots) · real-data-report.js
```

---

## 4) طبقة البيانات وعقد الـ Laravel API (قاعدة صارمة)

1. **فصل صارم:** المكوّنات للعرض فقط، ولا تستورد من `src/data/mock` ولا تستدعي `axios` مباشرة. الجلب يتم عبر خطافات (`useApiQuery` / feature hooks) التي تستدعي خدمات `src/services/api/*.service.js`.
2. **التبديل بين Mock والـ API الحقيقي في طبقة النقل (HTTP Transport):**
   - عندما يكون `VITE_USE_MOCK=true`، يستخدم عميل `axios` المحوّل `mockAdapter` (يُحمَّل كـ chunk منفصل عبر dynamic import).
   - عندما يكون `VITE_USE_MOCK=false`، يرسل نفس العميل الطلبات إلى `VITE_API_URL` دون تغيير سطر واحد في المكوّنات أو الخدمات.
3. **غلاف الاستجابة الموحد (Laravel Envelope):**
   جميع المسارات تُرجع الغلاف:
   ```json
   {
     "code": 200,
     "success": true,
     "message": "OK",
     "data": {},
     "pagination": { "current_page": 1, "per_page": 12, "total": 6, "last_page": 1 }
   }
   ```
   وتفك الدالة `unwrap()` هذا الغلاف وتحوّل أي خطأ (بما فيه `422` و`404`) إلى كائن `ApiError` موحد.
4. **اللغة في الطلبات:** كل طلب يمرر `?lang=ar|en` وترويسة `Accept-Language`، ومفتاح التخزين المؤقت في TanStack Query يتضمن اللغة النشطة دائماً.
5. **إظهار/إخفاء الأقسام:** يعتمد كل قسم في الصفحة الرئيسية على `<Section id="...">` الذي يقرأ `settings.sections_visibility[id]`.

---

## 5) التوليد المسبق (Prerender/SSG) وتحسين محركات البحث (قاعدة صارمة)

التفاصيل الكاملة في `SEO.md`، وهذه هي القواعد الملزمة للكود:

1. **`npm run build` يولّد صفحات ثابتة:** بناء العميل ← بناء `src/entry-server.jsx` للخادم ← `scripts/prerender.js` يكتب `dist/<path>/index.html` لكل مسار ولكل لغة، بالإضافة إلى `404.html` و`sitemap.xml` و`robots.txt`. الأمر `npm run build:spa` يبني العميل فقط.
2. **كل ما يُعرض في الصفحة يجب أن يعمل في Node:** يُمنع استخدام `window`/`document`/`localStorage` أثناء الـ render. هذه الواجهات مكانها داخل `useEffect` أو معالجات الأحداث أو دوال محمية بـ `typeof window`. واستعلامات الوسائط تمر عبر `useMediaQuery` (له server snapshot).
3. **الصفحات لا تحتاج كوداً خاصاً بالـ SSR:** أي استعلام عبر `useApiQuery` يُجلب تلقائياً وقت التوليد ويُحقن في الصفحة (`window.__PRERENDER__`)، ثم يعمل العميل عليه `hydrate` ببيانات مطابقة.
4. **`<Seo>` واحد لكل صفحة:** هو المصدر الوحيد للـ `<title>` والوصف والـ canonical والـ hreflang والـ Open Graph والـ JSON-LD (عبر الخاصية `jsonLd`). تُبنى الوسوم بدوال نقية في `src/utils/head.js`. لا تُستخدم `react-helmet-async`، ولا يُكتب أي وسم `<head>` يدوياً.
5. **حالة الثيم:** القيمة على `<html data-theme>` هي المصدر، وتُقرأ عبر `useSyncExternalStore` (القيمة على الخادم `dark`). يُمنع الكتابة فوق `data-theme` أثناء الـ hydration.
6. **التحقق:** `src/entry-server.test.jsx` يختبر مخرجات التوليد، و`src/app/hydration.test.jsx` يفشل عند أي hydration mismatch. وأي ميزة جديدة لا تُعتبر منتهية قبل نجاح `npm run build`.
7. **النشر:** المحتوى يُثبَّت وقت البناء، فأي نشر من Laravel يجب أن يستدعي Vercel Deploy Hook لإعادة البناء.

---

## 6) قواعد الحركة والأداء والإتاحة

- **ملكية الحركة (Motion Ownership):**
  - الحركات المرتبطة بالتمرير (Scroll-triggered / scrub) يتولاها **GSAP ScrollTrigger**.
  - الحركات المرتبطة بحالة React (فتح/إغلاق، فلاتر، انتقالات صفحات) يتولاها **motion** (`LazyMotion` + `m`).
  - الحركات البسيطة عند الـ hover/focus تتولاها **CSS transitions**.
  - لا تُحرَّك نفس الخاصية على نفس العنصر بمكتبتين مختلفتين.
- **الأجهزة اللمسية وتقليل الحركة:**
  - أي تفاعل يعتمد على الماوس (Custom Cursor، Magnetic، 3D Tilt) يُحصر عبر `usePointerFine()` أو `@custom-variant pointer-fine`.
  - يجب احترام `prefers-reduced-motion` عبر `useReducedMotion()` و`<MotionConfig reducedMotion="user">` وتعطيل Lenis عند تفعيله.
- **الجودة والتوثيق:**
  - جميع التعليقات وJSDoc وREADME تُكتب **بالإنجليزية فقط**. هذا الملف (`AGENTS.md`) يبقى **بالعربية فقط**.
  - لا يُسمح بوضع أي مفاتيح سرية في الكود أو في `AGENTS.md`؛ المتغيرات العامة فقط توثق في `.env.example`.
  - قبل إنهاء أي مرحلة يجب أن تنجح الأوامر الثلاثة بدون أخطاء أو تحذيرات:
    - `npm run lint`
    - `npm run test`
    - `npm run build`

---

## 7) سجل التغييرات (Changelog)

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
