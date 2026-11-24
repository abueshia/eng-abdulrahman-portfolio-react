import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import '@/i18n/work';
import { ErrorState } from '@/components/ui/ErrorState';
import { Seo } from '@/components/ui/Seo';
import { CaseStudy } from '@/features/projects/components/CaseStudy';
import { useProject, useProjects } from '@/features/projects/hooks/useProjects';
import { useLocale } from '@/hooks/useLocale';
import { buildProjectJsonLd } from '@/utils/structured-data';
import NotFoundPage from './NotFoundPage';

/** Open Graph needs a raster image; an SVG cover falls back to the default image. */
const isRaster = (/** @type {string | undefined} */ src) =>
  Boolean(src && /\.(jpe?g|png|webp)(\?.*)?$/i.test(src));

/**
 * Case study page (`/projects/:slug`).
 *
 * SEO: one `<Seo>` with the project's title, summary and cover, plus
 * CreativeWork (SoftwareSourceCode when the repository is public) and
 * BreadcrumbList JSON-LD. Every project comes from the API and is real work:
 * indexable, and listed in the sitemap with its `completed_at` as lastmod.
 */
export default function ProjectDetailsPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data, isPending, isError, error, refetch } = useProject(slug);
  const { data: list } = useProjects();
  const project = data?.data;

  const next = useMemo(() => {
    const items = list?.data ?? [];
    const index = items.findIndex((item) => item.slug === slug);
    return index === -1 ? items[0] : items[(index + 1) % items.length];
  }, [list, slug]);

  const homeLabel = t('caseStudy.home');
  const workLabel = t('caseStudy.work');
  const jsonLd = useMemo(
    () => buildProjectJsonLd(project, locale, { home: homeLabel, work: workLabel }),
    [project, locale, homeLabel, workLabel],
  );

  if (isError && error?.isNotFound) return <NotFoundPage />;

  return (
    <>
      <Seo
        title={project?.title}
        description={project?.summary}
        image={isRaster(project?.cover_image ?? undefined) ? project?.cover_image : undefined}
        type="article"
        jsonLd={jsonLd}
      />
      {isPending && (
        <p className="container-fluid pt-[calc(var(--nav-height)+4rem)] font-mono text-sm text-ink-dim">
          {t('common.loading')}
        </p>
      )}
      {isError && (
        <div className="container-fluid pt-[calc(var(--nav-height)+4rem)]">
          <ErrorState onRetry={refetch} />
        </div>
      )}
      {project && <CaseStudy project={project} next={next} />}
    </>
  );
}
