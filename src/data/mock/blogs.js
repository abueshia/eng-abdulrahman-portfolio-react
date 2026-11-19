import { media, t } from './helpers';

// MOCK_UNTIL_API: sample articles, served by the mock adapter until the Laravel API
// is connected. Clearly fictional on purpose; never publish as real content.

/**
 * GET /blogs (paginated), GET /blogs/{slug}, GET /blogs/categories.
 * `content` is HTML (as produced by a rich-text editor on the Laravel side);
 * the UI sanitises it before rendering.
 */
export const blogCategories = [
  { slug: 'laravel', name: t('Laravel', 'Laravel') },
  { slug: 'architecture', name: t('المعمارية', 'Architecture') },
  { slug: 'react', name: t('React', 'React') },
];

const actionsArticle = {
  ar: `<p>عندما يكبر الـ Controller يصبح من الصعب اختباره وإعادة استخدامه. نمط <strong>Action</strong> يعطي كل عملية في النظام كلاساً واحداً بمسؤولية واحدة.</p>
<h2 id="the-problem">المشكلة</h2>
<p>Controller يتحقق من البيانات، وينشئ الطلب، ويرسل الإيميل، ويحدّث المخزون. أي تغيير هنا قد يكسر شيئاً هناك.</p>
<h2 id="the-action">الحل: Action واحد لكل حالة استخدام</h2>
<pre><code class="language-php">final class PlaceOrderAction
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly InventoryService $inventory,
    ) {}

    public function execute(PlaceOrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->inventory->reserve($data->items);

            return tap($this->orders->create($data), fn (Order $order) =>
                OrderPlaced::dispatch($order)
            );
        });
    }
}</code></pre>
<h2 id="testing">الاختبار يصبح بديهياً</h2>
<p>الـ Action يُختبر بمعزل عن HTTP تماماً، والـ Controller يصبح سطراً واحداً.</p>`,
  en: `<p>When a controller grows, it becomes hard to test and impossible to reuse. The <strong>Action</strong> pattern gives every use case in the system a single class with a single responsibility.</p>
<h2 id="the-problem">The problem</h2>
<p>One controller validates input, creates the order, sends the email and updates stock. Change one thing here and something breaks over there.</p>
<h2 id="the-action">The fix: one Action per use case</h2>
<pre><code class="language-php">final class PlaceOrderAction
{
    public function __construct(
        private readonly OrderRepository $orders,
        private readonly InventoryService $inventory,
    ) {}

    public function execute(PlaceOrderData $data): Order
    {
        return DB::transaction(function () use ($data) {
            $this->inventory->reserve($data->items);

            return tap($this->orders->create($data), fn (Order $order) =>
                OrderPlaced::dispatch($order)
            );
        });
    }
}</code></pre>
<h2 id="testing">Testing becomes obvious</h2>
<p>The Action is tested in complete isolation from HTTP, and the controller shrinks to a single line.</p>`,
};

export const blogs = [
  {
    id: 1,
    slug: 'laravel-actions-pattern',
    title: t(
      'نمط Actions في Laravel: وداعاً للـ Fat Controllers',
      'The Actions Pattern in Laravel: Goodbye Fat Controllers',
    ),
    excerpt: t(
      'كيف تنظم منطق العمل في كلاسات صغيرة قابلة للاختبار وإعادة الاستخدام.',
      'How to organise business logic into small, testable, reusable classes.',
    ),
    content: actionsArticle,
    cover_image: media('blog/laravel-actions-pattern.webp'),
    category: 'laravel',
    tags: ['laravel', 'architecture', 'solid'],
    reading_time: 6,
    published_at: '2025-10-12',
  },
  {
    id: 2,
    slug: 'clean-architecture-in-practice',
    title: t(
      'المعمارية النظيفة عملياً دون تعقيد زائد',
      'Clean Architecture in Practice, Without the Ceremony',
    ),
    excerpt: t(
      'متى تستحق الطبقات الإضافية تكلفتها، ومتى تكون مبالغة.',
      'When extra layers pay for themselves, and when they are over-engineering.',
    ),
    content: t(
      '<p>المعمارية النظيفة أداة وليست ديناً. السؤال الحقيقي: ما الذي سيتغير في هذا النظام؟</p><h2 id="boundaries">الحدود أولاً</h2><p>ابدأ بفصل الـ domain عن الـ framework، والباقي يأتي لاحقاً.</p>',
      '<p>Clean architecture is a tool, not a religion. The real question: what is going to change in this system?</p><h2 id="boundaries">Boundaries first</h2><p>Start by separating the domain from the framework; the rest can come later.</p>',
    ),
    cover_image: media('blog/clean-architecture-in-practice.webp'),
    category: 'architecture',
    tags: ['architecture', 'clean-code'],
    reading_time: 8,
    published_at: '2025-08-03',
  },
  {
    id: 3,
    slug: 'react-data-layer-that-scales',
    title: t('طبقة بيانات React تتحمل النمو', 'A React Data Layer That Scales'),
    excerpt: t(
      'فصل جلب البيانات عن المكوّنات باستخدام services وTanStack Query.',
      'Decoupling data fetching from components with services and TanStack Query.',
    ),
    content: t(
      '<p>المكوّن الذي يعرف عنوان الـ API يعرف أكثر مما يجب.</p><pre><code class="language-javascript">export const projectsService = {\n  list: (params) =&gt; unwrap(http.get(ENDPOINTS.projects, { params })),\n};</code></pre>',
      '<p>A component that knows the API URL knows too much.</p><pre><code class="language-javascript">export const projectsService = {\n  list: (params) =&gt; unwrap(http.get(ENDPOINTS.projects, { params })),\n};</code></pre>',
    ),
    cover_image: media('blog/react-data-layer-that-scales.webp'),
    category: 'react',
    tags: ['react', 'architecture'],
    reading_time: 5,
    published_at: '2025-05-21',
  },
  {
    id: 4,
    slug: 'queues-that-never-lose-jobs',
    title: t('Queues لا تفقد المهام أبداً', 'Queues That Never Lose a Job'),
    excerpt: t(
      'Idempotency وإعادة المحاولة وأفضل ممارسات Laravel Queues في الإنتاج.',
      'Idempotency, retries and production practices for Laravel queues.',
    ),
    content: t(
      '<p>كل Job يجب أن يكون آمناً عند تنفيذه مرتين.</p>',
      '<p>Every job must be safe to run twice.</p>',
    ),
    cover_image: media('blog/queues-that-never-lose-jobs.webp'),
    category: 'laravel',
    tags: ['laravel', 'queues'],
    reading_time: 7,
    published_at: '2025-02-09',
  },
];
