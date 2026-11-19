import { t } from './helpers';

// MOCK_UNTIL_API: sample work history, served by the mock adapter until the Laravel API
// is connected. Clearly fictional on purpose; never publish as real content.

/** GET /experiences: newest first. Placeholder companies and dates. */
export const experiences = [
  {
    id: 1,
    company: t('شركة نموذجية (أ)', 'Sample Company A'),
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
        'قدت إعادة هيكلة monolith إلى modules مستقلة لتحسين زمن الاستجابة.',
        'أسست pipeline للاختبارات والنشر المستمر عبر GitHub Actions.',
        'أشرفت على مراجعة الكود وتوجيه مطورين جدد.',
      ],
      [
        'Led the refactor of a monolith into independent modules, improving response times.',
        'Set up a test and continuous-delivery pipeline with GitHub Actions.',
        'Owned code reviews and mentored junior developers.',
      ],
    ),
    technologies: ['laravel', 'react', 'mysql', 'redis', 'docker'],
  },
  {
    id: 2,
    company: t('شركة نموذجية (ب)', 'Sample Company B'),
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
      ['سلّمت مشاريع من الفكرة حتى الإنتاج.', 'صممت مكتبة مكوّنات React داخلية سرّعت وقت التطوير.'],
      [
        'Shipped projects from concept to production.',
        'Designed an internal React component library that sped up delivery.',
      ],
    ),
    technologies: ['laravel', 'php', 'react', 'tailwind', 'mysql'],
  },
  {
    id: 3,
    company: t('عمل حر (نموذج)', 'Freelance (sample)'),
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
      ['حافظت على رضا العملاء.', 'بنيت أنظمة ما زالت تعمل في الإنتاج منذ سنوات.'],
      ['Kept clients satisfied.', 'Built systems that have been running in production for years.'],
    ),
    technologies: ['laravel', 'livewire', 'javascript', 'mysql'],
  },
  {
    id: 4,
    company: t('شركة نموذجية (ج)', 'Sample Company C'),
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
      ['طورت endpoints لتطبيق جوال.', 'كتبت أول مجموعة اختبارات للمشروع.'],
      ['Built endpoints for a mobile app.', "Wrote the project's first test suite."],
    ),
    technologies: ['php', 'laravel', 'mysql', 'git'],
  },
];
