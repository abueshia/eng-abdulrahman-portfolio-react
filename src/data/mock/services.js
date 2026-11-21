import { t } from './helpers';

// MOCK_UNTIL_API: services catalogue, served by the mock adapter until the Laravel API
// is connected. The owner's real offering; the API will return the same fields.

/**
 * Service groups, in display order. `GET /services` returns every service with its
 * `group` slug; the UI groups them (the backend keeps the list flat).
 */
export const serviceGroups = [
  { slug: 'backend', name: t('الباك إند والتكاملات', 'Backend & Integrations'), sort: 1 },
  { slug: 'frontend', name: t('الفرونت إند', 'Frontend'), sort: 2 },
  { slug: 'growth', name: t('النمو: SEO وGEO', 'Growth: SEO & GEO'), sort: 3 },
  { slug: 'infra', name: t('البنية التحتية والذكاء الاصطناعي', 'Infra & AI'), sort: 4 },
  { slug: 'support', name: t('الدعم', 'Support'), sort: 5 },
];

/**
 * GET /services. Each service is presented as an API contract:
 * `method` + `slug` form the endpoint (`POST /services/{slug}`), `deliverables`
 * is the 200 response body and `stack` lists tools/providers it covers.
 */
export const services = [
  {
    id: 1,
    slug: 'rest-api',
    group: 'backend',
    method: 'POST',
    title: t('تصميم وبناء REST APIs', 'REST API Design & Development'),
    description: t(
      'واجهات Laravel نظيفة تخدم الويب والجوال وأنظمة الشركاء، بعقد واضح وموثق يصمد مع تطور المنتج.',
      'Clean Laravel APIs for web, mobile and partner systems, with a clear, documented contract that holds as the product evolves.',
    ),
    deliverables: t(
      [
        'تصميم الموارد والمسارات وغلاف استجابة موحد',
        'توثيق OpenAPI / Swagger قابل للتجربة',
        'إصدارات API (v1, v2) وسياسة إيقاف الإصدارات القديمة',
        'مصادقة Sanctum وصلاحيات Policies',
        'Rate limiting ومعالجة أخطاء متسقة (422، 404، 429)',
        'اختبارات Feature لكل endpoint',
      ],
      [
        'Resource and route design with one response envelope',
        'Interactive OpenAPI / Swagger documentation',
        'API versioning (v1, v2) and a deprecation policy',
        'Sanctum authentication and Policy-based authorization',
        'Rate limiting and consistent errors (422, 404, 429)',
        'Feature tests for every endpoint',
      ],
    ),
    stack: ['Laravel', 'Sanctum', 'OpenAPI', 'Pest'],
  },
  {
    id: 2,
    slug: 'payment-integration',
    group: 'backend',
    method: 'POST',
    title: t('تكامل بوابات الدفع', 'Payment Gateway Integration'),
    description: t(
      'دفع آمن ومحلي وعالمي، من صفحة الدفع حتى تسوية الحالة في نظامك، مع webhooks موثوقة واسترجاع منظم.',
      'Secure local and international payments, from checkout to the final state in your system, with reliable webhooks and clean refunds.',
    ),
    deliverables: t(
      [
        'تكامل الدفع لمرة واحدة والاشتراكات المتكررة',
        'Webhooks مع التحقق من التوقيع ومعالجة idempotent',
        'إدارة الاسترجاع الكامل والجزئي',
        'آلة حالات للطلب والدفع تمنع الحالات المتضاربة',
        'سجل عمليات قابل للتدقيق وبيئة sandbox للاختبار',
      ],
      [
        'One-off payments and recurring subscriptions',
        'Webhooks with signature verification and idempotent handling',
        'Full and partial refund management',
        'An order/payment state machine that rules out conflicting states',
        'An auditable transaction log and a sandbox test setup',
      ],
    ),
    stack: ['PayPal', 'Paymob', 'Fawry', 'Tap', 'HyperPay'],
  },
  {
    id: 3,
    slug: 'third-party-integrations',
    group: 'backend',
    method: 'POST',
    title: t('تكامل واجهات الطرف الثالث', 'Third-party API Integrations'),
    description: t(
      'ربط نظامك بالخدمات التي يعتمد عليها عملك، خلف طبقة adapters تحميه من تغيّر أي مزوّد.',
      'Connecting your system to the services your business runs on, behind an adapter layer that shields it from any provider’s changes.',
    ),
    deliverables: t(
      [
        'شركات الشحن: إنشاء الشحنات والتتبع وحساب التكلفة (Aramex، Bosta...)',
        'رسائل SMS وWhatsApp Business API',
        'الخرائط وتحديد المواقع وحساب المسافات',
        'تسجيل الدخول الاجتماعي (Google، Apple، Facebook)',
        'المزامنة مع أنظمة ERP وCRM',
        'إعادة المحاولة والمراقبة لكل تكامل عبر Queues',
      ],
      [
        'Shipping carriers: shipments, tracking and rates (Aramex, Bosta…)',
        'SMS and the WhatsApp Business API',
        'Maps, geolocation and distance calculation',
        'Social login (Google, Apple, Facebook)',
        'Sync with ERP and CRM systems',
        'Queued retries and monitoring for every integration',
      ],
    ),
    stack: ['Aramex', 'Bosta', 'WhatsApp Business', 'Google Maps', 'OAuth'],
  },
  {
    id: 4,
    slug: 'saas-platforms',
    group: 'backend',
    method: 'POST',
    title: t(
      'تطبيقات ويب متكاملة وSaaS متعددة المستأجرين',
      'Full-stack Web Apps & Multi-tenant SaaS',
    ),
    description: t(
      'منتج كامل من نموذج البيانات حتى الإطلاق، ومنصات SaaS تخدم عملاء كثيرين من نسخة واحدة.',
      'A complete product from data model to launch, and SaaS platforms that serve many customers from one codebase.',
    ),
    deliverables: t(
      [
        'معمارية Multi-tenancy مع عزل بيانات مختبر',
        'خطط اشتراك وتجارب مجانية وترقية وتخفيض',
        'فوترة متكررة وفواتير وتناسب (proration)',
        'لوحة مالك المنصة ولوحة كل مستأجر',
        'Onboarding ونطاقات مخصصة',
      ],
      [
        'Multi-tenancy architecture with tested data isolation',
        'Subscription plans, trials, upgrades and downgrades',
        'Recurring billing, invoices and proration',
        'Platform-owner and per-tenant dashboards',
        'Onboarding and custom domains',
      ],
    ),
    stack: ['Laravel', 'React', 'MySQL', 'Redis'],
  },
  {
    id: 5,
    slug: 'admin-dashboards',
    group: 'frontend',
    method: 'POST',
    title: t('لوحات تحكم وأنظمة إدارة', 'Admin Dashboards & Management Systems'),
    description: t(
      'لوحات تحكم وأنظمة ERP وPOS يستخدمها فريقك كل يوم، سريعة وواضحة وبصلاحيات دقيقة.',
      'Dashboards, ERP and POS systems your team uses every day: fast, clear and precisely permissioned.',
    ),
    deliverables: t(
      [
        'صلاحيات RBAC حسب الدور والفرع',
        'جداول بيانات بفلاتر وبحث وتصدير',
        'تقارير ومخططات من تجميعات مجدولة',
        'سجل نشاط (audit log) لكل عملية حساسة',
        'واجهة ثنائية الاتجاه عربي/إنجليزي',
      ],
      [
        'RBAC permissions per role and branch',
        'Data tables with filters, search and export',
        'Reports and charts from scheduled aggregates',
        'An audit log for every sensitive action',
        'A bidirectional Arabic/English interface',
      ],
    ),
    stack: ['React', 'Laravel', 'RBAC', 'Tailwind'],
  },
  {
    id: 6,
    slug: 'ecommerce',
    group: 'frontend',
    method: 'POST',
    title: t('متاجر إلكترونية ومنصات تجارة', 'E-commerce Stores & Platforms'),
    description: t(
      'متاجر تبيع فعلاً: تجربة شراء سلسة من الصفحة حتى الدفع، وإدارة خلفية للمخزون والطلبات.',
      'Stores that actually sell: a smooth path from product page to payment, and a back office for stock and orders.',
    ),
    deliverables: t(
      [
        'كتالوج ومتغيرات منتجات وبحث وفلاتر',
        'سلة وكوبونات وعروض',
        'إدارة المخزون والطلبات والمرتجعات',
        'تكامل الدفع والشحن',
        'صفحات منتجات سريعة ومهيأة لمحركات البحث',
      ],
      [
        'Catalogue, product variants, search and filters',
        'Cart, coupons and promotions',
        'Inventory, order and returns management',
        'Payment and shipping integration',
        'Fast, search-ready product pages',
      ],
    ),
    stack: ['Laravel', 'React', 'Payments', 'Shipping'],
  },
  {
    id: 7,
    slug: 'react-frontends',
    group: 'frontend',
    method: 'PUT',
    title: t('واجهات React عالية الأداء', 'High-performance React Front-ends'),
    description: t(
      'واجهات سريعة ومتاحة للجميع بتجربة مستخدم مدروسة، مبنية على نظام تصميم يكبر مع المنتج.',
      'Fast, accessible interfaces with a considered user experience, built on a design system that grows with the product.',
    ),
    deliverables: t(
      [
        'نظام تصميم ومكوّنات قابلة لإعادة الاستخدام',
        'تحسين Core Web Vitals (LCP، INP، CLS)',
        'تقسيم الكود وتحميل كسول للأجزاء الثقيلة',
        'إتاحة WCAG ودعم RTL/LTR كامل',
        'حركة مدروسة تحترم تقليل الحركة',
      ],
      [
        'A design system and reusable components',
        'Core Web Vitals optimisation (LCP, INP, CLS)',
        'Code splitting and lazy loading for heavy parts',
        'WCAG accessibility and full RTL/LTR support',
        'Purposeful motion that respects reduced-motion settings',
      ],
    ),
    stack: ['React', 'Vite', 'Tailwind', 'TanStack Query'],
  },
  {
    id: 8,
    slug: 'technical-seo',
    group: 'growth',
    method: 'PATCH',
    title: t('السيو التقني Technical SEO', 'Technical SEO'),
    description: t(
      'أساس تقني يجعل موقعك قابلاً للزحف والفهرسة والفهم بدقة. لا وعود بترتيب، بل موقع يستحقه.',
      'A technical foundation that makes your site crawlable, indexable and correctly understood. No ranking promises: a site that deserves to rank.',
    ),
    deliverables: t(
      [
        'SSR أو Prerender بحيث يقرأ الزاحف HTML كاملاً',
        'بيانات منظمة JSON-LD تطابق المحتوى الظاهر',
        'Sitemaps وhreflang وcanonical صحيحة لكل لغة',
        'تحسين السرعة وCore Web Vitals',
        'تدقيق تقني وإعداد Google Search Console',
      ],
      [
        'SSR or prerendering, so crawlers read complete HTML',
        'JSON-LD structured data that matches the visible content',
        'Correct sitemaps, hreflang and canonicals for every language',
        'Speed and Core Web Vitals improvements',
        'A technical audit and Google Search Console setup',
      ],
    ),
    stack: ['SSR / SSG', 'JSON-LD', 'hreflang', 'Search Console'],
  },
  {
    id: 9,
    slug: 'geo',
    group: 'growth',
    method: 'PATCH',
    title: t('GEO: التهيئة لمحركات الذكاء الاصطناعي', 'GEO: Generative Engine Optimization'),
    description: t(
      'تجهيز محتواك وموقعك ليُفهم ويُقتبس بدقة في إجابات محركات الذكاء الاصطناعي مثل ChatGPT وPerplexity وGemini. تحسين لفرص الظهور، لا ضمان له.',
      'Preparing your content and site to be understood and quoted accurately in AI answers from engines such as ChatGPT, Perplexity and Gemini. Better chances of appearing, not a guarantee.',
    ),
    deliverables: t(
      [
        'كيانات واضحة وبيانات منظمة تربط الهوية عبر المنصات',
        'محتوى بصيغة أسئلة وإجابات قابل للاقتباس',
        'ملف llms.txt وهيكلة صفحات سهلة القراءة آلياً',
        'ربط الهوية (sameAs) والمصادر الموثوقة',
        'مراجعة دورية لكيف تصف المحركات علامتك',
      ],
      [
        'Clear entities and structured data that link your identity across platforms',
        'Quotable, answer-shaped content',
        'An llms.txt file and machine-readable page structure',
        'Identity linking (sameAs) and authoritative sources',
        'Periodic review of how engines describe your brand',
      ],
    ),
    stack: ['Schema.org', 'llms.txt', 'Entities', 'Content'],
  },
  {
    id: 10,
    slug: 'realtime-notifications',
    group: 'backend',
    method: 'POST',
    title: t('أنظمة لحظية وإشعارات', 'Real-time Systems & Notifications'),
    description: t(
      'تحديثات تصل لحظة حدوثها، ومهام ثقيلة تعمل في الخلفية دون أن ينتظرها المستخدم.',
      'Updates that arrive the moment they happen, and heavy work that runs in the background without making anyone wait.',
    ),
    deliverables: t(
      [
        'WebSockets عبر Laravel Reverb أو Pusher',
        'Queues وJobs مع إعادة المحاولة والمراقبة (Horizon)',
        'إشعارات بريد وPush وSMS من مصدر واحد',
        'بث الأحداث للوحات التحكم والتطبيقات',
      ],
      [
        'WebSockets with Laravel Reverb or Pusher',
        'Queues and jobs with retries and monitoring (Horizon)',
        'Mail, push and SMS notifications from one source',
        'Event broadcasting to dashboards and apps',
      ],
    ),
    stack: ['Reverb', 'Pusher', 'Horizon', 'Redis'],
  },
  {
    id: 11,
    slug: 'ai-integration',
    group: 'infra',
    method: 'POST',
    title: t('تكامل الذكاء الاصطناعي', 'AI Integration'),
    description: t(
      'إضافة الذكاء الاصطناعي حيث يوفر وقتاً حقيقياً، بتكلفة وخصوصية تحت السيطرة.',
      'Adding AI where it saves real time, with cost and privacy kept under control.',
    ),
    deliverables: t(
      [
        'تكامل واجهات OpenAI وClaude',
        'Chatbots مبنية على محتواك وبياناتك',
        'أتمتة سير العمل (تصنيف، تلخيص، استخراج بيانات)',
        'حدود للتكلفة وتسجيل ومراجعة المخرجات',
      ],
      [
        'OpenAI and Claude API integration',
        'Chatbots grounded in your content and data',
        'Workflow automation (classification, summaries, data extraction)',
        'Cost limits, logging and output review',
      ],
    ),
    stack: ['OpenAI', 'Claude', 'Queues', 'Webhooks'],
  },
  {
    id: 12,
    slug: 'devops',
    group: 'infra',
    method: 'PUT',
    title: t('DevOps والنشر', 'DevOps & Deployment'),
    description: t(
      'نشر متكرر بلا قلق: بيئات متطابقة، وخط نشر آلي، ومراقبة تنبهك قبل المستخدم.',
      'Deploy often without fear: matching environments, an automated pipeline and monitoring that warns you before users notice.',
    ),
    deliverables: t(
      [
        'Docker لبيئات تطوير وإنتاج متطابقة',
        'CI/CD: اختبارات ونشر آلي',
        'إعداد VPS أو Vercel وشهادات SSL',
        'مراقبة الأخطاء والأداء',
        'تحسين أداء قاعدة البيانات والفهارس',
      ],
      [
        'Docker for matching development and production environments',
        'CI/CD: automated tests and deploys',
        'VPS or Vercel setup and SSL certificates',
        'Error and performance monitoring',
        'Database performance and index tuning',
      ],
    ),
    stack: ['Docker', 'GitHub Actions', 'Linux', 'Vercel'],
  },
  {
    id: 13,
    slug: 'performance-modernization',
    group: 'support',
    method: 'PATCH',
    title: t(
      'تحسين الأداء وتحديث الأنظمة القديمة',
      'Performance, Code Review & Legacy Modernization',
    ),
    description: t(
      'تحويل كود قديم يصعب لمسه إلى كود نظيف ومختبر وسريع، على مراحل ودون إيقاف العمل.',
      'Turning legacy code nobody dares touch into clean, tested, fast code, in stages and without stopping the business.',
    ),
    deliverables: t(
      [
        'مراجعة كود وتقرير أولويات واضح',
        'إصلاح الاستعلامات البطيئة ومشكلات N+1',
        'ترقية إصدارات PHP وLaravel',
        'إعادة هيكلة تدريجية نحو Clean Architecture',
        'شبكة أمان من الاختبارات الآلية قبل أي تغيير',
      ],
      [
        'A code review with a clear priority report',
        'Fixing slow queries and N+1 problems',
        'PHP and Laravel version upgrades',
        'Incremental refactoring toward Clean Architecture',
        'An automated test safety net before any change',
      ],
    ),
    stack: ['PHP 8.3', 'Laravel', 'Pest', 'Profiling'],
  },
  {
    id: 14,
    slug: 'consulting-support',
    group: 'support',
    method: 'GET',
    title: t('استشارات تقنية وصيانة ودعم', 'Technical Consulting, Maintenance & Support'),
    description: t(
      'قرارات تقنية مدروسة قبل البناء، ونظام يبقى سليماً ومحدثاً بعد الإطلاق.',
      'Considered technical decisions before you build, and a system that stays healthy and up to date after launch.',
    ),
    deliverables: t(
      [
        'اختيار التقنيات والمعمارية المناسبة لمرحلتك',
        'مراجعة القرارات التقنية وتوجيه الفريق',
        'صيانة دورية وتحديثات أمنية',
        'دعم ما بعد الإطلاق بأوقات استجابة متفق عليها',
      ],
      [
        'Choosing the right stack and architecture for your stage',
        'Technical decision reviews and team mentoring',
        'Regular maintenance and security updates',
        'Post-launch support with agreed response times',
      ],
    ),
    stack: ['Architecture', 'Mentoring', 'Maintenance'],
  },
];
