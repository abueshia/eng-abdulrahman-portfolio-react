import { t } from './helpers';

// TODO_REAL_DATA: sample testimonials (names, roles, companies, quotes). Replace with the owner's real records.

/** GET /testimonials: placeholder quotes, to be replaced with real ones. */
export const testimonials = [
  {
    id: 1,
    name: t('أحمد ك.', 'Ahmad K.'),
    role: t('مدير تقني', 'CTO'),
    company: t('شركة تجزئة', 'Retail company'),
    avatar: null,
    rating: 5,
    quote: t(
      'عبدالرحمن لا يكتب كوداً فقط، بل يبني أنظمة. المعمارية التي وضعها ما زالت تتحمل نمونا بعد عام كامل.',
      "Abdulrahman doesn't just write code, he builds systems. The architecture he designed still carries our growth a year later.",
    ),
  },
  {
    id: 2,
    name: t('سارة م.', 'Sarah M.'),
    role: t('مديرة منتج', 'Product Manager'),
    company: t('شركة SaaS', 'SaaS startup'),
    avatar: null,
    rating: 5,
    quote: t(
      'تواصل واضح، تقديرات دقيقة، وتسليم في الموعد. لوحة التحكم التي بناها غيّرت طريقة عملنا.',
      'Clear communication, accurate estimates, on-time delivery. The dashboard he built changed how we work.',
    ),
  },
  {
    id: 3,
    name: t('محمد ع.', 'Mohammed A.'),
    role: t('مؤسس', 'Founder'),
    company: t('شركة لوجستيات', 'Logistics company'),
    avatar: null,
    rating: 5,
    quote: t(
      'الـ API الذي بناه موثق بشكل ممتاز، وفريق الجوال بدأ العمل عليه من اليوم الأول دون أسئلة.',
      'His API was so well documented that our mobile team started integrating on day one with zero questions.',
    ),
  },
  {
    id: 4,
    name: t('ليلى ح.', 'Layla H.'),
    role: t('قائدة فريق', 'Engineering Lead'),
    company: t('وكالة رقمية', 'Digital agency'),
    avatar: null,
    rating: 5,
    quote: t(
      'مراجعاته للكود رفعت مستوى الفريق بالكامل. دقيق ومتعاون ويهتم بالتفاصيل.',
      'His code reviews raised the bar for the whole team. Precise, collaborative and detail-obsessed.',
    ),
  },
];
