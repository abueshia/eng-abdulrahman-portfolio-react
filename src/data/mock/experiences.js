import { t } from './helpers';

// TODO_REAL_DATA: sample companies, roles, dates and achievements. Replace with the owner's real records.

/** GET /experiences: newest first. Placeholder companies and dates. */
export const experiences = [
  {
    id: 1,
    company: t('شركة تقنية (اسم مؤقت)', 'Tech Company (placeholder)'),
    role: t('مهندس برمجيات Full-Stack أول', 'Senior Full-Stack Software Engineer'),
    employment_type: 'full_time',
    location: t('عن بُعد', 'Remote'),
    start_date: '2024-03-01',
    end_date: null,
    is_current: true,
    summary: t(
      'أقود تطوير منصات Laravel/React وأضع المعايير المعمارية للفريق.',
      'Leading Laravel/React platform development and setting architectural standards for the team.',
    ),
    achievements: t(
      [
        'قدت إعادة هيكلة monolith إلى modules مستقلة وخفضت زمن الاستجابة 60%.',
        'أسست pipeline للاختبارات والنشر المستمر عبر GitHub Actions.',
        'أشرفت على مراجعة الكود وتوجيه مطورين جدد.',
      ],
      [
        'Led the refactor of a monolith into independent modules, cutting response times by 60%.',
        'Set up a test and continuous-delivery pipeline with GitHub Actions.',
        'Owned code reviews and mentored junior developers.',
      ],
    ),
    technologies: ['laravel', 'react', 'mysql', 'redis', 'docker'],
  },
  {
    id: 2,
    company: t('وكالة رقمية (اسم مؤقت)', 'Digital Agency (placeholder)'),
    role: t('مهندس برمجيات Full-Stack', 'Full-Stack Software Engineer'),
    employment_type: 'full_time',
    location: t('هجين', 'Hybrid'),
    start_date: '2022-06-01',
    end_date: '2024-02-28',
    is_current: false,
    summary: t(
      'بنيت تطبيقات ويب وواجهات API لعملاء في قطاعات متعددة.',
      'Built web applications and APIs for clients across multiple industries.',
    ),
    achievements: t(
      [
        'سلّمت أكثر من 12 مشروعاً من الفكرة حتى الإنتاج.',
        'صممت مكتبة مكوّنات React داخلية قلّصت وقت التطوير 30%.',
      ],
      [
        'Shipped 12+ projects from concept to production.',
        'Designed an internal React component library that cut build time by 30%.',
      ],
    ),
    technologies: ['laravel', 'php', 'react', 'tailwind', 'mysql'],
  },
  {
    id: 3,
    company: t('عمل حر', 'Freelance'),
    role: t('مطوّر Full-Stack مستقل', 'Independent Full-Stack Developer'),
    employment_type: 'freelance',
    location: t('عن بُعد', 'Remote'),
    start_date: '2021-09-01',
    end_date: null,
    is_current: true,
    summary: t(
      'مشاريع مختارة لعملاء مباشرين: APIs ولوحات تحكم ومتاجر.',
      'Selected projects for direct clients: APIs, dashboards and stores.',
    ),
    achievements: t(
      ['حافظت على تقييم 5/5 من العملاء.', 'بنيت أنظمة ما زالت تعمل في الإنتاج منذ سنوات.'],
      [
        'Maintained a 5/5 client rating.',
        'Built systems that have been running in production for years.',
      ],
    ),
    technologies: ['laravel', 'livewire', 'javascript', 'mysql'],
  },
  {
    id: 4,
    company: t('شركة برمجيات ناشئة (اسم مؤقت)', 'Software Startup (placeholder)'),
    role: t('مطوّر باك إند مبتدئ', 'Junior Back-end Developer'),
    employment_type: 'full_time',
    location: t('من المكتب', 'On-site'),
    start_date: '2021-01-01',
    end_date: '2022-05-31',
    is_current: false,
    summary: t(
      'بداية الرحلة: PHP وLaravel وتصميم قواعد البيانات.',
      'Where it started: PHP, Laravel and database design.',
    ),
    achievements: t(
      ['طورت endpoints لتطبيق جوال يخدم آلاف المستخدمين.', 'كتبت أول مجموعة اختبارات للمشروع.'],
      [
        'Built endpoints for a mobile app serving thousands of users.',
        "Wrote the project's first test suite.",
      ],
    ),
    technologies: ['php', 'laravel', 'mysql', 'git'],
  },
];
