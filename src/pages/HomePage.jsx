import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Seo } from '@/components/ui/Seo';
import { paths } from '@/config/routes';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useLocale } from '@/hooks/useLocale';
import { useSettings } from '@/hooks/useSettings';
import { buildHomeJsonLd } from '@/utils/structured-data';
import { HeroPlaceholder } from './home/HeroPlaceholder';
import { PlaceholderSection } from './home/PlaceholderSection';

/** Section order and the phase in which each real section lands. */
const SECTIONS = [
  { id: 'stats', phase: 3 },
  { id: 'about', phase: 3 },
  { id: 'skills', phase: 3 },
  { id: 'experience', phase: 3 },
  { id: 'projects', phase: 4 },
  { id: 'services', phase: 4 },
  { id: 'credentials', phase: 4 },
  { id: 'testimonials', phase: 5 },
  { id: 'blog', phase: 5 },
  { id: 'faq', phase: 5 },
  { id: 'contact', phase: 5 },
];

/** Temporary data-layer probe rendered inside the projects placeholder. */
function ProjectsProbe() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useProjects();
  if (isPending) return <p className="font-mono text-sm text-ink-dim">{t('common.loading')}</p>;
  if (isError) return <p className="text-danger">{t('common.error')}</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs text-signal">
        {t('sections.itemsLoaded', { count: data.pagination?.total ?? data.data.length })}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.data.map((project) => (
          <li key={project.slug}>
            <LocalizedLink
              to={paths.project(project.slug)}
              className="flex h-full flex-col gap-2 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-ember"
            >
              <span className="font-mono text-xs text-ink-dim">{project.year}</span>
              <span className="font-display text-xl font-semibold text-ink">{project.title}</span>
              <span className="text-sm text-ink-muted">{project.summary}</span>
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Home page: hero followed by every visible section, in order. */
export default function HomePage() {
  const { data } = useSettings();
  const { locale } = useLocale();
  const seo = data?.data?.seo;
  const general = data?.data?.general;
  const jsonLd = useMemo(() => buildHomeJsonLd(general, locale), [general, locale]);

  return (
    <>
      <Seo
        description={seo?.meta_description}
        image={seo?.og_image}
        type="profile"
        jsonLd={jsonLd}
      />
      <HeroPlaceholder />
      {SECTIONS.map(({ id, phase }, i) => (
        <PlaceholderSection key={id} id={id} index={i + 1} phase={phase}>
          {id === 'projects' && <ProjectsProbe />}
        </PlaceholderSection>
      ))}
    </>
  );
}
