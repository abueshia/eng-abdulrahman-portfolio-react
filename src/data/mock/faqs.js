import { t } from './helpers';

// MOCK_UNTIL_API: the owner's FAQ, served by the mock adapter until the Laravel API is
// connected. General and honest on purpose: no prices, no fixed timelines, no ranking
// promises. Edit freely; the API will return the same fields.

/** GET /faqs */
export const faqs = [
  {
    id: 1,
    question: t('كيف تعمل عادةً؟', 'How do you usually work?'),
    answer: t(
      'أبدأ بفهم المشكلة والهدف قبل أي كود، ثم أقترح حلاً تقنياً واضحاً ونتفق على النطاق. أثناء التنفيذ أشارك التقدم على مراحل قصيرة حتى ترى العمل يتشكل وتقدر تعدّل الاتجاه مبكراً.',
      'I start by understanding the problem and the goal before any code, then propose a clear technical solution and we agree on the scope. During the build I share progress in short iterations, so you see the work take shape and can adjust direction early.',
    ),
  },
  {
    id: 2,
    question: t('ما مراحل المشروع؟', 'What are the stages of a project?'),
    answer: t(
      'تحليل المتطلبات، ثم تصميم المعمارية ونموذج البيانات، ثم التنفيذ على مراحل مع اختبارات، ثم مراجعة وتجربة معك، ثم الإطلاق والمتابعة. مدة كل مرحلة تتحدد بعد فهم النطاق، لا قبله.',
      'Requirements analysis, then architecture and data-model design, then iterative development with tests, then review and acceptance with you, then launch and follow-up. How long each stage takes is set once the scope is understood, not before.',
    ),
  },
  {
    id: 3,
    question: t('ماذا يشمل التسليم والصيانة؟', 'What do delivery and maintenance include?'),
    answer: t(
      'تستلم الكود في مستودعك مع توثيق للتشغيل والنشر، ونمر معاً على النظام. بعد الإطلاق يمكن الاتفاق على صيانة ودعم: إصلاحات، تحديثات أمنية، ومتابعة الأداء، حسب ما يحتاجه مشروعك.',
      'You receive the code in your repository with documentation for running and deploying it, and we walk through the system together. After launch we can agree on maintenance and support: fixes, security updates and performance monitoring, depending on what your project needs.',
    ),
  },
  {
    id: 4,
    question: t('ما نوع الخدمات التي تقدمها؟', 'What kind of services do you offer?'),
    answer: t(
      'باك إند وAPIs بـ Laravel، تكاملات الدفع والخدمات الخارجية، منصات SaaS ولوحات تحكم، واجهات React، السيو التقني وGEO، وDevOps واستشارات. القائمة الكاملة في قسم الخدمات أعلاه.',
      'Laravel back ends and APIs, payment and third-party integrations, SaaS platforms and dashboards, React front ends, technical SEO and GEO, DevOps and consulting. The full list is in the services section above.',
    ),
  },
  {
    id: 5,
    question: t('كيف نتواصل أثناء المشروع؟', 'How do we communicate during a project?'),
    answer: t(
      'عبر القناة الأنسب لك: البريد أو واتساب أو مكالمات دورية، مع تحديثات مكتوبة عند كل مرحلة. أفضّل أن تكون القرارات مكتوبة حتى يبقى الجميع على نفس الصفحة.',
      'Through whichever channel suits you: email, WhatsApp or regular calls, with written updates at every stage. I prefer decisions to be written down so everyone stays on the same page.',
    ),
  },
  {
    id: 6,
    question: t('كيف يتم الدفع؟', 'How does payment work?'),
    answer: t(
      'بشكل عام يُقسَّم الدفع على مراحل مرتبطة بالتسليمات المتفق عليها، وتُحدَّد التفاصيل في عرض مكتوب لكل مشروع بعد فهم النطاق. لا توجد أسعار ثابتة لأن كل مشروع مختلف.',
      'In general, payment is split into stages tied to agreed deliverables, and the details are set in a written proposal for each project once the scope is clear. There are no fixed prices because every project is different.',
    ),
  },
  {
    id: 7,
    question: t('هل تضمن الصدارة في نتائج البحث؟', 'Do you guarantee top search rankings?'),
    answer: t(
      'لا، ولا أحد يستطيع ذلك بصدق. ما أقدمه في السيو التقني هو أساس سليم: صفحات قابلة للزحف والفهرسة، بيانات منظمة، سرعة جيدة، وhreflang صحيح. الترتيب نفسه تقرره محركات البحث ويعتمد على المحتوى والمنافسة.',
      'No, and nobody can honestly promise that. What I deliver in technical SEO is a sound foundation: crawlable, indexable pages, structured data, good speed and correct hreflang. Rankings themselves are decided by search engines and depend on content and competition.',
    ),
  },
  {
    id: 8,
    question: t('وما هو GEO؟', 'And what is GEO?'),
    answer: t(
      'GEO (Generative Engine Optimization) هو تجهيز موقعك ومحتواك ليُفهم ويُقتبس بدقة في إجابات محركات الذكاء الاصطناعي: كيانات واضحة، بيانات منظمة، محتوى بصيغة إجابات، وملف llms.txt. يحسّن فرص الظهور، لكنه لا يضمنه.',
      'GEO (Generative Engine Optimization) means preparing your site and content to be understood and quoted accurately in AI-generated answers: clear entities, structured data, answer-shaped content and an llms.txt file. It improves the chances of appearing; it does not guarantee them.',
    ),
  },
];
