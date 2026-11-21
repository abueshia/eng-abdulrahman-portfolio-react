import { useLocale } from '@/hooks/useLocale';
import { gsap } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/** Viewport line where the graph is "being written" (rows and HEAD share it). */
const WRITE_LINE = 'top 70%';

/**
 * Experience director: the log is written as the request moves through the queue.
 *
 * - Each row draws when it reaches the write line: incoming lane segments
 *   grow down to the node, the node lands, fork/merge curves trace, then the
 *   outgoing segments continue and the `+` lines type in from the reading
 *   start (mirrored in RTL).
 * - HEAD, an Ember dot (the visitor's request), rides `main` against the same
 *   line, so it reaches every commit exactly as it is drawn.
 * All scrubbed: scrolling back un-writes the log.
 */
export default function ExperienceDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope }) => {
      const log = scope.querySelector('[data-gl]');
      if (!log) return;
      const base = sectionTrigger(4);
      const hidden = dir === 'rtl' ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';

      log.querySelectorAll('[data-gl-row]').forEach((row) => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            ...base,
            trigger: row,
            start: WRITE_LINE,
            end: 'bottom 70%',
            scrub: 0.5,
          },
        });
        /** Adds a step only when the row has something to draw for it. */
        const step = (
          /** @type {string} */ selector,
          /** @type {gsap.TweenVars} */ from,
          /** @type {gsap.TweenVars} */ to,
          /** @type {number} */ at,
        ) => {
          const targets = row.querySelectorAll(selector);
          if (targets.length) tl.fromTo(targets, from, to, at);
        };
        const grow = { scaleY: 1, transformOrigin: '50% 0%' };
        step('[data-gl-seg="in"]', { scaleY: 0 }, { ...grow, duration: 0.12 }, 0);
        // Lanes passing straight through the row draw across all of it.
        step('[data-gl-seg="through"]', { scaleY: 0 }, { ...grow, duration: 1 }, 0);
        step('[data-gl-node]', { scale: 0 }, { scale: 1, duration: 0.08, ease: 'weight' }, 0.1);
        step(
          '[data-gl-curve]',
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.2 },
          0.14,
        );
        step('[data-gl-seg="out"]', { scaleY: 0 }, { ...grow, duration: 0.8 }, 0.2);
        step(
          '[data-gl-add]',
          { clipPath: hidden },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.22, stagger: 0.12, ease: 'snap' },
          0.16,
        );
      });

      const head = log.querySelector('[data-gl-headdot]');
      if (head) {
        gsap.fromTo(
          head,
          { y: 0 },
          {
            y: () => log.clientHeight,
            ease: 'none',
            scrollTrigger: {
              ...base,
              trigger: log,
              start: WRITE_LINE,
              end: 'bottom 70%',
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );
      }
    },
    { target: 'experience', deps: [dir] },
  );

  return null;
}
