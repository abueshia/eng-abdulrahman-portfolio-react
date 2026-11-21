import { m } from 'motion/react';
import { lazy, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils/cn';
import { EASE } from '@/utils/motion';
import { useTechnologies } from '../hooks/useTechnologies';
import { CORE_RADIUS, VIEWBOX, layoutConstellation, swipeTarget } from '../lib/constellation';

const SkillsDirector = lazy(() => import('../fx/SkillsDirector'));

/**
 * The constellation: a visual extra mirroring the tabs (which carry the
 * content, the semantics and the keyboard path). Decorative to assistive
 * technology; pointer users can pick an orbit or hover a node.
 * @param {{
 *   orbits: import('../lib/constellation').Orbit[],
 *   active: number,
 *   hot: string | null,
 *   onSelect: (index: number) => void,
 *   onHot: (slug: string | null) => void,
 *   coreLabel: string,
 * }} props
 */
function Constellation({ orbits, active, hot, onSelect, onHot, coreLabel }) {
  return (
    <div className="cst" data-cst aria-hidden="true">
      <div className="cst__tilt" data-cst-tilt>
        <svg className="cst__svg" viewBox={VIEWBOX} focusable="false">
          <defs>
            <radialGradient id="cst-core-glow">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.55" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>
          {orbits.map((orbit, k) => (
            <g
              key={orbit.category}
              className={cn('cst__orbit', k === active && 'is-active')}
              data-cst-orbit={k}
            >
              {/* GSAP owns the orbit group (scroll boot); CSS dims this inner lens. */}
              <g className="cst__lens">
                <circle className="cst__ring" r={orbit.r} />
                <circle
                  className="cst__packet"
                  r={orbit.r}
                  pathLength={100}
                  style={{ '--spd': `${22 + k * 9}s` }}
                />
                <circle className="cst__hit" r={orbit.r} onClick={() => onSelect(k)} />
                {orbit.nodes.map((node) => (
                  <g
                    key={node.slug}
                    className={cn('cst__node', hot === node.slug && 'is-hot')}
                    transform={`translate(${node.x} ${node.y})`}
                    style={{ '--glow': node.glow }}
                    onPointerEnter={() => onHot(node.slug)}
                    onPointerLeave={() => onHot(null)}
                    onClick={() => onSelect(k)}
                  >
                    <g data-cst-node>
                      <circle className="cst__halo" r={node.size * 2.8} />
                      <circle className="cst__dot" r={node.size} />
                    </g>
                    <text
                      className="cst__label"
                      x={node.lx - node.x}
                      y={node.ly - node.y}
                      textAnchor={node.anchor}
                    >
                      {node.name}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          ))}
          <g className="cst__core" data-cst-core>
            <circle className="cst__core-glow" r={CORE_RADIUS * 2.4} fill="url(#cst-core-glow)" />
            <circle className="cst__core-disc" r={CORE_RADIUS} />
            <text className="cst__core-mark" y="10" textAnchor="middle">
              {'{ }'}
            </text>
            <text className="cst__core-label" y="34" textAnchor="middle">
              {coreLabel}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

const listVariants = {
  in: { transition: { staggerChildren: 0.035 } },
  out: {},
};

/**
 * Skills, the SERVICES station: the services running in the system.
 *
 * Tabs are the source of truth (WAI-ARIA tabs, every panel and every skill
 * prerendered as text). Desktop adds the constellation, whose orbits mirror
 * the tabs; phones get a draggable tab strip and swipeable panels instead.
 */
export default function SkillsSection() {
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const { data } = useTechnologies();
  const groups = useMemo(
    () => /** @type {import('../lib/constellation').TechGroup[]} */ (data?.data ?? []),
    [data],
  );
  const orbits = useMemo(() => layoutConstellation(groups), [groups]);
  const [active, setActive] = useState(0);
  const [hot, setHot] = useState(/** @type {string | null} */ (null));
  const tabsRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const swipe = useRef(/** @type {{ x: number, y: number } | null} */ (null));
  const total = groups.reduce((sum, group) => sum + group.technologies.length, 0);

  const select = (/** @type {number} */ index, focus = false) => {
    setActive(index);
    const tab = tabsRef.current?.querySelectorAll('[role="tab"]')[index];
    if (!(tab instanceof HTMLElement)) return;
    if (focus) tab.focus();
    // Keep the chosen tab in view in the scrollable strip (phones).
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };

  /** Roving tabindex: arrows (mirrored in RTL), Home and End. */
  const onTabKeyDown = (/** @type {import('react').KeyboardEvent} */ event) => {
    const last = groups.length - 1;
    const forward = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const back = isRTL ? 'ArrowRight' : 'ArrowLeft';
    /** @type {Record<string, number>} */
    const moves = {
      [forward]: active === last ? 0 : active + 1,
      ArrowDown: active === last ? 0 : active + 1,
      [back]: active === 0 ? last : active - 1,
      ArrowUp: active === 0 ? last : active - 1,
      Home: 0,
      End: last,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  const onPointerDown = (/** @type {import('react').PointerEvent} */ event) => {
    if (event.pointerType === 'mouse') return;
    swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (/** @type {import('react').PointerEvent} */ event) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const next = swipeTarget({
      dx: event.clientX - start.x,
      dy: event.clientY - start.y,
      index: active,
      count: groups.length,
      rtl: isRTL,
    });
    if (next !== null) select(next);
  };

  return (
    <Section id="skills" className="skills">
      <div className="container-fluid skills__layout">
        <SectionHeading
          id="skills-title"
          index={getStation(stationForSection('skills'))?.code}
          eyebrow={t('skills.running', { count: total })}
          title={t('sections.skills')}
          description={t('skills.lead')}
        />

        <div className="skills__stage" data-active={active}>
          <Constellation
            orbits={orbits}
            active={active}
            hot={hot}
            onSelect={(index) => select(index)}
            onHot={setHot}
            coreLabel={t('skills.core')}
          />

          <div className="skills__console">
            <div
              ref={tabsRef}
              role="tablist"
              aria-label={t('skills.categories')}
              className="skills__tabs"
              onKeyDown={onTabKeyDown}
            >
              {groups.map((group, i) => (
                <button
                  key={group.category}
                  type="button"
                  role="tab"
                  id={`skills-tab-${group.category}`}
                  aria-selected={i === active}
                  aria-controls={`skills-panel-${group.category}`}
                  tabIndex={i === active ? 0 : -1}
                  className="skills__tab"
                  onClick={() => select(i)}
                >
                  <span className="skills__tab-no" aria-hidden="true" dir="ltr">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="skills__tab-name">{group.name}</span>
                  <span className="skills__tab-count" aria-hidden="true">
                    {group.technologies.length}
                  </span>
                </button>
              ))}
            </div>

            <div
              className="skills__panels"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => (swipe.current = null)}
            >
              {groups.map((group, i) => (
                <div
                  key={group.category}
                  role="tabpanel"
                  id={`skills-panel-${group.category}`}
                  aria-labelledby={`skills-tab-${group.category}`}
                  hidden={i !== active}
                  tabIndex={0}
                  className="skills__panel"
                >
                  <m.ul
                    className="skills__list"
                    initial={false}
                    animate={i === active ? 'in' : 'out'}
                    variants={listVariants}
                  >
                    {group.technologies.map((tech) => (
                      <m.li
                        key={tech.slug}
                        className={cn('skill', hot === tech.slug && 'is-hot')}
                        variants={{
                          in: { opacity: 1, x: 0 },
                          out: { opacity: 0, x: isRTL ? -16 : 16 },
                        }}
                        transition={{ duration: 0.55, ease: EASE.outExpo }}
                        onPointerEnter={() => setHot(tech.slug)}
                        onPointerLeave={() => setHot(null)}
                      >
                        <span className="skill__name">{tech.name}</span>
                        <span className="skill__years">
                          {t('skills.years', { count: tech.years ?? 0 })}
                        </span>
                        <span
                          className="skill__meter"
                          role="meter"
                          aria-label={`${t('skills.proficiency')}: ${tech.name}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={tech.proficiency ?? 0}
                        >
                          <span
                            className="skill__fill"
                            style={{ '--p': (tech.proficiency ?? 0) / 100 }}
                          />
                        </span>
                        <span className="skill__pct" aria-hidden="true" dir="ltr">
                          {tech.proficiency ?? 0}%
                        </span>
                      </m.li>
                    ))}
                  </m.ul>
                </div>
              ))}
              <p className="skills__swipe" aria-hidden="true">
                {t('skills.swipe')}
              </p>
            </div>
          </div>
        </div>
      </div>
      <SectionFx target="skills">
        <SkillsDirector />
      </SectionFx>
    </Section>
  );
}
