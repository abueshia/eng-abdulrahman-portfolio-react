import { useTranslation } from 'react-i18next';

import '@/i18n/work';
import { cn } from '@/utils/cn';

/**
 * "Sample" badge for records flagged `is_sample` by the API. It disappears by
 * itself when real projects (without the flag) replace the samples.
 * @param {{ className?: string }} props
 */
export function SampleBadge({ className }) {
  const { t } = useTranslation();
  return (
    <span className={cn('sample-badge', className)} title={t('projects.sampleHint')}>
      <span aria-hidden="true" className="sample-badge__dot" />
      {t('projects.sample')}
      <span className="sr-only">: {t('projects.sampleHint')}</span>
    </span>
  );
}
