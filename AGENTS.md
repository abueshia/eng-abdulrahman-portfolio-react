# دليل الوكلاء والمعمارية الهندسية (AGENTS.md)

هذا الملف هو المرجع الإلزامي لأي مطوّر أو وكيل ذكاء اصطناعي يعمل على مشروع البورتفوليو الشخصي لـ **م. عبدالرحمن أبو عيشة (Eng. Abdulrahman Abu Eisha)** — مهندس برمجيات Full-Stack (PHP 8.3 · Laravel · React · Clean Architecture/SOLID).

**قرارات المالك الملزمة:** التهجئة المعتمدة للاسم هي **Abdulrahman Abu Eisha** فقط. الصورة المعتمدة هي `public/images/profile-cutout.png`. ملف CV واحد لكل اللغات تحت `public/cv/`. بيانات الملف الشخصي حقيقية. أي قيمة ناقصة ضرورية قبل النشر تُعلَّم بـ `TODO_REAL_DATA`، وأي ملف mock مؤقت لحين ربط الـ API يُعلَّم في رأسه بـ `MOCK_UNTIL_API` ويجب أن يكون محتواه نموذجياً واضحاً (بدون أسماء شركات حقيقية ولا أرقام تبدو حقيقية). راجع `TODO_REAL_DATA.md` والأمر `npm run data:todo`. وتحسين محركات البحث أولوية قصوى (راجع `SEO.md`).

---

## 1) الهوية البصرية ونظام التصميم (Ember × Ion)

- **الفلسفة البصرية:** ثقافة الـ Terminal، هندسة النظم، والمعمارية النظيفة بأسلوب سينمائي فاخر على مستوى استوديوهات Awwwards (بعيداً عن القوالب الجاهزة أو التدرجات البنفسجية المبتذلة).
- **الفكرة المركزية "The Visitor Is The Request" (إلزامية):** الموقع كله رحلة طلب HTTP داخل نظام حي، والتمرير هو حركة الطلب بين المحطات: Gateway (Hero) ← Auth (About) ← Services (Skills) ← Queue (Experience) ← Database (Projects) ← Response 201 (Contact).
  - المحطات معرّفة في `src/config/journey.js`، ومواضعها تُقاس من الـ DOM (`data-station-anchor`)، فالقسم المخفي يسقط من المسار تلقائياً.
  - الأقسام الواقعة بين محطتين "في الطريق" وتأخذ محطة ما قبلها.
  - نقطة Ember هي الطلب: تسافر مع الزائر في الـ Service Mesh وفي الـ Route Trace، وتتحول إلى Ion عند محطة الاستجابة.
  - أي قسم جديد تُبنى لحظته المميزة على دور محطته في الرحلة.
- **الإضاءة حسب وقت الزائر:** المتغير `--daylight` (من 0 ليلاً إلى 1 ظهراً) يميل بالإضاءة إلى Ion الباردة ليلاً وإلى Ember الدافئة نهاراً.
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
  app/            App.jsx · router.jsx (routes + createAppRouter) · query-client.js · prerender-state.js · RouteError.jsx · providers/{AppProviders.jsx, motion-features.js}
  assets/         ملفات مولّدة يستوردها التطبيق (portrait/: صور AVIF/WebP + portrait.json · textures/grain.png)
  components/
    ui/           مكوّنات واجهة ذرية قابلة لإعادة الاستخدام (Button, LocalizedLink, Logo, Magnetic, SectionHeading, Seo, ErrorState...)
    layout/       غلاف التطبيق والطبقات العامة (RootLayout, Navbar, MobileMenu, Footer, PageTransition, ScrollManager, SmoothScroll, Section, ThemeToggle, LocaleSwitch, SoundToggle, BackgroundLayer, AmbientField, RouteTrace, Cursor, GlobalFx)
  features/       مجلد لكل ميزة يحتوي على components/ و hooks/ و lib/ و fx/ (وحدات GSAP الكسولة)
    intro/        BootSequence + boot-store (مراحل الـ Intro ومهام الجاهزية الحقيقية)
    hero/         Hero ومكوّناته + fx/HeroDirector + lib/{mesh/graph, mesh/renderer, terminal, telemetry, portrait}
    journey/      journey-store (تتبع موضع الطلب على مسار المحطات)
  lib/            بنية تحتية بلا واجهة: create-store · idle · events · device (useDeviceTier) · gsap (كسول فقط) · sound/{sfx, engine}
  pages/          صفحات التطبيق المقسمة بـ React.lazy (HomePage, ProjectDetailsPage, BlogListPage, BlogDetailsPage, NotFoundPage)
  hooks/          خطافات عامة (useTheme, useLocale, useApiQuery, useSettings, useMediaQuery, useReducedMotion, usePointerFine, useInView, useScrollState, useSmoothScroll, useHydrated/useIdleReady, useMagnetic, usePointerParallax)
  context/        سياقات React (ThemeContext, LocaleContext, lenis-context, head-context)
  services/api/   عميل axios (client.js, http.js, endpoints.js, errors.js) + خدمات الموارد (*.service.js) + محول البيانات الوهمية (mock/adapter.js, handlers.js, response.js)
  data/mock/      بيانات وهمية ثنائية اللغة ({ ar, en }) تحاكي استجابات Laravel تماماً
  i18n/           إعداد i18next وملفات الترجمة locales/{ar,en}.json
  styles/         tokens.css · globals.css · fx.css (الطبقات العامة) · hero.css · fonts.js · index.css
  utils/          cn.js · storage.js · motion.js · head.js (إدارة <head>) · structured-data.js (JSON-LD)
  config/         env.js · routes.js · navigation.js · journey.js (محطات الرحلة)
  test/           setup.js · renderWithProviders.jsx
scripts/          prerender.js (الصفحات الثابتة + sitemap + robots + resource hints) · images.js (sharp) · bundle-report.js · real-data-report.js
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
5. **إظهار/إخفاء الأقسام:** يعتمد كل قسم في الصفحة الرئيسية على `<Section id="...">` الذي يقرأ `settings.sections_visibility[id]`. والقسم المخفي يُحذف أيضاً من التنقل (`useNavItems`)، وصفحات المدونة تعرض 404 ولا تُولَّد مسبقاً ولا تدخل الـ sitemap.

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
8. **الـ Intro والطبقات العميلة لا تدخل الـ HTML المولّد أبداً:** تُركَّب بعد الـ hydration فقط (`useHydrated` / `useIdleReady`).
   - الاسم والعنوان ونص الـ Hero والصورة كلها في الـ HTML، ويختبر ذلك `entry-server.test.jsx`.
   - الـ LCP هو نص الاسم: يُرسم مع أول رسم تحت غطاء الـ Intro، ولا يُخفى بـ `opacity` قبل ذلك.
   - أي قيمة تعتمد على المتصفح (الوقت، اللغة الزمنية، قياسات الأداء) تُملأ بعد التركيب في مكان محجوز مسبقاً، فلا يحدث hydration mismatch ولا layout shift.
9. **Resource hints:** `scripts/prerender.js` يقرأ manifest الـ Vite ويضيف:
   - `modulepreload` لـ chunk الصفحة، فلا ينتظر الـ hydration سلسلة طلبات.
   - `preload` لخط العرض الخاص بلغة الصفحة (خط الاسم).

   ثم يحذف الـ manifest من `dist/`.

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
   - بدون مؤشر مخصص وبدون Lenis، و`<MotionConfig reducedMotion="user">`.
10. **الأجهزة اللمسية:** أي تفاعل يعتمد على الماوس (المؤشر المخصص، Magnetic، Tilt، فك التشفير عند المرور) يُحصر عبر `usePointerFine()` أو `@custom-variant pointer-fine`، ويُستبدل على اللمس بانجراف ذاتي هادئ وparallax مرتبط بالتمرير.

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
  - `Cursor`: للماوس فقط.
  - `PageTransition`: ستارة Ember مع `GET /path`.
  - `SoundToggle`: صوت اختياري مطفأ افتراضياً، مولَّد بالـ Web Audio بدون ملفات.
  - `GlobalFx`: المحمّل الكسول.
- **ممنوع CSS داخل الـ chunks الكسولة:** كل الأنماط في `src/styles/` (`fx.css` و`hero.css`)، حتى تظهر الصفحات المولّدة مسبقاً مكتملة التنسيق.
- **`VITE_FX=off`** يعطل كل الطبقات العميلة، ويُستخدم في الاختبارات. المحتوى لا يعتمد عليه أبداً.

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
