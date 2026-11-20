import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { markBootReady } from '@/features/intro/boot-store';
import { usePointerParallax } from '@/hooks/usePointerParallax';
import { cn } from '@/utils/cn';
import { CODE_TOKENS } from '../config';
import { portrait } from '../lib/portrait';

/**
 * Where badges float around the monolith: inline-start fraction (`x`), top
 * fraction (`y`) and depth (`d`: higher = nearer = more parallax).
 * The first three are the ones kept on phones.
 */
const BADGE_SLOTS = [
  { x: 0, y: 0.6, d: 1.15 },
  { x: 0.8, y: 0.17, d: 0.85 },
  { x: 0.86, y: 0.47, d: 1.3 },
  { x: 0.72, y: 0.72, d: 0.95 },
  { x: 0.9, y: 0.3, d: 0.65 },
];
const CODE_SLOTS = [
  { x: -0.06, y: 0.12, d: 0.35 },
  { x: 0.9, y: 0.62, d: 0.45 },
  { x: 0.22, y: 0.04, d: 0.3 },
];

/** Blueprint rings behind the monolith (decorative). */
function Rings() {
  return (
    <svg className="rings" viewBox="0 0 400 400" fill="none" aria-hidden="true" data-rings-svg>
      <defs>
        <path id="ring-orbit" d="M200 52a148 148 0 1 1 0 296a148 148 0 1 1 0-296" />
      </defs>
      <g className="rings__outer">
        <circle cx="200" cy="200" r="190" className="rings__hair" />
        <circle cx="200" cy="200" r="190" className="rings__ticks" />
        <path d="M200 10a190 190 0 0 1 134 56" className="rings__arc" />
        <text x="366" y="214" className="rings__note">
          Ø 1.618
        </text>
      </g>
      <g className="rings__mid">
        <circle cx="200" cy="200" r="148" className="rings__dash" />
        {['API', 'QUEUE', 'CACHE', 'AUTH'].map((name, i) => (
          <text key={name} className="rings__label">
            <textPath href="#ring-orbit" startOffset={`${i * 25 + 2}%`}>
              {`· ${name}`}
            </textPath>
          </text>
        ))}
        <circle cx="348" cy="200" r="3" className="rings__node rings__node--ember" />
        <circle cx="52" cy="200" r="2.5" className="rings__node rings__node--ion" />
      </g>
      <g className="rings__inner">
        <circle cx="200" cy="200" r="112" className="rings__hair" />
        <path d="M200 70v28M200 302v28M70 200h28M302 200h28" className="rings__cross" />
      </g>
    </svg>
  );
}

/**
 * "Monolith Portal": the portrait staged inside a tall arched frame, with
 * rings, rim light and floating badges on separate depth layers.
 *
 * Layer ownership (no two systems ever animate the same property):
 *  - `.portrait`          GSAP scroll scene (scale / y)
 *  - `.portrait__settle`  GSAP entrance (camera settle)
 *  - `.portrait__tilt`    CSS: 3D tilt from `--mx/--my` (usePointerParallax)
 *  - `.portrait__layer`   CSS: depth parallax from `--mx/--my × --d`
 *  - layer contents       GSAP entrance details + CSS idle loops
 *
 * Modes (from the image pipeline): `cutout` lets the head break out above
 * the arch; `photo` crops and grades an opaque image inside the frame;
 * `missing` shows a monogram. Replacing the source file is all it takes.
 *
 * @param {{ name?: string, badges?: string[], className?: string }} props
 */
export function Portrait({ name, badges = [], className }) {
  const { t } = useTranslation();
  const rootRef = useRef(/** @type {HTMLElement | null} */ (null));
  const imgRef = useRef(/** @type {HTMLImageElement | null} */ (null));
  usePointerParallax(rootRef);

  // Real readiness for the boot intro: the portrait is decoded and paintable.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) {
      markBootReady('portrait');
      return;
    }
    const done = () => markBootReady('portrait');
    if (img.complete && img.naturalWidth > 0) img.decode?.().then(done, done) ?? done();
    else
      img.addEventListener('load', () => img.decode?.().then(done, done) ?? done(), { once: true });
    img.addEventListener('error', done, { once: true });
  }, []);

  const style = /** @type {import('react').CSSProperties} */ ({
    '--fig-aspect': portrait.aspect.toFixed(4),
    '--head-x': portrait.head.x,
    '--chin': portrait.head.chin,
    '--portrait-mask': portrait.mask ? `url("${portrait.mask}")` : 'none',
  });

  return (
    <figure
      ref={rootRef}
      className={cn('portrait', className)}
      data-status={portrait.status}
      data-mesh-anchor
      style={style}
    >
      <div className="portrait__settle" data-portrait-settle>
        <div className="portrait__tilt">
          <div
            className="portrait__layer portrait__rings"
            style={{ '--d': 0.25 }}
            aria-hidden="true"
          >
            <div className="portrait__rings-scroll" data-rings-scroll>
              <Rings />
            </div>
          </div>

          <div
            className="portrait__layer portrait__frame"
            style={{ '--d': 0.45 }}
            aria-hidden="true"
          >
            <span className="portrait__frame-glass" data-portrait-frame />
            <span className="portrait__frame-tag" dir="ltr">
              GATEWAY · v1
            </span>
          </div>

          <div className="portrait__layer portrait__figure" style={{ '--d': 0.7 }}>
            <div className="portrait__figure-inner" data-portrait-figure>
              {portrait.status === 'missing' ? (
                <span className="portrait__monogram" aria-hidden="true">
                  {t('hero.monogram')}
                </span>
              ) : (
                <>
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={portrait.avif}
                      sizes="(min-width: 64rem) 26rem, 60vw"
                    />
                    <source
                      type="image/webp"
                      srcSet={portrait.webp}
                      sizes="(min-width: 64rem) 26rem, 60vw"
                    />
                    <img
                      ref={imgRef}
                      src={portrait.src}
                      width={portrait.width}
                      height={portrait.height}
                      alt={t('hero.portraitAlt', { name })}
                      decoding="async"
                      className="portrait__img"
                    />
                  </picture>
                  <span className="portrait__rim" aria-hidden="true" />
                  <span className="portrait__dots" aria-hidden="true" />
                  <span className="portrait__scan" aria-hidden="true" />
                </>
              )}
            </div>
          </div>

          <ul className="portrait__badges" aria-hidden="true">
            {badges.slice(0, BADGE_SLOTS.length).map((badge, i) => (
              <li
                key={badge}
                className="portrait__layer portrait__badge"
                data-slot={i}
                style={{
                  '--d': BADGE_SLOTS[i].d,
                  '--x': BADGE_SLOTS[i].x,
                  '--y': BADGE_SLOTS[i].y,
                }}
              >
                <span data-portrait-badge>{badge}</span>
              </li>
            ))}
            {CODE_TOKENS.map((token, i) => (
              <li
                key={token}
                className="portrait__layer portrait__badge portrait__badge--code"
                style={{ '--d': CODE_SLOTS[i].d, '--x': CODE_SLOTS[i].x, '--y': CODE_SLOTS[i].y }}
                dir="ltr"
              >
                <span data-portrait-badge>{token}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
