import { t } from './helpers';

// MOCK_UNTIL_API: sample testimonials, served by the mock adapter until the Laravel API
// is connected. Every record is `is_sample: true`: no real people or companies, and the
// wording says it is a sample, so nothing can be read as a real endorsement. The UI shows
// a "Sample" badge and no Review JSON-LD is emitted. `npm run data:todo` blocks
// publishing while a visible section still serves samples.

/**
 * GET /testimonials. Rendered as pull-request reviews:
 *  - `name`, `role`, `company`: who reviewed (here: placeholders).
 *  - `quote`: the review body.
 *  - `scope`: what was reviewed (a short area label, e.g. "API handover").
 *  - `checks`: the aspects the review approves, shown as passed CI checks.
 *  - `is_sample`: placeholder flag; real testimonials omit it or send `false`.
 */
export const testimonials = [
  {
    id: 1,
    is_sample: true,
    name: t('عميل نموذجي أ', 'Sample client A'),
    role: t('دور نموذجي: مدير تقني', 'Sample role: CTO'),
    company: t('شركة نموذجية', 'Sample company'),
    avatar: null,
    scope: t('تسليم الـ API', 'API handover'),
    quote: t(
      'نص نموذجي: هنا تظهر توصية عميل حقيقي عن تسليم API موثّق وسهل الربط. هذا المكان محجوز للتوصية الحقيقية.',
      'Sample text: a real client’s words about a documented, easy-to-integrate API handover will appear here. This slot is reserved for a real review.',
    ),
    checks: t(['التوثيق', 'الاختبارات', 'التسليم'], ['docs', 'tests', 'handover']),
  },
  {
    id: 2,
    is_sample: true,
    name: t('عميل نموذجي ب', 'Sample client B'),
    role: t('دور نموذجي: مدير منتج', 'Sample role: Product manager'),
    company: t('شركة نموذجية', 'Sample company'),
    avatar: null,
    scope: t('لوحة التحكم', 'Admin dashboard'),
    quote: t(
      'نص نموذجي: مكان توصية حقيقية عن التواصل أثناء بناء لوحة تحكم ووضوح مراحل العمل. سيُستبدل بكلام عميل فعلي.',
      'Sample text: the place for a real review about communication while building a dashboard and how clear the stages were. It will be replaced by an actual client’s words.',
    ),
    checks: t(['التواصل', 'الواجهة', 'الصلاحيات'], ['communication', 'ui', 'permissions']),
  },
  {
    id: 3,
    is_sample: true,
    name: t('عميل نموذجي ج', 'Sample client C'),
    role: t('دور نموذجي: مؤسس', 'Sample role: Founder'),
    company: t('شركة نموذجية', 'Sample company'),
    avatar: null,
    scope: t('التكامل مع الدفع', 'Payment integration'),
    quote: t(
      'نص نموذجي: هنا توصية حقيقية عن تكامل بوابة دفع والتعامل مع الـ webhooks. لا يمثل هذا النص رأي أي شخص.',
      'Sample text: a real review about a payment-gateway integration and webhook handling goes here. This text does not represent anyone’s opinion.',
    ),
    checks: t(['الأمان', 'Webhooks', 'الاسترجاع'], ['security', 'webhooks', 'refunds']),
  },
  {
    id: 4,
    is_sample: true,
    name: t('عميل نموذجي د', 'Sample client D'),
    role: t('دور نموذجي: قائد فريق', 'Sample role: Engineering lead'),
    company: t('شركة نموذجية', 'Sample company'),
    avatar: null,
    scope: t('مراجعة الكود', 'Code review'),
    quote: t(
      'نص نموذجي: مكان محجوز لتوصية فريق عمل عن مراجعات الكود وتحديث نظام قديم. سيظهر هنا كلام حقيقي فقط.',
      'Sample text: a slot reserved for a team’s review about code reviews and modernising a legacy system. Only real words will appear here.',
    ),
    checks: t(['الجودة', 'إعادة الهيكلة', 'الأداء'], ['quality', 'refactoring', 'performance']),
  },
];
