import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useIdleReady } from '@/hooks/useHydrated';
import { useLocale } from '@/hooks/useLocale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { NODE_H, focusedEdges, layoutArchitecture } from '../lib/architecture';

/** Seconds for one packet to travel an edge, per kind. */
const PACKET_SPEED = { sync: 2.2, async: 3.4, realtime: 1.4 };

/**
 * Which decision the reader is on: the one crossing the middle of the
 * viewport (IntersectionObserver, no scroll handler).
 * @param {import('react').RefObject<HTMLOListElement | null>} listRef
 */
function useDecisionInView(listRef) {
  const [index, setIndex] = useState(/** @type {number | null} */ (null));
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((entry) => entry.isIntersecting).at(-1);
        if (hit) setIndex(Number(/** @type {HTMLElement} */ (hit.target).dataset.decision));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    list.querySelectorAll('[data-decision]').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [listRef]);
  return index;
}

/**
 * Pauses the diagram's SMIL packets while it is off screen.
 * @param {import('react').RefObject<SVGSVGElement | null>} svgRef
 * @param {boolean} active
 */
function usePauseOffscreen(svgRef, active) {
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !active || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [svgRef, active]);
}

/**
 * Architecture diagram built from the project's data: nodes laid out by layer
 * (the request flows top to bottom), edges by kind (sync solid, queued
 * dashed, real-time Ion). The architectural decisions sit beside it; the one
 * being read (scroll) or pointed at (hover/focus) lights up the nodes it is
 * about and the paths between them.
 *
 * - Prerendered in full (geometry is pure, see lib/architecture).
 * - The SVG is `role="img"`; a visually hidden list of the data flows is its
 *   text equivalent.
 * - Request packets travel the edges only after idle, never under reduced
 *   motion, and pause off screen. The director draws the traces with the
 *   scroll.
 *
 * @param {{ architecture: any, decisions?: any[], title: string }} props
 */
export function ArchitectureDiagram({ architecture, decisions = [], title }) {
  const { t } = useTranslation();
  const { dir } = useLocale();
  const ready = useIdleReady();
  const reduced = useReducedMotion();
  const layout = useMemo(() => layoutArchitecture(architecture, { dir }), [architecture, dir]);
  const listRef = useRef(/** @type {HTMLOListElement | null} */ (null));
  const svgRef = useRef(/** @type {SVGSVGElement | null} */ (null));
  const inView = useDecisionInView(listRef);
  const [pointed, setPointed] = useState(/** @type {number | null} */ (null));
  const packets = ready && !reduced;
  usePauseOffscreen(svgRef, packets);

  const active = pointed ?? inView;
  const focus = useMemo(
    () => (active === null ? [] : (decisions[active]?.nodes ?? [])),
    [active, decisions],
  );
  const litEdges = useMemo(() => focusedEdges(layout.edges, focus), [layout.edges, focus]);
  const labelOf = (/** @type {string} */ id) =>
    layout.nodes.find((node) => node.id === id)?.label ?? id;

  if (layout.nodes.length === 0) return null;

  return (
    <div className="arch" data-focus={focus.length > 0 ? 'on' : 'off'}>
      <figure className="arch__figure">
        <div className="arch__scroll">
          <svg
            ref={svgRef}
            className="arch__svg"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            width={layout.width}
            height={layout.height}
            role="img"
            aria-labelledby="arch-caption"
            data-arch
          >
            <defs>
              {['sync', 'async', 'realtime'].map((kind) => (
                <marker
                  key={kind}
                  id={`arch-arrow-${kind}`}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 L8 4 L0 8 z" className={`arch__arrow arch__arrow--${kind}`} />
                </marker>
              ))}
            </defs>

            {layout.rows.map((row) => (
              <text
                key={row.layer}
                className="arch__layer"
                x={row.x}
                y={row.y}
                textAnchor={dir === 'rtl' ? 'end' : 'start'}
                dominantBaseline="middle"
              >
                {t(`caseStudy.layers.${row.layer}`, { defaultValue: row.layer })}
              </text>
            ))}

            {layout.edges.map((edge) => (
              <g
                key={edge.id}
                className="arch__edge"
                data-kind={edge.kind}
                data-lit={litEdges.has(edge.id) ? 'true' : undefined}
              >
                <path
                  d={edge.d}
                  className="arch__wire"
                  markerEnd={`url(#arch-arrow-${edge.kind})`}
                />
                {edge.kind !== 'async' && (
                  <path d={edge.d} className="arch__trace" pathLength={1} data-arch-trace />
                )}
                {edge.label && (
                  <text
                    className="arch__edge-label"
                    x={edge.mid.x}
                    y={edge.mid.y - 6}
                    textAnchor="middle"
                  >
                    {edge.label}
                  </text>
                )}
                {packets && (
                  <circle r={3.2} className="arch__packet">
                    <animateMotion
                      dur={`${PACKET_SPEED[edge.kind]}s`}
                      begin={`-${((edge.d.length * 0.13) % PACKET_SPEED[edge.kind]).toFixed(2)}s`}
                      repeatCount="indefinite"
                      path={edge.d}
                    />
                  </circle>
                )}
              </g>
            ))}

            {layout.nodes.map((node) => (
              <g
                key={node.id}
                className="arch__node"
                data-layer={node.layer}
                data-lit={focus.includes(node.id) ? 'true' : undefined}
                data-arch-node
              >
                <rect
                  className="arch__box"
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={12}
                />
                <rect
                  className="arch__outline"
                  x={node.x}
                  y={node.y}
                  width={node.w}
                  height={node.h}
                  rx={12}
                  pathLength={1}
                  data-arch-outline
                />
                <text
                  className="arch__label"
                  x={node.x + node.w / 2}
                  y={node.y + (node.note ? NODE_H * 0.42 : NODE_H / 2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {node.label}
                </text>
                {node.note && (
                  <text
                    className="arch__note"
                    x={node.x + node.w / 2}
                    y={node.y + NODE_H * 0.72}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {node.note}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
        <figcaption id="arch-caption" className="sr-only">
          {t('caseStudy.diagramLabel', { title })}
        </figcaption>
        <ul className="sr-only" aria-label={t('caseStudy.flows')}>
          {layout.edges.map((edge) => (
            <li key={edge.id}>
              {t('caseStudy.flow', {
                from: labelOf(edge.from),
                to: labelOf(edge.to),
                kind: t(`caseStudy.kinds.${edge.kind}`),
              })}
            </li>
          ))}
        </ul>
        <p className="arch__legend" aria-hidden="true">
          {['sync', 'async', 'realtime'].map((kind) => (
            <span key={kind} data-kind={kind}>
              <i />
              {t(`caseStudy.kinds.${kind}`)}
            </span>
          ))}
        </p>
      </figure>

      {decisions.length > 0 && (
        <div className="arch__decisions">
          <h3 className="arch__decisions-title">{t('caseStudy.decisions')}</h3>
          <ol ref={listRef} className="adr">
            {decisions.map((decision, i) => (
              <li
                key={decision.title}
                className="adr__item"
                data-decision={i}
                data-active={active === i ? 'true' : undefined}
                onPointerEnter={(event) => event.pointerType === 'mouse' && setPointed(i)}
                onPointerLeave={() => setPointed(null)}
              >
                <p className="adr__id" dir="ltr">
                  ADR-{String(i + 1).padStart(3, '0')}
                </p>
                <h4 className="adr__title">{decision.title}</h4>
                <p className="adr__body">{decision.body}</p>
                {decision.nodes?.length > 0 && (
                  <p className="adr__touches" dir="ltr">
                    {decision.nodes.map(labelOf).join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
