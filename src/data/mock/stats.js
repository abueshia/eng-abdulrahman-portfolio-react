import { t } from './helpers';

// MOCK_UNTIL_API: sample headline numbers, served by the mock adapter until the Laravel API
// is connected. Clearly fictional on purpose; never publish as real content.

/** GET /stats: rendered as "system metrics". */
export const stats = [
  { key: 'experience', value: 4, suffix: '+', label: t('سنوات خبرة', 'Years of experience') },
  { key: 'projects', value: 52, suffix: '+', label: t('مشروع مُسلَّم', 'Projects shipped') },
  { key: 'clients', value: 36, suffix: '+', label: t('عميل سعيد', 'Happy clients') },
  { key: 'endpoints', value: 99.9, suffix: '%', label: t('التزام بمعايير Clean Code & SOLID', 'Clean Architecture & SOLID Compliance') },
];
