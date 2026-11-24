import { lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { useExperiences } from '../hooks/useExperiences';
import { buildGitGraph, formatMonth } from '../lib/git-log';

const ExperienceDirector = lazy(() => import('../fx/ExperienceDirector'));

/** Curve box, in lane units (one lane = 20 × the curve's 28 units tall). */
const LANE = 20;
const CURVE_H = 28;

/**
 * The graph gutter of one row: lane segments, fork/merge curves and the node.
 * Logical positioning (`inset-inline-start`) mirrors it in RTL; the curves'
 * SVG is flipped by CSS.
 * @param {{ row: import('../lib/git-log').GraphRow, lanes: number }} props
 */
function Gutter({ row, lanes }) {
  return (
    <div className="gl__graph" aria-hidden="true" style={{ '--lanes': lanes }}>
      {row.segments.map((segment, i) => (
        <span
          key={i}
          className="gl__seg"
          data-lane={segment.lane}
          data-from={segment.from}
          data-to={segment.to}
          style={{ '--lane': segment.lane }}
          data-gl-seg={segment.from !== 'top' ? 'out' : segment.to === 'node' ? 'in' : 'through'}
        />
      ))}
      {row.curves.map((curve) => {
        const x0 = LANE / 2;
        const xs = curve.lane * LANE + LANE / 2;
        const d =
          curve.kind === 'merge'
            ? `M${x0} 0 C${x0} ${CURVE_H * 0.65} ${xs} ${CURVE_H * 0.35} ${xs} ${CURVE_H}`
            : `M${xs} 0 C${xs} ${CURVE_H * 0.65} ${x0} ${CURVE_H * 0.35} ${x0} ${CURVE_H}`;
        return (
          <svg
            key={`${curve.kind}-${curve.lane}`}
            className="gl__curve"
            data-kind={curve.kind}
            viewBox={`0 0 ${(curve.lane + 1) * LANE} ${CURVE_H}`}
            style={{ '--span': curve.lane + 1 }}
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d={d} pathLength={1} data-gl-curve />
          </svg>
        );
      })}
      <span
        className="gl__node"
        data-kind={row.kind}
        data-lane={row.lane}
        style={{ '--lane': row.lane }}
        data-gl-node
      />
    </div>
  );
}

/**
 * Refs decoration, like `git log --decorate`: HEAD, the branch, the role tag.
 * @param {{ row: import('../lib/git-log').GraphRow, tag?: string }} props
 */
function Refs({ row, tag }) {
  const parts = [
    row.head && (
      <b key="head" className="gl__head">
        HEAD -&gt; main
      </b>
    ),
    // A merge commit sits on main itself; only commits carry a branch ref.
    row.kind === 'commit' && (
      <bdi key="branch" className="gl__branch">
        {row.branch}
      </bdi>
    ),
    tag && (
      <span key="tag" className="gl__tag">
        tag: <bdi>{tag}</bdi>
      </span>
    ),
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <span className="gl__refs">
      ({parts.flatMap((part, i) => (i === 0 ? [part] : [', ', part]))})
    </span>
  );
}

/**
 * Experience, the QUEUE station: the jobs, processed in order.
 *
 * Rendered as `git log --graph`: each role is a commit (hash, branch = the
 * company, tag = the role), achievements are `+` diff lines, and side work is
 * a branch that forks off and merges back. Real list markup, every word
 * prerendered; the director draws the graph with the scroll while the HEAD
 * (the visitor's request) travels down `main`.
 */
export default function ExperienceSection() {
  const { t } = useTranslation();
  const { data } = useExperiences();
  const graph = useMemo(() => buildGitGraph(data?.data ?? []), [data]);
  // The director rebuilds its triggers (and refreshes ScrollTrigger) whenever
  // the rendered log changes: data arriving after mount, or a language switch.
  const graphKey = graph.rows.map((row) => row.key).join(',');

  return (
    <Section id="experience" className="experience">
      <div className="container-fluid experience__layout">
        <SectionHeading
          id="experience-title"
          index={getStation(stationForSection('experience'))?.code}
          eyebrow={<span dir="ltr">{t('experience.command')}</span>}
          title={t('sections.experience')}
          description={t('experience.lead')}
        />

        <div className="gl" style={{ '--lanes': graph.lanes }} data-gl>
          <span className="gl__headdot" aria-hidden="true" data-gl-headdot />
          <ol className="gl__log">
            {graph.rows.map((row) => {
              const job = row.experience;
              return (
                <li key={row.key} className="gl__row" data-kind={row.kind} data-gl-row>
                  <Gutter row={row} lanes={graph.lanes} />
                  {job ? (
                    <article className="gl__commit" aria-labelledby={`job-${job.id}`}>
                      <p className="gl__meta" dir="ltr">
                        <span className="gl__hash">commit {row.hash}</span>{' '}
                        <Refs row={row} tag={job.role} />
                      </p>
                      <h3 id={`job-${job.id}`} className="gl__title">
                        {job.role}
                        <span className="gl__at"> · {job.company}</span>
                      </h3>
                      <p className="gl__when">
                        <span dir="ltr">
                          <time dateTime={job.start_date}>{formatMonth(job.start_date)}</time>
                          {' → '}
                          {job.end_date ? (
                            <time dateTime={job.end_date}>{formatMonth(job.end_date)}</time>
                          ) : null}
                        </span>
                        {!job.end_date && (
                          <span className="gl__now">{t('experience.present')}</span>
                        )}
                        {job.location && <span>{job.location}</span>}
                        {(job.employment_label || job.employment_type) && (
                          <span>
                            {job.employment_label ||
                              t(`experience.types.${job.employment_type}`, {
                                defaultValue: job.employment_type,
                              })}
                          </span>
                        )}
                      </p>
                      {job.summary && <p className="gl__msg">{job.summary}</p>}
                      {job.achievements?.length > 0 && (
                        <ul className="gl__diff">
                          {job.achievements.map((line, i) => (
                            <li key={i} className="gl__add" data-gl-add>
                              <span className="gl__plus" aria-hidden="true">
                                +
                              </span>
                              {line}
                            </li>
                          ))}
                        </ul>
                      )}
                      {job.technologies?.length > 0 && (
                        <p className="gl__stack">
                          <span className="gl__stack-key">{t('experience.stack')}:</span>{' '}
                          <span dir="ltr">
                            {job.technologies.map((tech) => tech.name).join(' · ')}
                          </span>
                        </p>
                      )}
                    </article>
                  ) : (
                    <p className="gl__merge" dir="ltr">
                      <span className="gl__hash">commit {row.hash}</span> <Refs row={row} />{' '}
                      <span className="gl__msg">
                        {t('experience.merge', { branch: row.branch })}
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <SectionFx target="experience">
        <ExperienceDirector graphKey={graphKey} />
      </SectionFx>
    </Section>
  );
}
