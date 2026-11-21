import { t } from './helpers';

// MOCK_UNTIL_API: sample testimonials, served by the mock adapter until the Laravel API
// is connected. Every record is a sample (is_sample flag): no names, photos, logos or
// figures, only a sample role, a simple descriptive rating and the review text. The UI
// shows a "Sample" badge on the section and on every card, and no Review /
// AggregateRating JSON-LD is ever emitted. `npm run data:todo` blocks publishing while
// the visible section serves samples.

/**
 * GET /testimonials. Rendered as pull-request reviews.
 *  - `role`: who reviewed (here: a sample role, no name).
 *  - `quote`: the review body.
 *  - `rating`: 1..5, shown as stars on the card (never as structured data).
 *  - `status`: `approved` | `pending` | `rejected`. `GET /testimonials` lists approved
 *    records only; visitor submissions (`POST /testimonials`) start as `pending`.
 *  - `avatar`: optional photo URL; without it the card shows a generated monogram.
 *  - `name`, `company`, `scope`, `checks`: optional; real records may add them.
 *  - `is_sample`: placeholder flag; real testimonials omit it or send `false`.
 */
export const testimonials = [
  {
    id: 1,
    is_sample: true,
    status: 'approved',
    rating: 5,
    name: null,
    role: t('عميل نموذجي، مؤسس منتج رقمي', 'Sample client, digital product founder'),
    company: null,
    avatar: null,
    quote: t(
      'كان واضحاً من أول نقاش إنه فاهم المشكلة قبل الحل. الـ API اتسلّم منظّم وموثّق، وسهّل على فريقنا الشغل عليه بعد كده.',
      'He understood the problem before proposing the solution. The API came organised and documented, which made it easy for our team to build on afterwards.',
    ),
  },
  {
    id: 2,
    is_sample: true,
    status: 'approved',
    rating: 5,
    name: null,
    role: t('عميل نموذجي، صاحب متجر إلكتروني', 'Sample client, online store owner'),
    company: null,
    avatar: null,
    quote: t(
      'التواصل كان منتظم وصريح طول المشروع، وأي تعديل كنا بنتفق عليه الأول. حسّيت إني شريك في القرار مش مجرد عميل.',
      'Communication stayed regular and honest throughout. Every change was agreed first, and I felt like a partner in the decisions, not just a client.',
    ),
  },
  {
    id: 3,
    is_sample: true,
    status: 'approved',
    rating: 4,
    name: null,
    role: t('عميل نموذجي، مدير عمليات', 'Sample client, operations manager'),
    company: null,
    avatar: null,
    quote: t(
      'لوحة التحكم اللي اتبنت بسيطة ومريحة للفريق، والصلاحيات متظبطة صح. وفّرت علينا وقت كبير في الشغل اليومي.',
      'The dashboard he built is simple and comfortable for the team, with permissions set up correctly. It saved us real time in daily work.',
    ),
  },
  {
    id: 4,
    is_sample: true,
    status: 'approved',
    rating: 5,
    name: null,
    role: t('عميل نموذجي، قائد تقني', 'Sample client, technical lead'),
    company: null,
    avatar: null,
    quote: t(
      'الكود نضيف ومترتب، وبعد التسليم قدر أي مطوّر يكمل عليه من غير ما يبدأ من الصفر. ده فرق كبير عندنا.',
      'The code is clean and well organised, and after handover any developer could continue from it without starting over. That matters a lot to us.',
    ),
  },
];
