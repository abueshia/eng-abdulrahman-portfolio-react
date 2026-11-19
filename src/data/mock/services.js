import { t } from './helpers';

// MOCK_UNTIL_API: sample services, served by the mock adapter until the Laravel API
// is connected. Clearly fictional on purpose; never publish as real content.

/** GET /services */
export const services = [
  {
    id: 1,
    slug: 'backend-engineering',
    icon: 'server',
    method: 'POST',
    title: t('هندسة الباك إند', 'Back-end Engineering'),
    description: t(
      'أنظمة Laravel قابلة للتوسع بمعمارية نظيفة وأداء عالٍ.',
      'Scalable Laravel systems built on clean architecture and tuned for performance.',
    ),
    deliverables: t(
      ['معمارية modular', 'Queues وجدولة مهام', 'اختبارات Feature/Unit'],
      ['Modular architecture', 'Queues & scheduled jobs', 'Feature & unit tests'],
    ),
  },
  {
    id: 2,
    slug: 'api-design',
    icon: 'api',
    method: 'GET',
    title: t('تصميم وبناء APIs', 'API Design & Development'),
    description: t(
      'REST APIs موثقة وآمنة ومصممة لتخدم الويب والجوال.',
      'Documented, secure REST APIs designed for web and mobile clients.',
    ),
    deliverables: t(
      ['توثيق OpenAPI', 'مصادقة وصلاحيات', 'إصدارات API'],
      ['OpenAPI documentation', 'Authentication & authorization', 'API versioning'],
    ),
  },
  {
    id: 3,
    slug: 'frontend-development',
    icon: 'layout',
    method: 'PUT',
    title: t('واجهات React', 'React Front-ends'),
    description: t(
      'واجهات سريعة ومتجاوبة ومتاحة للجميع بتجربة مستخدم راقية.',
      'Fast, responsive and accessible interfaces with a refined user experience.',
    ),
    deliverables: t(
      ['مكوّنات قابلة لإعادة الاستخدام', 'أداء Lighthouse عالٍ', 'دعم RTL/LTR'],
      ['Reusable component systems', 'High Lighthouse scores', 'RTL/LTR support'],
    ),
  },
  {
    id: 4,
    slug: 'full-stack-products',
    icon: 'layers',
    method: 'POST',
    title: t('منتجات Full-Stack متكاملة', 'End-to-end Products'),
    description: t(
      'من الفكرة وقاعدة البيانات حتى النشر والمراقبة.',
      'From idea and data model to deployment and monitoring.',
    ),
    deliverables: t(
      ['تحليل المتطلبات', 'MVP سريع', 'نشر وصيانة'],
      ['Requirements analysis', 'Rapid MVP', 'Deployment & maintenance'],
    ),
  },
  {
    id: 5,
    slug: 'code-audit',
    icon: 'search',
    method: 'PATCH',
    title: t('مراجعة الكود وإعادة الهيكلة', 'Code Audit & Refactoring'),
    description: t(
      'تحويل الكود القديم إلى كود نظيف قابل للصيانة دون إيقاف العمل.',
      'Turning legacy code into clean, maintainable code without stopping the business.',
    ),
    deliverables: t(
      ['تقرير مراجعة', 'خطة إعادة هيكلة', 'تحسين الأداء'],
      ['Audit report', 'Refactoring roadmap', 'Performance tuning'],
    ),
  },
  {
    id: 6,
    slug: 'technical-consulting',
    icon: 'compass',
    method: 'OPTIONS',
    title: t('استشارات تقنية', 'Technical Consulting'),
    description: t(
      'اختيار التقنيات والمعمارية المناسبة لمرحلة مشروعك.',
      'Choosing the right stack and architecture for your stage.',
    ),
    deliverables: t(
      ['جلسات معمارية', 'مراجعة القرارات التقنية', 'توجيه الفريق'],
      ['Architecture sessions', 'Technical decision reviews', 'Team mentoring'],
    ),
  },
];
