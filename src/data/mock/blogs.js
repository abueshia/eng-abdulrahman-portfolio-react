import { media, t } from './helpers';

// MOCK_UNTIL_API: sample articles, served by the mock adapter until the Laravel API is
// connected. Each post is `is_sample: true`: it shows a "Sample" badge, its page is
// `noindex`, it stays out of the sitemap and gets no BlogPosting JSON-LD. General
// technical topics, no claims or invented figures.

/**
 * GET /blogs (paginated), GET /blogs/{slug}, GET /blogs/categories.
 *
 * `content` is HTML as a rich-text editor would produce it on the Laravel side. The
 * front end sanitises it (DOMPurify), gives headings ids (TOC), and highlights
 * `<pre><code class="language-x" data-filename="…">` blocks with Shiki. All of that
 * runs at build time for prerendered pages.
 */
export const blogCategories = [
  { slug: 'payments', name: t('المدفوعات', 'Payments') },
  { slug: 'laravel', name: t('Laravel', 'Laravel') },
  { slug: 'frontend', name: t('الواجهات', 'Front-end') },
];

const idempotency = {
  ar: `<p>بوابات الدفع ترسل الـ webhook أكثر من مرة: عند انتهاء المهلة، أو عند فشل الشبكة، أو لأن الخادم رد ببطء. إن لم يكن الكود جاهزاً لذلك، قد يُفعَّل نفس الاشتراك مرتين أو يُرسل نفس الإيصال مرتين.</p>
<h2>ما معنى Idempotency؟</h2>
<p>العملية <strong>idempotent</strong> إذا كان تنفيذها مرة أو عشر مرات يترك النظام في نفس الحالة. الهدف ليس منع التكرار، فهو سيحدث، بل جعله غير مؤذٍ.</p>
<h2>الخطوة الأولى: تحقق ثم خزّن</h2>
<p>الـ endpoint يتحقق من التوقيع، ويخزن الحدث بمعرّفه الفريد، ويرد فوراً. المعالجة الحقيقية تتم لاحقاً في Job.</p>
<pre><code class="language-php" data-filename="app/Http/Controllers/PaymentWebhookController.php">public function __invoke(Request $request): Response
{
    $event = $this-&gt;gateway-&gt;verify($request); // throws on a bad signature

    WebhookEvent::firstOrCreate(
        ['provider_event_id' =&gt; $event-&gt;id],
        ['type' =&gt; $event-&gt;type, 'payload' =&gt; $event-&gt;payload],
    );

    ProcessWebhookEvent::dispatch($event-&gt;id);

    return response()-&gt;noContent();
}</code></pre>
<h2>قيد فريد في قاعدة البيانات</h2>
<p><code>firstOrCreate</code> وحده لا يكفي عند وصول طلبين في نفس اللحظة. القيد الفريد هو الضمان الأخير:</p>
<pre><code class="language-sql" data-filename="database/webhook_events.sql">CREATE TABLE webhook_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_event_id VARCHAR(191) NOT NULL,
    type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NULL,
    UNIQUE KEY webhook_events_provider_event_id_unique (provider_event_id)
);</code></pre>
<h3>والمعالجة نفسها</h3>
<p>الـ Job يتجاهل الحدث إن كان <code>processed_at</code> مضبوطاً، وينفذ الانتقال داخل transaction. هكذا تصبح إعادة المحاولة آمنة دائماً.</p>
<h2>الخلاصة</h2>
<ul><li>افترض أن كل webhook سيصل أكثر من مرة.</li><li>خزّن قبل أن تعالج، ورد بسرعة.</li><li>اجعل قاعدة البيانات تمنع التكرار، لا الكود وحده.</li></ul>`,
  en: `<p>Payment gateways send the same webhook more than once: on a timeout, on a network failure, or simply because your server answered slowly. If the code isn't ready for it, the same subscription can be activated twice or the same receipt emailed twice.</p>
<h2>What idempotency means</h2>
<p>An operation is <strong>idempotent</strong> when running it once or ten times leaves the system in the same state. The goal is not to prevent duplicates (they will happen) but to make them harmless.</p>
<h2>Step one: verify, then store</h2>
<p>The endpoint verifies the signature, stores the event under its unique id and answers right away. The real work happens later, in a job.</p>
<pre><code class="language-php" data-filename="app/Http/Controllers/PaymentWebhookController.php">public function __invoke(Request $request): Response
{
    $event = $this-&gt;gateway-&gt;verify($request); // throws on a bad signature

    WebhookEvent::firstOrCreate(
        ['provider_event_id' =&gt; $event-&gt;id],
        ['type' =&gt; $event-&gt;type, 'payload' =&gt; $event-&gt;payload],
    );

    ProcessWebhookEvent::dispatch($event-&gt;id);

    return response()-&gt;noContent();
}</code></pre>
<h2>A unique constraint in the database</h2>
<p><code>firstOrCreate</code> alone is not enough when two requests arrive at the same instant. The unique constraint is the final guarantee:</p>
<pre><code class="language-sql" data-filename="database/webhook_events.sql">CREATE TABLE webhook_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider_event_id VARCHAR(191) NOT NULL,
    type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP NULL,
    UNIQUE KEY webhook_events_provider_event_id_unique (provider_event_id)
);</code></pre>
<h3>And the processing itself</h3>
<p>The job skips the event when <code>processed_at</code> is set, and applies the state transition inside a transaction. Retrying becomes safe, always.</p>
<h2>Takeaways</h2>
<ul><li>Assume every webhook will arrive more than once.</li><li>Store before you process, and answer fast.</li><li>Let the database prevent duplicates, not the code alone.</li></ul>`,
};

const queues = {
  ar: `<p>الـ Queue تنقل العمل البطيء خارج الطلب: إرسال البريد، توليد الملفات، استدعاء خدمات خارجية. لكنها تضيف سؤالاً جديداً: ماذا يحدث عندما يفشل الـ Job؟</p>
<h2>اجعل كل Job صغيراً وقابلاً للتكرار</h2>
<p>Job واحد يفعل شيئاً واحداً، ويمكن تشغيله مرتين دون ضرر. مرّر المعرّفات لا الكائنات الكاملة، واقرأ الحالة الحالية عند التنفيذ.</p>
<pre><code class="language-php" data-filename="app/Jobs/SendInvoiceEmail.php">final class SendInvoiceEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public readonly int $invoiceId) {}

    public function backoff(): array
    {
        return [10, 60, 300];
    }

    public function handle(Mailer $mailer): void
    {
        $invoice = Invoice::findOrFail($this-&gt;invoiceId);

        if ($invoice-&gt;emailed_at !== null) {
            return; // already done: a retry is harmless
        }

        $mailer-&gt;to($invoice-&gt;customer)-&gt;send(new InvoiceMail($invoice));
        $invoice-&gt;update(['emailed_at' =&gt; now()]);
    }
}</code></pre>
<h2>إعادة المحاولة بتأخير متزايد</h2>
<p><code>backoff()</code> يمنح الخدمة الخارجية وقتاً لتتعافى بدلاً من إغراقها بمحاولات متتالية. و<code>$tries</code> يحدد متى نتوقف ونعتبر الـ Job فاشلاً.</p>
<h2>المهام الفاشلة ليست نهاية القصة</h2>
<p>الـ Jobs الفاشلة تُحفظ في جدول <code>failed_jobs</code>، ويمكن مراجعتها وإعادة تشغيلها بعد إصلاح السبب:</p>
<pre><code class="language-bash" data-filename="terminal">php artisan queue:failed
php artisan queue:retry all
php artisan queue:work --tries=5 --max-time=3600</code></pre>
<h3>راقب، لا تخمّن</h3>
<p>Horizon يعرض الطوابير والمهام البطيئة والفاشلة لحظياً. إن لم يكن متاحاً، فعلى الأقل سجّل الفشل في مكان يصل إليه الفريق.</p>`,
  en: `<p>A queue moves slow work out of the request: sending email, generating files, calling external services. But it adds a new question: what happens when a job fails?</p>
<h2>Keep every job small and repeatable</h2>
<p>One job does one thing and can run twice without harm. Pass ids, not whole objects, and read the current state when the job runs.</p>
<pre><code class="language-php" data-filename="app/Jobs/SendInvoiceEmail.php">final class SendInvoiceEmail implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    public function __construct(public readonly int $invoiceId) {}

    public function backoff(): array
    {
        return [10, 60, 300];
    }

    public function handle(Mailer $mailer): void
    {
        $invoice = Invoice::findOrFail($this-&gt;invoiceId);

        if ($invoice-&gt;emailed_at !== null) {
            return; // already done: a retry is harmless
        }

        $mailer-&gt;to($invoice-&gt;customer)-&gt;send(new InvoiceMail($invoice));
        $invoice-&gt;update(['emailed_at' =&gt; now()]);
    }
}</code></pre>
<h2>Retry with growing delays</h2>
<p><code>backoff()</code> gives an external service time to recover instead of hammering it with back-to-back attempts, and <code>$tries</code> decides when to stop and mark the job as failed.</p>
<h2>Failed jobs are not the end of the story</h2>
<p>Failed jobs are stored in the <code>failed_jobs</code> table, where they can be inspected and retried once the cause is fixed:</p>
<pre><code class="language-bash" data-filename="terminal">php artisan queue:failed
php artisan queue:retry all
php artisan queue:work --tries=5 --max-time=3600</code></pre>
<h3>Monitor, don't guess</h3>
<p>Horizon shows queues and slow or failed jobs in real time. Without it, at least log failures somewhere the team actually looks.</p>`,
};

const webVitals = {
  ar: `<p>Core Web Vitals ثلاثة مقاييس تصف تجربة المستخدم الحقيقية: سرعة ظهور المحتوى الأكبر (LCP)، وسرعة الاستجابة للتفاعل (INP)، وثبات التخطيط (CLS). في تطبيقات React، معظم المشاكل تأتي من نفس الأماكن.</p>
<h2>LCP: لا تجعل المحتوى ينتظر JavaScript</h2>
<p>إن كان العنصر الأكبر في الصفحة لا يظهر إلا بعد تحميل الحزمة وتشغيلها، فـ LCP رهينة لحجم الـ JS. التوليد المسبق (SSG/SSR) يضع المحتوى في الـ HTML من البداية.</p>
<h2>INP: قسّم العمل الثقيل</h2>
<p>كل ما لا تحتاجه الصفحة فوراً يمكن تحميله لاحقاً، فلا يتنافس مع التفاعل الأول:</p>
<pre><code class="language-jsx" data-filename="src/pages/HomePage.jsx">const Comments = lazy(() =&gt; import('./Comments'));

export default function HomePage() {
  return (
    &lt;&gt;
      &lt;Hero /&gt;
      &lt;Suspense fallback={null}&gt;
        &lt;Comments /&gt;
      &lt;/Suspense&gt;
    &lt;/&gt;
  );
}</code></pre>
<h2>CLS: احجز المكان مسبقاً</h2>
<p>الصور بدون <code>width</code> و<code>height</code>، والخطوط التي تغيّر عرض النص، والمحتوى الذي يُحقن فوق المحتوى الموجود، كلها تحرك الصفحة تحت إصبع المستخدم.</p>
<h3>قِس في الحقل، لا في المختبر فقط</h3>
<p>Lighthouse مفيد للتجربة، لكن الترتيب يعتمد على بيانات المستخدمين الحقيقيين. مكتبة <code>web-vitals</code> ترسل القياسات من المتصفح:</p>
<pre><code class="language-javascript" data-filename="src/vitals.js">import { onCLS, onINP, onLCP } from 'web-vitals';

const send = (metric) =&gt;
  navigator.sendBeacon('/analytics', JSON.stringify(metric));

onCLS(send);
onINP(send);
onLCP(send);</code></pre>
<p>وشكل القياس الذي يصل للخادم:</p>
<pre><code class="language-json" data-filename="payload.json">{
  "name": "INP",
  "rating": "good",
  "navigationType": "navigate"
}</code></pre>`,
  en: `<p>Core Web Vitals are three metrics that describe real user experience: how fast the largest content appears (LCP), how fast the page responds to interaction (INP), and how stable the layout is (CLS). In React apps, most problems come from the same few places.</p>
<h2>LCP: don't make content wait for JavaScript</h2>
<p>If the largest element only appears after the bundle downloads and runs, LCP is hostage to your JS size. Prerendering (SSG/SSR) puts the content in the HTML from the start.</p>
<h2>INP: split the heavy work</h2>
<p>Anything the page doesn't need right away can load later, so it never competes with the first interaction:</p>
<pre><code class="language-jsx" data-filename="src/pages/HomePage.jsx">const Comments = lazy(() =&gt; import('./Comments'));

export default function HomePage() {
  return (
    &lt;&gt;
      &lt;Hero /&gt;
      &lt;Suspense fallback={null}&gt;
        &lt;Comments /&gt;
      &lt;/Suspense&gt;
    &lt;/&gt;
  );
}</code></pre>
<h2>CLS: reserve the space up front</h2>
<p>Images without <code>width</code> and <code>height</code>, fonts that change text width, and content injected above existing content all move the page under the user's finger.</p>
<h3>Measure in the field, not only in the lab</h3>
<p>Lighthouse is great for experiments, but rankings use real-user data. The <code>web-vitals</code> library reports measurements from the browser:</p>
<pre><code class="language-javascript" data-filename="src/vitals.js">import { onCLS, onINP, onLCP } from 'web-vitals';

const send = (metric) =&gt;
  navigator.sendBeacon('/analytics', JSON.stringify(metric));

onCLS(send);
onINP(send);
onLCP(send);</code></pre>
<p>And the shape of what reaches the server:</p>
<pre><code class="language-json" data-filename="payload.json">{
  "name": "INP",
  "rating": "good",
  "navigationType": "navigate"
}</code></pre>`,
};

export const blogs = [
  {
    id: 1,
    slug: 'sample-idempotent-payment-webhooks',
    is_sample: true,
    title: t(
      'Idempotency في webhooks الدفع: عندما يصل نفس الحدث مرتين',
      'Idempotent Payment Webhooks: When the Same Event Arrives Twice',
    ),
    excerpt: t(
      'لماذا تكرر بوابات الدفع الـ webhooks، وكيف تجعل التكرار غير مؤذٍ بالتحقق والتخزين والقيد الفريد.',
      'Why payment gateways repeat webhooks, and how verification, storage and a unique constraint make duplicates harmless.',
    ),
    content: idempotency,
    cover_image: media('blog/sample-idempotent-payment-webhooks.svg'),
    cover_alt: t(
      'رسم: حدثان متطابقان يندمجان في سجل واحد',
      'Illustration: two identical events merging into one record',
    ),
    category: 'payments',
    tags: ['payments', 'webhooks', 'laravel'],
    reading_time: 5,
    published_at: '2025-11-02',
    updated_at: '2025-11-02',
  },
  {
    id: 2,
    slug: 'sample-laravel-queues-that-recover',
    is_sample: true,
    title: t('Laravel Queues تتعافى من الفشل', 'Laravel Queues That Recover From Failure'),
    excerpt: t(
      'Jobs صغيرة قابلة للتكرار، وإعادة محاولة بتأخير متزايد، وماذا تفعل بالمهام الفاشلة.',
      'Small repeatable jobs, retries with growing delays, and what to do with the jobs that still fail.',
    ),
    content: queues,
    cover_image: media('blog/sample-laravel-queues-that-recover.svg'),
    cover_alt: t('رسم: طابور مهام وإعادة محاولة', 'Illustration: a job queue with a retry loop'),
    category: 'laravel',
    tags: ['laravel', 'queues'],
    reading_time: 6,
    published_at: '2025-09-14',
    updated_at: '2025-09-14',
  },
  {
    id: 3,
    slug: 'sample-core-web-vitals-react',
    is_sample: true,
    title: t('Core Web Vitals في تطبيقات React', 'Core Web Vitals for React Apps'),
    excerpt: t(
      'من أين تأتي مشاكل LCP وINP وCLS في React، وكيف تعالجها وتقيسها عند المستخدمين الحقيقيين.',
      'Where LCP, INP and CLS problems come from in React, how to fix them, and how to measure them for real users.',
    ),
    content: webVitals,
    cover_image: media('blog/sample-core-web-vitals-react.svg'),
    cover_alt: t('رسم: ثلاثة مؤشرات أداء', 'Illustration: three performance gauges'),
    category: 'frontend',
    tags: ['react', 'performance', 'seo'],
    reading_time: 5,
    published_at: '2025-07-20',
    updated_at: '2025-07-20',
  },
];
