import { useLocale } from '@/hooks/useLocale';
import { gsap } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/**
 * Contact director: a light word-by-word reveal of the headline.
 *
 * The words rise out of their line masks one after another as the intro
 * arrives (scrubbed over a short distance, so scrolling back lowers them
 * again). Word level in both languages: Arabic is never split below the word.
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
          { yPercent: 105 },
          {
            yPercent: 0,
            ease: 'ember',
            stagger: 0.06,
            scrollTrigger: {
              ...base,
              trigger: title,
              start: 'top 95%',
              end: 'bottom 70%',
              scrub: 0.5,
            },
          },
        );
      }
    },
    { target: 'contact', deps: [dir] },
  );

  return null;
}
