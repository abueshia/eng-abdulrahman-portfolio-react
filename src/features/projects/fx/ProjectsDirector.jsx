import { useLocale } from '@/hooks/useLocale';
import { EVENTS, on } from '@/lib/events';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/** Desktop only: on phones the case files are a horizontal swipe deck. */
const DESKTOP = '(min-width: 64rem)';

/**
 * Projects director: the DATABASE station reads each record from disk.
 *
 * Desktop, all scrubbed (scrolling back un-reads):
 * - Each case file's frame opens behind a scan line that sweeps down the
 *   visual, as if the row were being read; the image drifts inside its frame
 *   (parallax) for as long as it is on screen.
 * - The record's fields (row, type, role, stack, metrics) are written in
 *   from the reading start, mirrored in RTL.
 * - The giant row numeral floats on its own depth.
 * - The query cursor (an Ember dot: the visitor's request) rides the index
 *   spine down the result set.
 *
 * Rebuilt when the filter changes (records come and go), and re-measured
 * when a FLIP layout animation settles.
 * @param {{ filterKey: string }} props
 */
export default function ProjectsDirector({ filterKey }) {
  const { dir } = useLocale();

  useDirector(
    ({ scope, onCleanup }) => {
      const wrap = scope.querySelector('[data-cases]');
      if (!wrap) return;
      const base = sectionTrigger(5);
      // Fields slide in from the reading start (composited transform/opacity;
      // a clip-path per field repainted every scroll frame).
      const fromStart = dir === 'rtl' ? 18 : -18;
      const mm = gsap.matchMedia();

      mm.add(DESKTOP, () => {
        wrap.querySelectorAll('[data-case]').forEach((row) => {
          const frame = row.querySelector('[data-case-frame]');
          const scan = row.querySelector('[data-case-scan]');
          const media = row.querySelector('[data-case-media]');
          const numeral = row.querySelector('[data-case-index]');
          const fields = row.querySelectorAll('[data-case-field]');

          if (frame && scan) {
            const read = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                ...base,
                trigger: frame,
                start: 'top 88%',
                end: 'top 34%',
                scrub: 0.6,
              },
            });
            read
              .fromTo(
                frame,
                { clipPath: 'inset(0% 0% 100% 0%)' },
                { clipPath: 'inset(0% 0% 0% 0%)' },
                0,
              )
              .fromTo(
                scan,
                { y: 0, autoAlpha: 1 },
                { y: () => frame.clientHeight, autoAlpha: 1 },
                0,
              )
              .to(scan, { autoAlpha: 0, duration: 0.08 });
          }
          if (media) {
            gsap.fromTo(
              media,
              { yPercent: -5, scale: 1.1 },
              {
                yPercent: 5,
                scale: 1.1,
                ease: 'none',
                scrollTrigger: {
                  ...base,
                  trigger: row,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }
          if (numeral) {
            gsap.fromTo(
              numeral,
              { yPercent: 35 },
              {
                yPercent: -35,
                ease: 'none',
                scrollTrigger: {
                  ...base,
                  trigger: row,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: true,
                },
              },
            );
          }
          if (fields.length) {
            gsap.fromTo(
              fields,
              { autoAlpha: 0, x: fromStart },
              {
                autoAlpha: 1,
                x: 0,
                ease: 'snap',
                stagger: 0.12,
                scrollTrigger: {
                  ...base,
                  trigger: row,
                  start: 'top 72%',
                  end: 'top 30%',
                  scrub: 0.5,
                },
              },
            );
          }
        });

        const cursor = wrap.querySelector('[data-cases-cursor]');
        if (cursor) {
          gsap.fromTo(
            cursor,
            { y: 0 },
            {
              y: () => wrap.clientHeight,
              ease: 'none',
              scrollTrigger: {
                ...base,
                trigger: wrap,
                start: 'top 60%',
                end: 'bottom 60%',
                scrub: 0.4,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });
      onCleanup(() => mm.revert());

      // Records moved (enter/exit settled after a filter change). Not on
      // EVENTS.layout: every refresh emits that, so it would loop forever.
      let frame = 0;
      const refresh = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      const settle = window.setTimeout(refresh, 800);
      const off = on(EVENTS.casesMoved, refresh);
      onCleanup(() => {
        off();
        window.clearTimeout(settle);
        cancelAnimationFrame(frame);
      });
    },
    { target: 'projects', deps: [dir, filterKey] },
  );

  return null;
}
