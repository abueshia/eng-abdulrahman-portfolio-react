import { gsap } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';
import { useLocale } from '@/hooks/useLocale';
import { reelOffset } from '../lib/metrics';

/**
 * Stats director: the board is queried as the request passes the tap.
 *
 * Quiet by design (it sits between the hero and the AUTH moment): every move
 * is scrubbed, so it runs forwards and backwards with the scroll and nothing
 * plays once and dies.
 *  - A refresh scan sweeps across the whole board.
 *  - Each panel renders top-down like a dashboard loading its query, then its
 *    series draws and its odometer columns roll, each on its own.
 */
export default function StatsDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope, onCleanup }) => {
      const sign = dir === 'rtl' ? -1 : 1;
      const board = scope.querySelector('[data-stats-board]');
      if (!board) return;
      const base = sectionTrigger(1);

      const scan = board.querySelector('[data-stats-scan]');
      if (scan) {
        gsap.fromTo(
          scan,
          { x: 0, opacity: 0 },
          {
            x: () => board.clientWidth * sign,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              ...base,
              trigger: board,
              start: 'top 75%',
              end: 'bottom 40%',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      board.querySelectorAll('[data-panel]').forEach((panel, i) => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            ...base,
            trigger: panel,
            start: 'top 92%',
            end: 'top 48%',
            scrub: 0.8,
          },
        });
        tl.fromTo(
          panel,
          { clipPath: 'inset(0% 0% 100% 0% round 1.25rem)' },
          { clipPath: 'inset(0% 0% 0% 0% round 1.25rem)', duration: 0.45, ease: 'shutter' },
          i * 0.03,
        );
        const line = panel.querySelector('[data-spark-line]');
        if (line)
          tl.fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5 }, 0.3);
        const area = panel.querySelector('[data-spark-area]');
        if (area) tl.fromTo(area, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.55);

        const odo = panel.querySelector('[data-odo]');
        if (odo) {
          // Not a GSAP property, so the context won't revert it: undo it by hand.
          const odoEl = /** @type {HTMLElement} */ (odo);
          odoEl.dataset.live = 'true';
          onCleanup(() => delete odoEl.dataset.live);
          odo.querySelectorAll('.odo__col').forEach((col, c) => {
            const digit = Number(/** @type {HTMLElement} */ (col).dataset.digit);
            tl.fromTo(
              col.querySelector('.odo__reel'),
              { yPercent: 0 },
              { yPercent: reelOffset(digit), duration: 0.55, ease: 'ember' },
              0.2 + c * 0.08,
            );
          });
        }
      });
    },
    { target: 'stats', deps: [dir] },
  );

  return null;
}
