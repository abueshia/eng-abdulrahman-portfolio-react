import { AnimatePresence, m } from 'motion/react';
import { lazy, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import '@/i18n/work';
import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { useHydrated } from '@/hooks/useHydrated';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EVENTS, emit } from '@/lib/events';
import { EASE } from '@/utils/motion';
import { useFlip } from '../hooks/useFlip';
import { useProjects } from '../hooks/useProjects';
import {
  NO_FILTERS,
  facets as buildFacets,
  filterProjects,
  filtersKey,
  parseFilters,
  withFilters,
} from '../lib/filters';
import { CaseFile } from './CaseFile';
import { QueryConsole } from './QueryConsole';

const ProjectsDirector = lazy(() => import('../fx/ProjectsDirector'));

/** Records entering/leaving the result set: rows are written, then deleted. */
const RECORD = {
  initial: { clipPath: 'inset(0% 0% 100% 0%)' },
  animate: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 0.6, ease: EASE.outExpo } },
  exit: { clipPath: 'inset(100% 0% 0% 0%)', transition: { duration: 0.38, ease: EASE.shutter } },
};

/**
 * Mobile pager: the case files scroll sideways (CSS scroll-snap); this keeps
 * the "01 / 03" counter and the progress hairline in step with the swipe,
 * writing the DOM directly (no re-render per scroll frame).
 * @param {import('react').RefObject<HTMLOListElement | null>} listRef
 * @param {import('react').RefObject<HTMLElement | null>} pagerRef
 * @param {number} total
 */
function useSwipePager(listRef, pagerRef, total) {
  useEffect(() => {
    const list = listRef.current;
    const pager = pagerRef.current;
    if (!list || !pager) return undefined;
    const current = pager.querySelector('[data-pager-current]');
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = list.scrollWidth - list.clientWidth;
      // scrollLeft is negative in RTL: the magnitude is what matters.
      const progress = max > 0 ? Math.min(1, Math.abs(list.scrollLeft) / max) : 0;
      pager.style.setProperty('--p', progress.toFixed(3));
      if (current) {
        current.textContent = String(Math.round(progress * (total - 1)) + 1).padStart(2, '0');
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    list.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener('scroll', onScroll);
    };
  }, [listRef, pagerRef, total]);
}

/**
 * Projects, the DATABASE station: the stored work, pulled one record at a
 * time ("Cinematic Case Files").
 *
 * - Full-width case files with alternating direction; each is a real
 *   `<article>` with every field prerendered.
 * - Filters (type, technology) live in the URL query, so a filtered view can
 *   be shared. They apply after hydration (the prerendered list is always
 *   the full one). Records enter/leave through motion (AnimatePresence) and
 *   the ones that stay glide to their new place (FLIP, see useFlip).
 * - Phones: a purpose-built horizontal swipe deck with a pager.
 * - The scroll scenes (each record "read from disk", parallax, the query
 *   cursor riding the index) live in the lazy director.
 */
export default function ProjectsSection() {
  const { t } = useTranslation();
  const { data } = useProjects();
  const hydrated = useHydrated();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const listRef = useRef(/** @type {HTMLOListElement | null} */ (null));
  const pagerRef = useRef(/** @type {HTMLParagraphElement | null} */ (null));

  const all = useMemo(() => data?.data ?? [], [data]);
  const facetData = useMemo(() => buildFacets(all), [all]);
  const filters = useMemo(() => {
    if (!hydrated) return NO_FILTERS;
    return parseFilters(searchParams, {
      types: facetData.types.map((type) => type.slug),
      techs: facetData.techs.map((tech) => tech.slug),
    });
  }, [hydrated, searchParams, facetData]);
  const visible = useMemo(() => filterProjects(all, filters), [all, filters]);
  const key = filtersKey(filters);
  const reduced = useReducedMotion();
  const captureFlip = useFlip(listRef, key, !reduced);

  const setFilters = useCallback(
    (/** @type {import('../lib/filters').ProjectFilters} */ next) => {
      captureFlip();
      const search = withFilters(searchParams, next).toString();
      // Keep the hash: dropping it would make the scroll manager jump to top.
      navigate(
        { search: search ? `?${search}` : '', hash: location.hash },
        { replace: true, preventScrollReset: true, state: location.state },
      );
    },
    [navigate, searchParams, location.hash, location.state, captureFlip],
  );

  useSwipePager(listRef, pagerRef, visible.length);

  return (
    <Section id="projects" className="projects">
      <div className="container-fluid projects__layout">
        <SectionHeading
          id="projects-title"
          index={getStation(stationForSection('projects'))?.code}
          eyebrow={<span dir="ltr">db · projects</span>}
          title={t('sections.projects')}
          description={t('projects.lead')}
        />

        <QueryConsole
          filters={filters}
          facets={facetData}
          count={visible.length}
          onChange={setFilters}
        />

        <div className="cases-wrap" data-cases>
          <span className="cases__spine" aria-hidden="true">
            <span className="cases__cursor" data-cases-cursor />
          </span>
          <ol ref={listRef} className="cases" aria-label={t('sections.projects')}>
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((project, i) => (
                <m.li
                  key={project.slug}
                  variants={RECORD}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onAnimationComplete={() => emit(EVENTS.layout)}
                  className="case"
                  data-side={i % 2 === 0 ? 'start' : 'end'}
                  data-case
                  data-flip={project.slug}
                >
                  <CaseFile project={project} index={i} />
                </m.li>
              ))}
            </AnimatePresence>
          </ol>
          {visible.length === 0 && all.length > 0 && (
            <p className="cases__empty" dir="ltr">
              <span aria-hidden="true">Empty set · </span>
              <span dir="auto">{t('projects.empty')}</span>
            </p>
          )}
        </div>

        {visible.length > 1 && (
          <p ref={pagerRef} className="cases__pager" aria-hidden="true">
            <span dir="ltr">
              <span data-pager-current>01</span> / {String(visible.length).padStart(2, '0')}
            </span>
            <span className="cases__bar" />
            <span>{t('projects.swipe')}</span>
          </p>
        )}
      </div>
      <SectionFx target="projects">
        <ProjectsDirector filterKey={key} />
      </SectionFx>
    </Section>
  );
}
