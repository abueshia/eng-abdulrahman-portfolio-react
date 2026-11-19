import { useTranslation } from 'react-i18next';
import { LuArrowLeft } from 'react-icons/lu';
import { useParams } from 'react-router-dom';

import { ErrorState } from '@/components/ui/ErrorState';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Seo } from '@/components/ui/Seo';
import { paths } from '@/config/routes';
import { useProject } from '@/features/projects/hooks/useProjects';
import NotFoundPage from './NotFoundPage';

/**
 * Case study page (foundation version: data wiring + layout skeleton).
 * The cinematic case-study experience lands in phase 4.
 */
export default function ProjectDetailsPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useProject(slug);

  if (isError && error?.isNotFound) return <NotFoundPage />;
  const project = data?.data;

  return (
    <article className="container-fluid flex flex-col gap-10 pt-[calc(var(--nav-height)+4rem)] pb-24">
      <Seo
        title={project?.title}
        description={project?.summary}
        image={project?.cover_image}
        type="article"
      />
      <LocalizedLink
        to={paths.projects()}
        className="inline-flex items-center gap-2 self-start font-mono text-xs text-ink-muted transition-colors hover:text-ink"
      >
        <LuArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        {t('project.backToWork')}
      </LocalizedLink>

      {isPending && <p className="font-mono text-sm text-ink-dim">{t('common.loading')}</p>}
      {isError && <ErrorState onRetry={refetch} />}

      {project && (
        <header className="flex max-w-4xl flex-col gap-6">
          <p className="font-mono text-xs text-ember" dir="ltr">
            /projects/{project.slug}
          </p>
          <h1 className="font-display text-display-lg font-bold tracking-tight text-balance">
            {project.title}
          </h1>
          <p className="text-xl text-pretty text-ink-muted">{project.summary}</p>
          <ul className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <li
                key={tech.slug}
                className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-muted"
              >
                {tech.name}
              </li>
            ))}
          </ul>
        </header>
      )}
    </article>
  );
}
