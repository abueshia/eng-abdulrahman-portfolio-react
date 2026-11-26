import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/work';
import { Seo } from '@/components/ui/Seo';
import ProjectsSection from '@/features/projects/components/ProjectsSection';
import { useLocale } from '@/hooks/useLocale';
import { buildProjectsJsonLd } from '@/utils/structured-data';

/**
 * Every case file (`/projects`, `/en/projects`): the full list with the
 * type/stack filters. The home page shows three of them and links here.
 */
export default function ProjectsPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const homeLabel = t('caseStudy.home');
  const workLabel = t('caseStudy.work');
  const jsonLd = useMemo(
    () => buildProjectsJsonLd(locale, { home: homeLabel, work: workLabel }),
    [locale, homeLabel, workLabel],
  );

  return (
    <div className="pt-[var(--nav-height)]">
      <Seo
        title={t('projects.pageTitle')}
        description={t('projects.pageDescription')}
        jsonLd={jsonLd}
      />
      <ProjectsSection variant="index" />
    </div>
  );
}
