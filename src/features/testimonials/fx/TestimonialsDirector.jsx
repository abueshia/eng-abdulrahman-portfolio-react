import { useLocale } from '@/hooks/useLocale';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/**
 * Testimonials director: the REVIEW station runs its checks.
 *
 * As the PR header scrolls through, each check passes in turn (its tick
 * draws, the row fills from the reading start), scrubbed. The PR state reads
 * "Review requested" until every check has passed, then flips to "Approved";
 * scrolling back un-approves it. Without the director the PR is approved.
 */
export default function TestimonialsDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope, onCleanup }) => {
      const pr = scope.querySelector('[data-pr]');
      if (!pr) return;
      const base = sectionTrigger(7);
      const origin = dir === 'rtl' ? '100% 50%' : '0% 50%';
      const checks = pr.querySelectorAll('[data-pr-check]');
      const state = /** @type {HTMLElement | null} */ (pr.querySelector('[data-pr-state]'));

      if (checks.length) {
        gsap.fromTo(
          checks,
          { '--fill': 0, '--tick': 0 },
          {
            '--fill': 1,
            '--tick': 1,
            ease: 'snap',
            stagger: 0.18,
            scrollTrigger: { ...base, trigger: pr, start: 'top 80%', end: 'top 35%', scrub: 0.5 },
          },
        );
        checks.forEach((check) =>
          /** @type {HTMLElement} */ (check).style.setProperty('--origin', origin),
        );
      }

      if (state) {
        state.dataset.approved = 'false';
        ScrollTrigger.create({
          ...base,
          trigger: pr,
          start: 'top 35%',
          end: 'max',
          onToggle: (self) => {
            state.dataset.approved = self.isActive ? 'true' : 'false';
          },
        });
        onCleanup(() => delete state.dataset.approved);
      }
      onCleanup(() =>
        checks.forEach((check) =>
          /** @type {HTMLElement} */ (check).style.removeProperty('--origin'),
        ),
      );
    },
    { target: 'testimonials', deps: [dir] },
  );

  return null;
}
