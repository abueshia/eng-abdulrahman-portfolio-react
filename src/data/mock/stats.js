import { t } from './helpers';

// TODO_REAL_DATA: sample headline numbers. Replace with the owner's real records.

/** GET /stats: rendered as "system metrics". */
export const stats = [
  { key: 'experience', value: 4, suffix: '+', label: t('سنوات خبرة', 'Years of experience') },
  { key: 'projects', value: 30, suffix: '+', label: t('مشروع مُسلَّم', 'Projects shipped') },
  { key: 'clients', value: 20, suffix: '+', label: t('عميل سعيد', 'Happy clients') },
  { key: 'endpoints', value: 500, suffix: '+', label: t('API endpoint', 'API endpoints built') },
];
