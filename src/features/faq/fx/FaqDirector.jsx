import { gsap, ScrollTrigger } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/**
 * FAQ director: the man page is read like `less`.
 *
 * - The pager line reports where the reader is (`line n/N (x%)`, `(END)` at
 *   the bottom), written straight to the DOM from the scroll.
 * - The option flags (`-1`, `-2`…) light up as their entry crosses the
 *   reading line, and dim again when scrolled back above it (scrubbed).
 *
 * @param {{ total: number }} props
 */
export default function FaqDirector({ total }) {
  useDirector(
    ({ scope, onCleanup }) => {
      const man = scope.querySelector('[data-man]');
      const pager = scope.querySelector('[data-man-pager]');
      if (!man) return;
      const base = sectionTrigger(9);
      const initial = pager?.textContent ?? '';

      if (pager) {
        ScrollTrigger.create({
          ...base,
          trigger: man,
          start: 'top 70%',
          end: 'bottom 70%',
          onUpdate: (self) => {
            const pct = Math.round(self.progress * 100);
            const line = Math.min(total, Math.max(1, Math.ceil(self.progress * total)));
            pager.textContent =
              pct >= 100 ? `line ${total}/${total} (END)` : `line ${line}/${total} ${pct}%`;
          },
        });
        onCleanup(() => {
          pager.textContent = initial;
        });
      }

      man.querySelectorAll('[data-man-entry]').forEach((entry) => {
        const flag = entry.querySelector('.man__opt');
        if (!flag) return;
        gsap.fromTo(
          flag,
          { '--lit': 0 },
          {
            '--lit': 1,
            ease: 'none',
            scrollTrigger: {
              ...base,
              trigger: entry,
              start: 'top 80%',
              end: 'top 55%',
              scrub: 0.4,
            },
          },
        );
      });
    },
    { target: 'faq', deps: [total] },
  );

  return null;
}
