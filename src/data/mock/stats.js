import { t } from './helpers';

// MOCK_UNTIL_API: sample headline numbers, served by the mock adapter until the Laravel API
// is connected. Clearly fictional on purpose; never publish as real content.

/** GET /stats: rendered as "system metrics". */
export const stats = [
  // Real (owner-provided). The other figures are zeroed samples until the API.
  { key: 'experience', value: 4, suffix: '+', label: t('سنوات خبرة', 'Years of experience') },
  { key: 'projects', value: 0, suffix: '', label: t('مشروع مُسلَّم', 'Projects shipped') },
  { key: 'clients', value: 0, suffix: '', label: t('عميل سعيد', 'Happy clients') },
  { key: 'endpoints', value: 0, suffix: '', label: t('API endpoint', 'API endpoints built') },
];
