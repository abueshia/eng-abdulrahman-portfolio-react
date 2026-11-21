import { useLocale } from '@/hooks/useLocale';
import { gsap } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/**
 * Blog director (home): the DOCS station writes its changelog.
 *
 * Each note's huge title inks in from the reading start as it crosses the
 * reading line (the ink is a text-clipped background whose width the scroll
 * drives; the outline stays underneath). `dir` decides where the ink starts
 * (CSS mirrors the background position in RTL). Scrubbed: scrolling back un-writes them.
 */
export default function BlogDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope }) => {
      const base = sectionTrigger(8);
      scope.querySelectorAll('[data-note]').forEach((note) => {
        const title = note.querySelector('[data-note-title]');
        if (!title) return;
        gsap.fromTo(
          title,
          { '--ink': '0%' },
          {
            '--ink': '100%',
            ease: 'none',
            scrollTrigger: { ...base, trigger: note, start: 'top 85%', end: 'top 45%', scrub: 0.5 },
          },
        );
      });
    },
    { target: 'blog', deps: [dir] },
  );

  return null;
}
