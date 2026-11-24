import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowUpRight } from 'react-icons/lu';

import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { paths } from '@/config/routes';
import { useCaseNavigation } from '../hooks/useCaseNavigation';

const pad = (/** @type {number} */ n, size = 3) => String(n).padStart(size, '0');

/**
 * Pointer position inside the visual, as CSS variables for the clip-path
 * reveal (mouse only; the reveal itself is pure CSS `:hover`).
 * @param {import('react').PointerEvent<HTMLElement>} event
 */
function trackPointer(event) {
  if (event.pointerType !== 'mouse') return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
}

/**
 * One case file: a database record rendered as a cinematic row.
 *
 * - The visual: the cover, and (hover on a mouse) a clip-path reveal of the
 *   second screen with a metrics readout, opening from the pointer.
 * - The record: row number and primary key, type, year, the title (the one
 *   focusable link), summary, role, stack and the descriptive metrics, all
 *   real text. Metrics without data say so.
 * - Clicking either the title or the visual morphs the cover into the case
 *   study's header (View Transitions, see useCaseNavigation).
 *
 * @param {{ project: import('@/services/api/mappers/projects').Project, index: number }} props
 */
export function CaseFile({ project, index }) {
  const { t } = useTranslation();
  const coverRef = useRef(/** @type {HTMLImageElement | null} */ (null));
  const openCase = useCaseNavigation();
  const to = paths.project(project.slug);
  const onOpen = (/** @type {import('react').MouseEvent} */ event) =>
    openCase(event, project.slug, coverRef.current);
  const metrics = project.metrics ?? [];

  return (
    <article className="case__file" aria-labelledby={`case-${project.slug}`}>
      <span className="case__index" aria-hidden="true" data-case-index>
        {String(index + 1).padStart(2, '0')}
      </span>

      <LocalizedLink
        to={to}
        onClick={onOpen}
        onPointerMove={trackPointer}
        className="case__visual"
        aria-hidden="true"
        tabIndex={-1}
      >
        <span className="case__frame" data-case-frame>
          <span className="case__media" data-case-media>
            <img
              ref={coverRef}
              className="case__cover"
              src={project.cover_image ?? undefined}
              alt={project.cover_alt ?? ''}
              width={1600}
              height={1000}
              loading="lazy"
              decoding="async"
            />
            {project.preview_image && (
              <span className="case__reveal">
                <img
                  src={project.preview_image}
                  alt=""
                  width={1600}
                  height={1000}
                  loading="lazy"
                  decoding="async"
                />
                {metrics.length > 0 && (
                  <span className="case__readout" dir="ltr">
                    <span className="case__readout-sql">
                      SELECT metrics FROM projects WHERE id = {project.id};
                    </span>
                    {metrics.map((metric) => (
                      <span key={metric.label} className="case__readout-row">
                        <span>{metric.label}</span>
                        <b
                          data-empty={
                            metric.value === null || metric.value === undefined ? 'true' : undefined
                          }
                        >
                          {metric.value ?? 'NULL'}
                        </b>
                      </span>
                    ))}
                  </span>
                )}
              </span>
            )}
          </span>
        </span>
        <span className="case__scan" data-case-scan />
      </LocalizedLink>

      <div className="case__body">
        <p className="case__record" dir="ltr" data-case-field>
          <span>row {pad(index + 1)}</span>
          <span className="case__pk">projects.id = {project.id}</span>
        </p>
        <p className="case__tags" data-case-field>
          <span className="case__type">{project.type_label}</span>
          {project.year && (
            <>
              <span aria-hidden="true">·</span>
              <span dir="ltr">{project.year}</span>
            </>
          )}
        </p>
        <h3 id={`case-${project.slug}`} className="case__title">
          <LocalizedLink to={to} onClick={onOpen} className="case__link">
            {project.title}
          </LocalizedLink>
        </h3>
        <p className="case__summary">{project.summary}</p>

        <dl className="case__fields">
          {project.role && (
            <div data-case-field>
              <dt>{t('projects.role')}</dt>
              <dd>{project.role}</dd>
            </div>
          )}
          {project.technologies?.length > 0 && (
            <div data-case-field>
              <dt>{t('projects.tech')}</dt>
              <dd dir="ltr" className="case__stack">
                {project.technologies.map((tech) => tech.name).join(' · ')}
              </dd>
            </div>
          )}
        </dl>

        {metrics.length > 0 && (
          <dl className="case__metrics" aria-label={t('caseStudy.metrics')}>
            {metrics.map((metric) => (
              <div key={metric.label} className="case__metric" data-case-field>
                <dt>{metric.label}</dt>
                <dd
                  data-empty={
                    metric.value === null || metric.value === undefined ? 'true' : undefined
                  }
                >
                  {metric.value ?? t('projects.noData')}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <span className="case__open" aria-hidden="true">
          {t('projects.open')}
          <LuArrowUpRight className="case__open-icon" />
        </span>
      </div>
    </article>
  );
}
