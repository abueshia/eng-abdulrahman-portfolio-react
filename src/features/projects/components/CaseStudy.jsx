import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowUpRight } from 'react-icons/lu';

import '@/i18n/work';
import { SectionFx } from '@/components/layout/SectionFx';
import { LineIcon } from '@/components/ui/LineIcon';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { paths } from '@/config/routes';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { Gallery } from './Gallery';
import { SampleBadge } from './SampleBadge';
import { COVER_TRANSITION } from '../hooks/useCaseNavigation';

const CaseStudyDirector = lazy(() => import('../fx/CaseStudyDirector'));

/**
 * A case-study block: mono label + heading, consistent across the page.
 * @param {{ id: string, label: string, title: string, children: import('react').ReactNode, className?: string }} props
 */
function Block({ id, label, title, children, className = '' }) {
  return (
    <section className={`cs-block ${className}`} aria-labelledby={id}>
      <header className="cs-block__head">
        <p className="cs-block__label" dir="ltr">
          {label}
        </p>
        <h2 id={id} className="cs-block__title">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

/**
 * The case study, read like the record it is: the cover becomes the page's
 * header (it is the View Transition target from the case file), then the
 * request (problem) and the response (solution), the architecture drawn from
 * the data with its decisions, technologies, challenges (as resolved
 * incidents), descriptive metrics, the gallery, links, related case files and
 * a giant "Next case →".
 *
 * Everything is prerendered text; the director adds the scroll scenes.
 * @param {{ project: any, next?: any }} props
 */
export function CaseStudy({ project, next }) {
  const { t } = useTranslation();
  const metrics = project.metrics ?? [];
  const related = project.related_projects ?? [];
  const hasLinks = Boolean(project.live_url || project.github_url);

  return (
    <article id="case-study" className="cs" aria-labelledby="case-title">
      <header className="cs__head container-fluid">
        <nav aria-label={t('caseStudy.breadcrumb')}>
          <ol className="cs__crumbs">
            <li>
              <LocalizedLink to={paths.home()}>{t('caseStudy.home')}</LocalizedLink>
            </li>
            <li>
              <LocalizedLink to={paths.projects()}>{t('caseStudy.work')}</LocalizedLink>
            </li>
            <li aria-current="page">{project.title}</li>
          </ol>
        </nav>
        <p className="cs__request" dir="ltr">
          <span className="cs__verb">GET</span> /projects/{project.slug}{' '}
          <span className="cs__ok">200 OK</span>
          <span className="cs__pk">
            {t('caseStudy.record')} #{project.id}
          </span>
        </p>
        <div className="cs__titlebar">
          <h1 id="case-title" className="cs__title" data-cs-title>
            {project.title}
          </h1>
          {project.is_sample && <SampleBadge className="cs__badge" />}
        </div>
        <p className="cs__summary">{project.summary}</p>
        <dl className="cs__facts">
          {[
            ['role', project.role],
            ['type', t(`projects.types.${project.type}`, { defaultValue: project.type })],
            ['year', project.year],
            ['duration', project.duration],
            ['client', project.client],
          ]
            .filter(([, value]) => value)
            .map(([key, value]) => (
              <div key={key} className="cs__fact">
                <dt>{t(`caseStudy.${key}`)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
        </dl>
      </header>

      <figure className="cs__cover" data-cs-cover>
        <div className="cs__cover-frame" data-cs-cover-frame>
          <img
            src={project.cover_image}
            alt={project.cover_alt ?? ''}
            width={1600}
            height={1000}
            fetchPriority="high"
            decoding="async"
            style={{ viewTransitionName: COVER_TRANSITION }}
            data-vt-cover
            data-cs-cover-img
          />
        </div>
      </figure>

      <div className="cs__body container-fluid">
        {project.is_sample && (
          <p className="cs__notice" role="note">
            {t('caseStudy.sampleNotice')}
          </p>
        )}

        <section
          className="cs-brief"
          aria-label={`${t('caseStudy.problem')} / ${t('caseStudy.solution')}`}
        >
          <div className="cs-brief__part cs-brief__part--req">
            <p className="cs-block__label" dir="ltr">
              → request
            </p>
            <h2 className="cs-brief__title">{t('caseStudy.problem')}</h2>
            <p className="cs-brief__text">{project.problem}</p>
          </div>
          <span className="cs-brief__wire" aria-hidden="true">
            <span data-cs-wire />
          </span>
          <div className="cs-brief__part cs-brief__part--res">
            <p className="cs-block__label" dir="ltr">
              ← 200 response
            </p>
            <h2 className="cs-brief__title">{t('caseStudy.solution')}</h2>
            <p className="cs-brief__text">{project.solution}</p>
          </div>
        </section>

        {project.architecture?.nodes?.length > 0 && (
          <Block
            id="cs-architecture"
            label="architecture.svg"
            title={t('caseStudy.architecture')}
            className="cs-block--arch"
          >
            <p className="cs-block__lead">{t('caseStudy.architectureLead')}</p>
            <ArchitectureDiagram
              architecture={project.architecture}
              decisions={project.decisions}
              title={project.title}
            />
          </Block>
        )}

        {project.technologies?.length > 0 && (
          <Block id="cs-stack" label="composer.json" title={t('caseStudy.stack')}>
            <ul className="cs-stack">
              {project.technologies.map((tech, i) => (
                <li key={tech.slug} className="cs-stack__item" data-cs-chip>
                  <span className="cs-stack__n" dir="ltr" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {tech.name}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {project.challenges?.length > 0 && (
          <Block id="cs-challenges" label="incidents.log" title={t('caseStudy.challenges')}>
            <ol className="incidents">
              {project.challenges.map((challenge, i) => (
                <li key={challenge.title} className="incident" data-cs-incident>
                  <p className="incident__id" dir="ltr">
                    INC-{String(i + 1).padStart(2, '0')}
                    <span className="incident__state">
                      <span className="incident__strike" data-cs-strike />
                      resolved
                    </span>
                  </p>
                  <h3 className="incident__title">{challenge.title}</h3>
                  <p className="incident__body">{challenge.body}</p>
                </li>
              ))}
            </ol>
          </Block>
        )}

        {metrics.length > 0 && (
          <Block id="cs-metrics" label="metrics.json" title={t('caseStudy.metrics')}>
            <dl className="cs-metrics">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="cs-metric"
                  data-empty={
                    metric.value === null || metric.value === undefined ? 'true' : undefined
                  }
                >
                  <dt>{metric.label}</dt>
                  <dd>{metric.value ?? t('projects.noData')}</dd>
                </div>
              ))}
            </dl>
            <p className="cs-block__note">{t('caseStudy.metricsNote')}</p>
          </Block>
        )}

        {project.gallery?.length > 0 && (
          <Block id="cs-gallery" label="storage/screens" title={t('caseStudy.gallery')}>
            <Gallery images={project.gallery} />
          </Block>
        )}

        <Block id="cs-links" label="links" title={t('caseStudy.links')}>
          {hasLinks ? (
            <ul className="cs-links">
              {project.live_url && (
                <li>
                  <a
                    className="cs-links__item"
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('caseStudy.live')}
                    <LuArrowUpRight aria-hidden="true" />
                    <span className="sr-only">{t('a11y.externalLink')}</span>
                  </a>
                </li>
              )}
              {project.github_url && (
                <li>
                  <a
                    className="cs-links__item"
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <LineIcon name="github" />
                    {t('caseStudy.source')}
                    <span className="sr-only">{t('a11y.externalLink')}</span>
                  </a>
                </li>
              )}
            </ul>
          ) : (
            <p className="cs-links__private">
              <LineIcon name="lock" />
              {t('caseStudy.private')}
            </p>
          )}
        </Block>

        {related.length > 0 && (
          <Block id="cs-related" label="related_projects" title={t('caseStudy.related')}>
            <ul className="cs-related">
              {related.map((item) => (
                <li key={item.slug}>
                  <LocalizedLink to={paths.project(item.slug)} className="cs-related__card">
                    <img
                      src={item.cover_image}
                      alt=""
                      width={1600}
                      height={1000}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="cs-related__meta" dir="ltr">
                      {t(`projects.types.${item.type}`, { defaultValue: item.type })} · {item.year}
                    </span>
                    <span className="cs-related__title">{item.title}</span>
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </Block>
        )}
      </div>

      {next && next.slug !== project.slug && (
        <nav className="cs-next" aria-label={t('caseStudy.next')}>
          <LocalizedLink
            to={paths.project(next.slug)}
            className="cs-next__link"
          >
            <span className="cs-next__label">
              {t('caseStudy.next')}{' '}
              <span aria-hidden="true" className="cs-next__arrow">
                →
              </span>
            </span>
            <span className="cs-next__title">
              <span className="cs-next__ghost" aria-hidden="true">
                {next.title}
              </span>
              <span className="cs-next__fill" data-cs-next-fill>
                {next.title}
              </span>
            </span>
          </LocalizedLink>
        </nav>
      )}

      <SectionFx target="case-study">
        <CaseStudyDirector />
      </SectionFx>
    </article>
  );
}
