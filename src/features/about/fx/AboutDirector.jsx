import { useLocale } from '@/hooks/useLocale';
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

/**
 * About director: the AUTH moment, then the README is read.
 *
 * 1. AUTH (strong moment after the quiet board): the gate is scrubbed by the
 *    scroll as it crosses the viewport. The bearer token is verified glyph
 *    by glyph, the status flips to 200, the lock opens and the doors part
 *    on the welcome. Scrolling back re-locks it.
 * 2. Reading: each block reveals word by word as it crosses the viewport
 *    (words in both languages: Arabic is never split below the word).
 * 3. The code card follows the reader: the line linked to the block being
 *    read is highlighted (CSS owns the highlight; this only flips
 *    `data-active`). On phones the card is a compact sticky strip, scrolled
 *    so the active line sits in view.
 */
export default function AboutDirector() {
  const { dir } = useLocale();

  useDirector(
    ({ scope, onCleanup }) => {
      const sign = dir === 'rtl' ? -1 : 1;
      const base = sectionTrigger(2);
      const q = (/** @type {string} */ s) => scope.querySelector(s);
      const qa = (/** @type {string} */ s) => [...scope.querySelectorAll(s)];

      /* ---------- 1. AUTH ---------- */
      const gate = q('[data-auth]');
      if (gate) {
        // The stage hugs its payload (no sticky hold, no empty band): the
        // scrub spans the gate's passage, from entering low in the viewport
        // to its middle, so the doors part around the centre of the screen.
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            ...base,
            trigger: gate,
            start: 'top 88%',
            end: 'bottom 45%',
            scrub: 0.7,
          },
        });
        tl.fromTo(
          qa('[data-auth-char]'),
          { '--v': 0 },
          { '--v': 1, duration: 0.03, stagger: { each: 0.0055 } },
          0.04,
        )
          .fromTo(q('[data-auth-pending]'), { opacity: 1 }, { opacity: 0, duration: 0.05 }, 0.52)
          .fromTo(
            q('[data-auth-status]'),
            { opacity: 0, y: 6 },
            { opacity: 1, y: 0, duration: 0.06, ease: 'snap' },
            0.55,
          )
          .fromTo(
            q('[data-auth-shackle]'),
            { y: 0, rotate: 0 },
            { y: -5, rotate: -32, svgOrigin: '30 22', duration: 0.1, ease: 'weight' },
            0.56,
          )
          .to(q('[data-auth-core]'), { yPercent: -24, opacity: 0, duration: 0.14 }, 0.7)
          .fromTo(
            q('[data-auth-door="start"]'),
            { xPercent: 0 },
            { xPercent: -101 * sign, duration: 0.26, ease: 'shutter' },
            0.72,
          )
          .fromTo(
            q('[data-auth-door="end"]'),
            { xPercent: 0 },
            { xPercent: 101 * sign, duration: 0.26, ease: 'shutter' },
            0.72,
          )
          .fromTo(
            q('[data-auth-welcome]'),
            { scale: 0.9, opacity: 0.2 },
            { scale: 1, opacity: 1, duration: 0.24, ease: 'ember' },
            0.76,
          );
      }

      /* ---------- 2. reading, word by word ---------- */
      const blocks = /** @type {HTMLElement[]} */ (qa('[data-read]'));
      for (const block of blocks) {
        // A story paragraph, or a principle (its title and description).
        const targets = block.matches('p') ? block : [...block.querySelectorAll('h4, p')];
        const split = SplitText.create(targets, { type: 'words', wordsClass: 'rw' });
        onCleanup(() => split.revert());
        gsap.fromTo(
          split.words,
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.04,
            scrollTrigger: {
              ...base,
              trigger: block,
              start: 'top 84%',
              end: 'bottom 58%',
              scrub: 0.5,
            },
          },
        );
      }

      /* ---------- 3. the code follows the reader ---------- */
      const code = /** @type {HTMLElement | null} */ (q('[data-code]'));
      const scroller = /** @type {HTMLElement | null} */ (q('[data-code-scroller]'));
      if (!code || !scroller) return;
      const compact = window.matchMedia('(max-width: 63.999rem)');

      const focusLine = (/** @type {string} */ key) => {
        if (code.dataset.active === key) return;
        code.dataset.active = key;
        if (!compact.matches) return;
        const viewport = /** @type {HTMLElement} */ (scroller.parentElement?.parentElement);
        const lines = /** @type {HTMLElement[]} */ ([
          ...scroller.querySelectorAll(`[data-line="${key}"]`),
        ]);
        if (!viewport || lines.length === 0) return;
        const first = lines[0].offsetTop;
        const last = lines[lines.length - 1];
        const middle = (first + last.offsetTop + last.offsetHeight) / 2;
        const max = Math.max(0, scroller.offsetHeight - viewport.clientHeight);
        const y = -Math.min(max, Math.max(0, middle - viewport.clientHeight / 2));
        gsap.to(scroller, { y, duration: 0.7, ease: 'ember', overwrite: true });
      };

      blocks.forEach((block, i) => {
        const key = block.dataset.line ?? 'class';
        ScrollTrigger.create({
          ...base,
          trigger: block,
          start: 'top 62%',
          end: 'bottom 62%',
          onToggle: (self) => self.isActive && focusLine(key),
          ...(i === 0
            ? {
                onLeaveBack: () => {
                  delete code.dataset.active;
                  gsap.to(scroller, { y: 0, duration: 0.5, ease: 'ember', overwrite: true });
                },
              }
            : {}),
        });
      });

      // Tweens started from scroll callbacks live outside the context: undo by hand.
      onCleanup(() => {
        gsap.killTweensOf(scroller);
        gsap.set(scroller, { clearProps: 'transform' });
        delete code.dataset.active;
      });
    },
    { target: 'about', deps: [dir] },
  );

  return null;
}
