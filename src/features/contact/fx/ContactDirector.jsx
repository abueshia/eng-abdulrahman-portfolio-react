import { useLocale } from '@/hooks/useLocale';
import { gsap } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/**
 * Contact director: the headline is set in motion by the scroll.
 *
 * - The words of the kinetic headline rise out of their line masks one after
 *   another as the section arrives, with a slight skew that settles to
 *   upright (scrubbed, so scrolling back lowers them again). Word level in
 *   both languages: Arabic is never split below the word.
 * - The route chips light up in journey order toward "you are here".
 */
export default function ContactDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope }) => {
      const base = sectionTrigger(10);
      const title = scope.querySelector('[data-contact-title]');
      const words = scope.querySelectorAll('[data-kin]');
      if (title && words.length) {
        gsap.fromTo(
          words,
          { yPercent: 110, skewY: dir === 'rtl' ? -7 : 7 },
          {
            yPercent: 0,
            skewY: 0,
            ease: 'ember',
            stagger: 0.08,
            scrollTrigger: {
              ...base,
              trigger: title,
              start: 'top 92%',
              end: 'bottom 55%',
              scrub: 0.6,
            },
          },
        );
      }

      const stops = scope.querySelectorAll('.hops__stop');
      if (stops.length) {
        gsap.fromTo(
          stops,
          { '--lit': 0 },
          {
            '--lit': 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: {
              ...base,
              trigger: scope.querySelector('.hops'),
              start: 'top 85%',
              end: 'top 45%',
              scrub: 0.4,
            },
          },
        );
      }
    },
    { target: 'contact', deps: [dir] },
  );

  return null;
}
