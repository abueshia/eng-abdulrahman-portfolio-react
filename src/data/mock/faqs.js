import { t } from './helpers';

// MOCK_UNTIL_API: sample FAQs, served by the mock adapter until the Laravel API
// is connected. Clearly fictional on purpose; never publish as real content.

/** GET /faqs */
export const faqs = [
  {
    id: 1,
    question: t('كم يستغرق بناء مشروع عادةً؟', 'How long does a typical project take?'),
    answer: t(
      'يعتمد على الحجم: MVP بسيط من 3 إلى 6 أسابيع، والأنظمة الأكبر من 3 إلى 6 أشهر. أقدّم خطة زمنية واضحة بعد تحليل المتطلبات.',
      'It depends on scope: a lean MVP takes 3-6 weeks, larger systems 3-6 months. You get a clear timeline after requirements analysis.',
    ),
  },
  {
    id: 2,
    question: t('هل تعمل مع فرق قائمة؟', 'Do you work with existing teams?'),
    answer: t(
      'نعم، أندمج مع الفرق القائمة عبر Git workflow ومراجعات الكود، أو أعمل بشكل مستقل بالكامل.',
      'Yes. I plug into existing teams through your Git workflow and code reviews, or work fully independently.',
    ),
  },
  {
    id: 3,
    question: t('ما التقنيات التي تفضلها؟', 'Which stack do you prefer?'),
    answer: t(
      'Laravel للباك إند وReact للواجهات، لكن الاختيار النهائي يعتمد على احتياجات المشروع وفريقك.',
      "Laravel on the back end and React on the front end, but the final choice depends on your project's and team's needs.",
    ),
  },
  {
    id: 4,
    question: t('هل تقدم صيانة بعد التسليم؟', 'Do you offer post-launch maintenance?'),
    answer: t(
      'نعم، أقدّم باقات صيانة ودعم شهرية تشمل التحديثات الأمنية ومراقبة الأداء.',
      'Yes, monthly maintenance plans covering security updates and performance monitoring.',
    ),
  },
  {
    id: 5,
    question: t('كيف تضمن جودة الكود؟', 'How do you ensure code quality?'),
    answer: t(
      'اختبارات آلية، ومراجعة كود، ومعايير PSR، وCI يمنع دمج أي كود لا يجتاز الفحوصات.',
      'Automated tests, code review, PSR standards and CI that blocks any merge failing the checks.',
    ),
  },
  {
    id: 6,
    question: t('كيف نبدأ؟', 'How do we start?'),
    answer: t(
      'أرسل لي تفاصيل فكرتك عبر نموذج التواصل، ونحدد مكالمة قصيرة لفهم الأهداف واقتراح الحل.',
      'Send me your idea through the contact form, and we schedule a short call to understand goals and propose a solution.',
    ),
  },
];
