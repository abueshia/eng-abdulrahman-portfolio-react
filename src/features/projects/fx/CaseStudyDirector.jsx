import { useLocale } from '@/hooks/useLocale';
import { gsap } from '@/lib/gsap';
import { useDirector } from '@/lib/use-director';

/**
 * Case-study director. Everything is scrubbed, so scrolling back rewinds it.
 *
 * - The record closes as you read on: the cover's frame insets into a
 *   rounded card while the image drifts deeper (the header the View
 *   Transition delivered settles into the page).
 * - Request → response: the wire between problem and solution fills from the
 *   reading start.
 * - The architecture boots row by row: node outlines draw, then the request
 *   traces run along the synchronous and real-time edges.
 * - Each challenge is an incident that gets struck through as "resolved"
 *   when it crosses the middle of the screen.
 * - "Next case →": the giant title fills with Ember from the reading start
 *   as the page runs out.
 */
export default function CaseStudyDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope }) => {
      const rtl = dir === 'rtl';
      const hidden = rtl ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
      const shown = 'inset(0% 0% 0% 0%)';
      const origin = rtl ? '100% 50%' : '0% 50%';

      const cover = scope.querySelector('[data-cs-cover]');
      const frame = scope.querySelector('[data-cs-cover-frame]');
      const image = scope.querySelector('[data-cs-cover-img]');
      if (cover && frame && image) {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: cover, start: 'top 40%', end: 'bottom top', scrub: 0.6 },
        });
        tl.fromTo(
          frame,
          { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
          { clipPath: 'inset(6% 5% 6% 5% round 28px)' },
          0,
        ).fromTo(image, { yPercent: 0, scale: 1 }, { yPercent: 10, scale: 1.08 }, 0);
      }

      const wire = scope.querySelector('[data-cs-wire]');
      if (wire) {
        gsap.fromTo(
          wire,
          { scaleX: 0, transformOrigin: origin },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: wire, start: 'top 85%', end: 'top 35%', scrub: 0.5 },
          },
        );
      }

      const arch = scope.querySelector('[data-arch]');
      if (arch) {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: arch, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
        });
        tl.fromTo(
          arch.querySelectorAll('[data-arch-outline]'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, stagger: 0.06, duration: 0.5, ease: 'snap' },
          0,
        ).fromTo(
          arch.querySelectorAll('[data-arch-trace]'),
          { strokeDashoffset: 1 },
          { strokeDashoffset: 0, stagger: 0.05, duration: 0.4 },
          0.25,
        );
      }

      scope.querySelectorAll('[data-cs-incident]').forEach((incident) => {
        const strike = incident.querySelector('[data-cs-strike]');
        if (!strike) return;
        gsap.fromTo(
          strike,
          { scaleX: 0, transformOrigin: origin },
          {
            scaleX: 1,
            ease: 'snap',
            scrollTrigger: { trigger: incident, start: 'top 70%', end: 'top 45%', scrub: 0.4 },
          },
        );
      });

      const fill = scope.querySelector('[data-cs-next-fill]');
      if (fill) {
        gsap.fromTo(
          fill,
          { clipPath: hidden },
          {
            clipPath: shown,
            ease: 'none',
            scrollTrigger: { trigger: fill, start: 'top bottom', end: 'bottom 75%', scrub: 0.5 },
          },
        );
      }
    },
    { target: 'case-study', deps: [dir] },
  );

  return null;
}
