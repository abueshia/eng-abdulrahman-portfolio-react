import { useLocale } from '@/hooks/useLocale';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/** Viewport line where routes get registered (the scan line rides it). */
const LINE = 'top 68%';

/**
 * Services director: the ENDPOINTS station registers its routes.
 *
 * - A scan line runs down the route table with the scroll, like
 *   `route:list` printing. Each route it reaches goes live (its method badge
 *   lights up) and its dotted leader draws from the reading start toward
 *   the title. Scrolling back un-registers them.
 * - The group index marks the prefix whose routes are being read.
 *
 * Without the director every route is already live (the final state).
 */
export default function ServicesDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope, onCleanup }) => {
      const table = scope.querySelector('.routes__table');
      if (!table) return;
      const base = sectionTrigger(6);
      const origin = dir === 'rtl' ? '100% 50%' : '0% 50%';

      const scan = table.querySelector('[data-routes-scan]');
      if (scan) {
        gsap.fromTo(
          scan,
          { y: 0, autoAlpha: 1 },
          {
            y: () => table.clientHeight,
            ease: 'none',
            scrollTrigger: {
              ...base,
              trigger: table,
              start: LINE,
              end: 'bottom 68%',
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          },
        );
      }

      /** @type {HTMLElement[]} */
      const touched = [];
      table.querySelectorAll('[data-route]').forEach((node) => {
        const route = /** @type {HTMLElement} */ (node);
        touched.push(route);
        route.dataset.live = 'false';
        ScrollTrigger.create({
          ...base,
          trigger: route,
          start: LINE,
          end: 'max',
          onToggle: (self) => {
            route.dataset.live = self.isActive ? 'true' : 'false';
          },
        });
        const leader = route.querySelector('[data-route-leader]');
        if (leader) {
          gsap.fromTo(
            leader,
            { scaleX: 0, transformOrigin: origin },
            {
              scaleX: 1,
              ease: 'snap',
              scrollTrigger: { ...base, trigger: route, start: 'top 90%', end: LINE, scrub: 0.5 },
            },
          );
        }
      });

      /** @type {HTMLElement[]} */
      const links = [...scope.querySelectorAll('[data-routes-link]')].map(
        (link) => /** @type {HTMLElement} */ (link),
      );
      table.querySelectorAll('[data-routes-group]').forEach((node) => {
        const group = /** @type {HTMLElement} */ (node);
        ScrollTrigger.create({
          ...base,
          trigger: group,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => {
            const link = links.find((l) => l.dataset.routesLink === group.dataset.routesGroup);
            if (link) link.dataset.active = self.isActive ? 'true' : 'false';
          },
        });
      });

      // Attributes written from scroll callbacks live outside the GSAP context.
      onCleanup(() => {
        touched.forEach((route) => delete route.dataset.live);
        links.forEach((link) => delete link.dataset.active);
      });
    },
    { target: 'services', deps: [dir] },
  );

  return null;
}
