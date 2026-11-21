import { media, t } from './helpers';

// MOCK_UNTIL_API: sample case studies, served by the mock adapter until the Laravel API
// is connected. Fictional on purpose: no real clients or companies, and no invented
// figures (metrics are descriptive, or `null` = "No data"). Every record carries
// `is_sample: true`: the UI shows a "Sample" badge, the case-study page is `noindex`
// and it stays out of the sitemap and of the CreativeWork JSON-LD.

/**
 * Projects / case studies. `GET /projects` returns a paginated summary list,
 * `GET /projects/{slug}` returns the full record plus `related_projects`.
 *
 * Contract notes (the Laravel ProjectResource must return the same fields):
 *  - `type`: saas | pos | api (filter facet).
 *  - `cover_image` / `preview_image` / `gallery[].image`: root-relative or absolute URLs.
 *    The samples point at generated SVG screens (`npm run visuals`); real screenshots
 *    replace the path only.
 *  - `architecture`: `nodes[]` (`layer`: client | edge | app | worker | data | external)
 *    and `edges[]` (`kind`: sync | async | realtime). It feeds the case-study diagram.
 *  - `decisions[].nodes`: node ids each decision is about (highlighted in the diagram).
 *  - `metrics[].value`: a descriptive string, or `null` when there is no data.
 *  - `duration`, `live_url`, `github_url`: nullable.
 */
export const projects = [
  {
    id: 1,
    slug: 'sample-saas-billing',
    is_sample: true,
    title: t('منصة SaaS متعددة المستأجرين للاشتراكات', 'Multi-tenant SaaS Subscription Platform'),
    summary: t(
      'منصة SaaS بـ Laravel وReact تخدم عدة مؤسسات من نسخة واحدة: مستأجرون معزولون، خطط اشتراك، فوترة متكررة ومدفوعات عبر webhooks موثّقة.',
      'A Laravel + React SaaS that serves many organisations from one codebase: isolated tenants, subscription plans, recurring billing and signed payment webhooks.',
    ),
    type: 'saas',
    year: 2025,
    is_featured: true,
    role: t(
      'مهندس Full-Stack رئيسي · المعمارية والباك إند',
      'Lead Full-Stack Engineer · architecture & back end',
    ),
    duration: null,
    client: t('عميل نموذجي', 'Sample client'),
    technologies: ['laravel', 'php', 'react', 'mysql', 'redis', 'queues', 'pest', 'docker'],
    cover_image: media('projects/sample-saas-billing/cover.svg'),
    cover_alt: t(
      'لوحة تحكم المستأجر: مؤشرات الاشتراكات ومخطط الإيرادات',
      'Tenant dashboard: subscription indicators and a revenue chart',
    ),
    preview_image: media('projects/sample-saas-billing/preview.svg'),
    gallery: [
      {
        image: media('projects/sample-saas-billing/01.svg'),
        alt: t('جدول الفواتير وحالات الدفع', 'Invoices table with payment states'),
      },
      {
        image: media('projects/sample-saas-billing/02.svg'),
        alt: t('صفحة خطط الاشتراك', 'Subscription plans page'),
      },
      {
        image: media('projects/sample-saas-billing/03.svg'),
        alt: t('إعدادات المستأجر والنطاق المخصص', 'Tenant settings and custom domain'),
      },
    ],
    problem: t(
      'كل عميل جديد كان يعني نسخة منفصلة من التطبيق وقاعدة بيانات وخادماً، والتحديث يُطبَّق يدوياً على كل نسخة. الفوترة جداول وتذكيرات بالبريد، ولا يوجد مصدر واحد للحقيقة عن حالة الاشتراك.',
      'Every new customer meant a separate copy of the app, its own database and server, and each update was applied by hand to every copy. Billing lived in spreadsheets and email reminders, with no single source of truth for a subscription’s state.',
    ),
    solution: t(
      'نسخة واحدة متعددة المستأجرين: يُحدَّد المستأجر من النطاق الفرعي في middleware، وكل استعلام مقيّد بـ global scope. الاشتراكات domain مستقل بحالات صريحة (trial ← active ← past_due ← canceled) تحركها webhooks موقّعة من بوابة الدفع وتعالجها Queues بشكل idempotent.',
      'One multi-tenant instance: a middleware resolves the tenant from the subdomain and a global scope constrains every query. Subscriptions are their own domain with explicit states (trial → active → past_due → canceled), driven by signed gateway webhooks processed idempotently on queues.',
    ),
    challenges: [
      {
        title: t('عزل البيانات بدون تكرار الكود', 'Isolation without duplicated code'),
        body: t(
          'منع تسرّب البيانات بين المستأجرين حتى لو نسي مطوّر شرط tenant_id: global scope إلزامي واختبارات Pest تفشل عند أي استعلام غير مقيّد.',
          'Preventing cross-tenant leaks even when a developer forgets a tenant_id clause: a mandatory global scope, plus Pest tests that fail on any unscoped query.',
        ),
      },
      {
        title: t('webhooks تصل مكررة أو بترتيب خاطئ', 'Webhooks arriving twice or out of order'),
        body: t(
          'التحقق من التوقيع، ومفتاح idempotency لكل حدث، وآلة حالات ترفض الانتقالات غير الصالحة بدلاً من الكتابة فوق الحالة.',
          'Signature verification, an idempotency key per event, and a state machine that rejects invalid transitions instead of overwriting state.',
        ),
      },
      {
        title: t('الترقية والتخفيض في منتصف الدورة', 'Upgrades and downgrades mid-cycle'),
        body: t(
          'حساب التناسب (proration) في Action واحد مختبر، بدلاً من منطق موزع بين الـ controllers.',
          'Proration computed in one tested Action instead of logic scattered across controllers.',
        ),
      },
    ],
    architecture: {
      nodes: [
        { id: 'spa', label: 'Tenant SPA', layer: 'client', note: 'React' },
        { id: 'admin', label: 'Admin Console', layer: 'client', note: 'React' },
        { id: 'api', label: 'REST API', layer: 'edge', note: 'Laravel · Sanctum' },
        { id: 'tenancy', label: 'Tenant Resolver', layer: 'edge', note: 'middleware' },
        { id: 'billing', label: 'Billing', layer: 'app', note: 'domain' },
        { id: 'subs', label: 'Subscriptions', layer: 'app', note: 'state machine' },
        { id: 'hooks', label: 'Webhook Inbox', layer: 'app', note: 'signed · idempotent' },
        { id: 'workers', label: 'Queue Workers', layer: 'worker', note: 'Horizon' },
        { id: 'db', label: 'MySQL', layer: 'data', note: 'tenant scoped' },
        { id: 'cache', label: 'Redis', layer: 'data', note: 'cache · queues' },
        { id: 'gateway', label: 'Payment Gateway', layer: 'external' },
        { id: 'mail', label: 'Mail Provider', layer: 'external' },
      ],
      edges: [
        { from: 'spa', to: 'api', kind: 'sync', label: 'HTTPS' },
        { from: 'admin', to: 'api', kind: 'sync' },
        { from: 'api', to: 'tenancy', kind: 'sync' },
        { from: 'tenancy', to: 'billing', kind: 'sync' },
        { from: 'tenancy', to: 'subs', kind: 'sync' },
        { from: 'gateway', to: 'hooks', kind: 'async', label: 'webhook' },
        { from: 'hooks', to: 'workers', kind: 'async' },
        { from: 'workers', to: 'subs', kind: 'async' },
        { from: 'billing', to: 'db', kind: 'sync' },
        { from: 'subs', to: 'db', kind: 'sync' },
        { from: 'workers', to: 'cache', kind: 'async' },
        { from: 'workers', to: 'mail', kind: 'async' },
      ],
    },
    decisions: [
      {
        title: t('قاعدة بيانات واحدة مع tenant_id', 'One database, scoped by tenant_id'),
        body: t(
          'أبسط تشغيلاً من قاعدة لكل مستأجر في هذه المرحلة: ترحيل واحد ونسخ احتياطي واحد. العزل مضمون في طبقة التطبيق ومختبر، والانتقال لقاعدة لكل مستأجر يبقى ممكناً خلف نفس الـ resolver.',
          'Simpler to operate than a database per tenant at this stage: one migration, one backup. Isolation is enforced and tested in the application layer, and moving to per-tenant databases stays possible behind the same resolver.',
        ),
        nodes: ['tenancy', 'db'],
      },
      {
        title: t('الاشتراك آلة حالات', 'The subscription is a state machine'),
        body: t(
          'كل انتقال (trial → active → past_due → canceled) له Action وحدث، فلا توجد حالة يكتبها أي كود مباشرة.',
          'Every transition (trial → active → past_due → canceled) has an Action and an event, so no code writes the state directly.',
        ),
        nodes: ['subs', 'billing'],
      },
      {
        title: t('webhooks في صندوق وارد ثم Queue', 'Webhooks land in an inbox, then a queue'),
        body: t(
          'الـ endpoint يتحقق من التوقيع ويخزن الحدث ويرد 200 فوراً، والمعالجة الفعلية في worker قابل لإعادة المحاولة بمفتاح idempotency.',
          'The endpoint verifies the signature, stores the event and answers 200 at once; the real processing runs in a retryable worker keyed for idempotency.',
        ),
        nodes: ['gateway', 'hooks', 'workers'],
      },
    ],
    metrics: [
      {
        label: t('العزل', 'Tenancy'),
        value: t('قاعدة واحدة · tenant_id scoping', 'Single DB · tenant_id scoping'),
      },
      { label: t('الفوترة', 'Billing'), value: t('متكررة + حسب الاستخدام', 'Recurring + metered') },
      { label: t('التكامل', 'Integration'), value: 'REST + Webhooks' },
      { label: t('زمن التشغيل', 'Uptime'), value: null },
      { label: t('تغطية الاختبارات', 'Test coverage'), value: null },
    ],
    live_url: null,
    github_url: null,
    published_at: '2025-06-01',
    updated_at: '2025-06-01',
  },
  {
    id: 2,
    slug: 'sample-inventory-pos',
    is_sample: true,
    title: t('نظام مخزون ونقاط بيع بلوحة تحكم', 'Inventory & Point-of-Sale System'),
    summary: t(
      'نقاط بيع تعمل حتى مع انقطاع الإنترنت، ومخزون موحد لعدة فروع، ولوحة تحكم بصلاحيات حسب الدور وتقارير يومية.',
      'A point of sale that keeps selling when the connection drops, one inventory across branches, and a dashboard with role-based access and daily reports.',
    ),
    type: 'pos',
    year: 2025,
    is_featured: true,
    role: t(
      'مهندس Full-Stack · الباك إند ولوحة التحكم',
      'Full-Stack Engineer · back end & dashboard',
    ),
    duration: null,
    client: t('عميل نموذجي', 'Sample client'),
    technologies: ['laravel', 'php', 'react', 'tailwind', 'mysql', 'redis', 'queues'],
    cover_image: media('projects/sample-inventory-pos/cover.svg'),
    cover_alt: t(
      'شاشة نقطة البيع: شبكة المنتجات وسلة الطلب',
      'Point-of-sale screen: product grid and order basket',
    ),
    preview_image: media('projects/sample-inventory-pos/preview.svg'),
    gallery: [
      {
        image: media('projects/sample-inventory-pos/01.svg'),
        alt: t('جدول المخزون ومستويات إعادة الطلب', 'Inventory table with reorder levels'),
      },
      {
        image: media('projects/sample-inventory-pos/02.svg'),
        alt: t('تقرير المبيعات اليومي حسب الفرع', 'Daily sales report by branch'),
      },
      {
        image: media('projects/sample-inventory-pos/03.svg'),
        alt: t('إدارة الأدوار والصلاحيات', 'Roles and permissions management'),
      },
    ],
    problem: t(
      'الكاشير يتوقف عند انقطاع الإنترنت، والمخزون يُجرد يدوياً في كل فرع فلا تتطابق الأرقام، وكل الموظفين يرون كل شيء بما فيه الأسعار والتقارير.',
      'Tills stopped whenever the connection dropped, stock was counted by hand in every branch so figures never matched, and every employee could see everything, prices and reports included.',
    ),
    solution: t(
      'نقطة بيع offline-first تحفظ العمليات محلياً وتزامنها عبر Queue عند عودة الاتصال مع حل التعارضات على مستوى حركة المخزون لا على مستوى الرصيد. المخزون دفتر حركات (ledger) والرصيد يُشتق منه، وRBAC يحدد ما يراه كل دور.',
      'An offline-first till that records sales locally and syncs them through a queue when the connection returns, resolving conflicts per stock movement rather than per balance. Inventory is a movement ledger with derived balances, and RBAC decides what each role can see.',
    ),
    challenges: [
      {
        title: t(
          'بيع نفس القطعة في فرعين أثناء الانقطاع',
          'Selling the same item twice while offline',
        ),
        body: t(
          'الحركات تُسجَّل كأحداث بمعرّف فريد، والمزامنة تطبقها بالترتيب وتصدر تنبيه عجز بدلاً من رصيد سالب صامت.',
          'Movements are recorded as uniquely identified events; sync applies them in order and raises a shortage alert instead of a silent negative balance.',
        ),
      },
      {
        title: t('تقارير سريعة على بيانات تكبر يومياً', 'Fast reports on data that grows daily'),
        body: t(
          'تجميعات يومية مجدولة في جداول ملخصة مع Cache، فلا تمس لوحة التحكم جدول الحركات الخام.',
          'Scheduled daily aggregates in summary tables with caching, so the dashboard never scans the raw movements table.',
        ),
      },
    ],
    architecture: {
      nodes: [
        { id: 'till', label: 'POS Till', layer: 'client', note: 'offline-first' },
        { id: 'dash', label: 'Dashboard', layer: 'client', note: 'React · Tailwind' },
        { id: 'api', label: 'REST API', layer: 'edge', note: 'Laravel · RBAC' },
        { id: 'sales', label: 'Sales', layer: 'app' },
        { id: 'ledger', label: 'Stock Ledger', layer: 'app', note: 'append-only' },
        { id: 'reports', label: 'Reports', layer: 'app' },
        { id: 'sync', label: 'Sync Jobs', layer: 'worker', note: 'ordered · retryable' },
        { id: 'scheduler', label: 'Scheduler', layer: 'worker', note: 'daily aggregates' },
        { id: 'db', label: 'MySQL', layer: 'data' },
        { id: 'cache', label: 'Redis', layer: 'data' },
      ],
      edges: [
        { from: 'till', to: 'api', kind: 'async', label: 'sync batch' },
        { from: 'dash', to: 'api', kind: 'sync' },
        { from: 'api', to: 'sales', kind: 'sync' },
        { from: 'api', to: 'reports', kind: 'sync' },
        { from: 'api', to: 'sync', kind: 'async' },
        { from: 'sync', to: 'ledger', kind: 'async' },
        { from: 'sales', to: 'ledger', kind: 'sync' },
        { from: 'ledger', to: 'db', kind: 'sync' },
        { from: 'scheduler', to: 'db', kind: 'async' },
        { from: 'reports', to: 'cache', kind: 'sync' },
      ],
    },
    decisions: [
      {
        title: t('المخزون دفتر حركات لا رقم', 'Stock is a ledger, not a number'),
        body: t(
          'كل بيع أو توريد أو تحويل حركة لا تُعدَّل، والرصيد مشتق. التدقيق مجاني، وتصحيح الخطأ حركة عكسية.',
          'Every sale, delivery or transfer is an immutable movement and the balance is derived. Auditing comes for free, and fixing a mistake is a reversing entry.',
        ),
        nodes: ['ledger', 'db'],
      },
      {
        title: t('المزامنة عبر Queue مرتبة', 'Sync through an ordered queue'),
        body: t(
          'دفعات الكاشير تدخل Queue وتُطبق بالترتيب مع إعادة محاولة، فلا تضيع عملية ولا تتكرر.',
          'Till batches enter a queue and are applied in order with retries, so no sale is lost or doubled.',
        ),
        nodes: ['till', 'sync', 'ledger'],
      },
      {
        title: t('التقارير من جداول ملخصة', 'Reports read summary tables'),
        body: t(
          'المجدول يبني الملخصات ليلاً ونهاراً، ولوحة التحكم تقرأها من Cache.',
          'The scheduler builds summaries on a schedule and the dashboard reads them through the cache.',
        ),
        nodes: ['scheduler', 'reports', 'cache'],
      },
    ],
    metrics: [
      { label: t('وضع التشغيل', 'Mode'), value: t('Offline-first', 'Offline-first') },
      {
        label: t('المزامنة', 'Sync'),
        value: t('Queue مرتبة · تعي التعارض', 'Ordered queue · conflict-aware'),
      },
      {
        label: t('الصلاحيات', 'Access'),
        value: t('RBAC حسب الدور والفرع', 'RBAC per role & branch'),
      },
      { label: t('معدل العمليات', 'Throughput'), value: null },
    ],
    live_url: null,
    github_url: null,
    published_at: '2025-03-01',
    updated_at: '2025-03-01',
  },
  {
    id: 3,
    slug: 'sample-delivery-dispatch',
    is_sample: true,
    title: t('API توصيل وحجوزات مع إشعارات لحظية', 'Delivery & Booking API with Live Dispatch'),
    summary: t(
      'واجهة API لتطبيقات العميل والمندوب ولوحة إدارة للتوزيع، مع تتبع لحظي عبر WebSockets وإشعارات Push وSMS.',
      'An API for the customer and courier apps plus a dispatch console, with live tracking over WebSockets and push and SMS notifications.',
    ),
    type: 'api',
    year: 2024,
    is_featured: true,
    role: t(
      'مهندس باك إند · الـ API والأنظمة اللحظية',
      'Back-end Engineer · API & real-time systems',
    ),
    duration: null,
    client: t('عميل نموذجي', 'Sample client'),
    technologies: [
      'laravel',
      'php',
      'rest-api',
      'sanctum',
      'postgresql',
      'redis',
      'queues',
      'react',
    ],
    cover_image: media('projects/sample-delivery-dispatch/cover.svg'),
    cover_alt: t(
      'تطبيق العميل والمندوب: خريطة الرحلة وحالة الطلب',
      'Customer and courier apps: trip map and order status',
    ),
    preview_image: media('projects/sample-delivery-dispatch/preview.svg'),
    gallery: [
      {
        image: media('projects/sample-delivery-dispatch/01.svg'),
        alt: t('لوحة التوزيع: الطلبات حسب الحالة', 'Dispatch board: orders by status'),
      },
      {
        image: media('projects/sample-delivery-dispatch/02.svg'),
        alt: t('سجل الإشعارات وقنوات الإرسال', 'Notification log and delivery channels'),
      },
      {
        image: media('projects/sample-delivery-dispatch/03.svg'),
        alt: t('شاشات تطبيق المندوب', 'Courier app screens'),
      },
    ],
    problem: t(
      'الطلبات تُوزَّع بالهاتف، والعميل لا يعرف أين طلبه، وكل تطبيق جوال يستهلك endpoints مختلفة بلا إصدارات فيكسر أي تحديث في الباك إند التطبيقات القديمة.',
      'Orders were dispatched by phone, customers had no idea where their order was, and each mobile app consumed different, unversioned endpoints, so any back-end change broke older app builds.',
    ),
    solution: t(
      'API واحدة بإصدارات (v1) وتوثيق OpenAPI، ومصادقة Sanctum بصلاحيات لكل نوع مستخدم. التوزيع event-driven: كل تغيير حالة حدث يُبث عبر WebSockets للوحة والعميل، ويطلق إشعارات عبر Queues.',
      'One versioned API (v1) with OpenAPI docs and Sanctum auth scoped per user type. Dispatch is event-driven: every status change is an event broadcast over WebSockets to the console and the customer, and it fans out notifications through queues.',
    ),
    challenges: [
      {
        title: t('مواقع المندوبين بتردد عالٍ', 'High-frequency courier locations'),
        body: t(
          'آخر موقع في Redis فقط والبث مباشر، بدلاً من كتابة كل نقطة في قاعدة البيانات.',
          'Only the latest position lives in Redis and is broadcast directly, instead of writing every point to the database.',
        ),
      },
      {
        title: t('تطبيقات قديمة في أيدي المستخدمين', 'Old app builds in users’ hands'),
        body: t(
          'إصدارات API صريحة وResources ثابتة الشكل، وإيقاف الإصدار القديم يتم بإعلان ومهلة.',
          'Explicit API versions with stable-shaped Resources; retiring an old version comes with notice and a grace period.',
        ),
      },
      {
        title: t('إشعار واحد عبر عدة قنوات', 'One notification, several channels'),
        body: t(
          'Notification واحد بقنوات Push وSMS وبريد، وكل قناة job مستقل قابل لإعادة المحاولة.',
          'One Notification with push, SMS and mail channels; each channel is its own retryable job.',
        ),
      },
    ],
    architecture: {
      nodes: [
        { id: 'customer', label: 'Customer App', layer: 'client' },
        { id: 'courier', label: 'Courier App', layer: 'client' },
        { id: 'console', label: 'Dispatch Console', layer: 'client', note: 'React' },
        { id: 'api', label: 'API v1', layer: 'edge', note: 'Sanctum · OpenAPI' },
        { id: 'ws', label: 'WebSocket Server', layer: 'edge', note: 'broadcasting' },
        { id: 'orders', label: 'Orders', layer: 'app', note: 'events' },
        { id: 'dispatch', label: 'Dispatch', layer: 'app', note: 'assignment' },
        { id: 'notify', label: 'Notification Jobs', layer: 'worker' },
        { id: 'db', label: 'PostgreSQL', layer: 'data' },
        { id: 'redis', label: 'Redis', layer: 'data', note: 'positions · queues' },
        { id: 'push', label: 'Push / SMS', layer: 'external' },
      ],
      edges: [
        { from: 'customer', to: 'api', kind: 'sync' },
        { from: 'courier', to: 'api', kind: 'sync' },
        { from: 'console', to: 'api', kind: 'sync' },
        { from: 'api', to: 'orders', kind: 'sync' },
        { from: 'orders', to: 'dispatch', kind: 'sync' },
        { from: 'dispatch', to: 'ws', kind: 'realtime', label: 'broadcast' },
        { from: 'ws', to: 'console', kind: 'realtime' },
        { from: 'ws', to: 'customer', kind: 'realtime' },
        { from: 'orders', to: 'notify', kind: 'async' },
        { from: 'notify', to: 'push', kind: 'async' },
        { from: 'orders', to: 'db', kind: 'sync' },
        { from: 'dispatch', to: 'redis', kind: 'sync' },
      ],
    },
    decisions: [
      {
        title: t('كل تغيير حالة حدث', 'Every status change is an event'),
        body: t(
          'OrderStatusChanged يغذي البث والإشعارات والتقارير، فإضافة مستهلك جديد لا تمس منطق الطلب.',
          'OrderStatusChanged feeds broadcasting, notifications and reporting, so adding a consumer never touches order logic.',
        ),
        nodes: ['orders', 'dispatch', 'notify'],
      },
      {
        title: t('WebSockets للحالة الحية فقط', 'WebSockets for live state only'),
        body: t(
          'الكتابة دائماً عبر REST، والقناة اللحظية للقراءة: أبسط في الأمان وإعادة الاتصال.',
          'Writes always go through REST and the live channel is read-only: simpler security and reconnection.',
        ),
        nodes: ['ws', 'console', 'customer'],
      },
      {
        title: t('الموقع اللحظي في Redis', 'Live positions in Redis'),
        body: t(
          'بيانات عابرة لا تحتاج قاعدة بيانات علائقية، ويُحفظ في PostgreSQL ما يلزم للتاريخ فقط.',
          'Ephemeral data that doesn’t need a relational database; PostgreSQL keeps only what history needs.',
        ),
        nodes: ['dispatch', 'redis', 'db'],
      },
    ],
    metrics: [
      { label: t('النقل', 'Transport'), value: 'REST + WebSocket' },
      { label: t('التوزيع', 'Dispatch'), value: t('Event-driven', 'Event-driven') },
      { label: t('الإشعارات', 'Notifications'), value: 'Push · SMS · Email' },
      { label: t('زمن الاستجابة p95', 'p95 latency'), value: null },
    ],
    live_url: null,
    github_url: null,
    published_at: '2024-10-01',
    updated_at: '2024-10-01',
  },
];
