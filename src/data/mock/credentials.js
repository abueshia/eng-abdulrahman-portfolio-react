import { media, t } from './helpers';

// TODO_REAL_DATA: sample certificates, issuers, dates and verification URLs; education. Replace with the owner's real records.

/** GET /credentials: education, certifications and courses. Placeholder data. */
export const credentials = [
  {
    id: 1,
    type: 'education',
    title: t('بكالوريوس هندسة البرمجيات', 'B.Sc. in Software Engineering'),
    issuer: t('جامعة (اسم مؤقت)', 'University (placeholder)'),
    issued_at: '2021-06-01',
    credential_url: null,
    image: null,
    description: t(
      'تخصص في هندسة البرمجيات وتصميم الأنظمة وقواعد البيانات.',
      'Focused on software engineering, systems design and databases.',
    ),
  },
  {
    id: 2,
    type: 'certification',
    title: t('Laravel Certified Developer', 'Laravel Certified Developer'),
    issuer: t('Laravel', 'Laravel'),
    issued_at: '2024-04-01',
    credential_url: 'TODO_REAL_DATA',
    image: media('credentials/laravel.webp'),
    description: t(
      'اعتماد رسمي في تطوير تطبيقات Laravel.',
      'Official certification in Laravel application development.',
    ),
  },
  {
    id: 3,
    type: 'certification',
    title: t('Meta Front-End Developer', 'Meta Front-End Developer'),
    issuer: t('Meta · Coursera', 'Meta · Coursera'),
    issued_at: '2023-09-01',
    credential_url: 'TODO_REAL_DATA',
    image: media('credentials/meta.webp'),
    description: t(
      'برنامج احترافي في React وتطوير الواجهات.',
      'Professional program in React and front-end development.',
    ),
  },
  {
    id: 4,
    type: 'course',
    title: t('Clean Architecture & Design Patterns', 'Clean Architecture & Design Patterns'),
    issuer: t('منصة تعليمية', 'Online academy'),
    issued_at: '2023-02-01',
    credential_url: null,
    image: null,
    description: t(
      'المعمارية النظيفة وأنماط التصميم عملياً.',
      'Applied clean architecture and design patterns.',
    ),
  },
];
