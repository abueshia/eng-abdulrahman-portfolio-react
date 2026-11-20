import { useGSAP } from '@gsap/react';
import { useTranslation } from 'react-i18next';

import { bootStore, markBootReady } from '@/features/intro/boot-store';
import { journeyStore } from '@/features/journey/journey-store';
import { useLocale } from '@/hooks/useLocale';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { EVENTS, emit } from '@/lib/events';
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap';

const SCRAMBLE_CHARS = '<>/{}$#_';

/**
 * Hero choreography (lazy chunk, client-only; GSAP lives here, never in the
 * initial bundle). It attaches motion to the prerendered hero DOM; it
 * renders nothing itself.
 *
 * 1. Entrance, only when the boot intro handed over (phase `revealing`):
 *    - EN: every letter decodes from symbols (<>/{}$#) into place, Ember
 *      cooling to ink; the outlined surname draws in from the inline start,
 *      flashes solid, then returns to its outline.
 *    - AR: word by word (never letters: Arabic joins must stay intact), each
 *      word rising out of a mask through a blur.
 *    - Camera settle on the portrait, a scan line turns the dot-matrix
 *      silhouette into the photograph, badges and terminal land.
 *    Without the intro (returning visitor) nothing is hidden: the name
 *    painted by the server stays exactly where it is.
 *
 * 2. Signature scroll moment, "the gateway accepts the request" (desktop:
 *    pinned and scrubbed): the name splits apart, letters spreading, the
 *    portrait recedes as its rings open, and a transmission line decodes
 *    the forward to the next station while the mesh camera starts to follow
 *    the request. Tablets/phones: a lighter unpinned parallax.
 *
 * 3. Life: hovering a letter re-decodes it (mouse only); the marquee skews
 *    with scroll velocity.
 *
 * Reduced motion: this module is not loaded at all.
 */
export default function HeroDirector() {
  const { t } = useTranslation();
  const { locale, dir } = useLocale();
  const { lenisRef } = useSmoothScroll();

  useGSAP(
    (_context, contextSafe) => {
      const hero = document.getElementById('hero');
      if (!hero || !contextSafe) return undefined;
      const sign = dir === 'rtl' ? -1 : 1;
      const arabic = locale === 'ar';
      // Missing optional targets resolve to [] (GSAP ignores empty targets silently).
      const q = (/** @type {string} */ s) => hero.querySelector(s) ?? [];
      const qa = (/** @type {string} */ s) =>
        /** @type {HTMLElement[]} */ ([...hero.querySelectorAll(s)]);
      const one = (/** @type {string} */ s) =>
        /** @type {HTMLElement | null} */ (hero.querySelector(s));

      const first = one('[data-line="first"]');
      const last = one('[data-line="last"]');
      const stage = one('[data-hero-stage]');
      const portrait = one('.portrait');
      if (!first || !last || !stage || !portrait) return undefined;

      const phaseAtLoad = bootStore.get().phase;
      const entrance = phaseAtLoad === 'pending' || phaseAtLoad === 'running';
      /** @type {Array<() => void>} */
      const cleanups = [];

      // Hide what the entrance will reveal (we are still under the boot overlay).
      // Only inner elements, `visibility` and `clipPath` are touched here: the
      // scroll scene animates the outer wrappers, `opacity` and `x`, so the
      // two timelines never fight over a property.
      const hidden = [
        ...qa('[data-hero-reveal]'),
        one('[data-portrait-settle]'),
        one('[data-terminal-inner]'),
        one('[data-marquee-inner]'),
        ...qa('[data-portrait-badge]'),
        one('[data-rings-svg]'),
        one('[data-hero-cue]'),
        first,
        last,
      ].filter(Boolean);
      if (entrance) {
        gsap.set(qa('[data-hero-reveal]'), { autoAlpha: 0, y: 28 });
        gsap.set(q('[data-portrait-settle]'), { scale: 1.1, yPercent: 4, autoAlpha: 0 });
        gsap.set(q('[data-terminal-inner]'), { autoAlpha: 0, y: 36, rotateX: -14 });
        gsap.set(q('[data-marquee-inner]'), { autoAlpha: 0, yPercent: 70 });
        gsap.set(qa('[data-portrait-badge]'), { autoAlpha: 0, scale: 0.6 });
        gsap.set(q('[data-rings-svg]'), { autoAlpha: 0, rotate: -50, scale: 0.86 });
        gsap.set(q('[data-hero-cue]'), { autoAlpha: 0 });
        gsap.set(last, { clipPath: sign > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' });
        gsap.set(first, { visibility: 'hidden' });
      }

      const setup = contextSafe(() => {
        /** @type {HTMLElement[]} */
        let chars = [];
        /** @type {HTMLElement[]} */
        let words = [];
        if (arabic) {
          words = SplitText.create([first, last], {
            type: 'words',
            wordsClass: 'hn-word',
            mask: 'words',
            aria: 'auto',
          }).words;
        } else {
          chars = SplitText.create(first, {
            type: 'chars',
            charsClass: 'hn-char',
            aria: 'auto',
          }).chars;
          // Freeze each glyph box: scrambling symbols must never reflow the line.
          for (const char of chars) char.style.width = `${char.getBoundingClientRect().width}px`;
        }

        /* ---------- 1. entrance ---------- */
        const play = () => {
          const ember = getComputedStyle(document.documentElement).getPropertyValue('--accent');
          const ink = getComputedStyle(first).color;
          const tl = gsap.timeline({ defaults: { ease: 'ember' } });
          tl.set(first, { visibility: 'visible' }, 0);
          if (arabic) {
            tl.from(
              words,
              { yPercent: 118, filter: 'blur(14px)', autoAlpha: 0, duration: 1.2, stagger: 0.13 },
              0.05,
            );
          } else {
            tl.set(chars, { color: ember.trim() || ink }, 0)
              .to(
                chars,
                {
                  duration: 1.05,
                  stagger: 0.04,
                  scrambleText: {
                    text: '{original}',
                    chars: SCRAMBLE_CHARS,
                    revealDelay: 0.42,
                    speed: 0.85,
                  },
                  ease: 'none',
                },
                0.04,
              )
              .to(
                chars,
                { color: ink, duration: 0.7, stagger: 0.04, ease: 'drift', clearProps: 'color' },
                0.55,
              );
          }
          tl.to(
            last,
            {
              clipPath: 'inset(0 0% 0 0%)',
              duration: 1.15,
              ease: 'shutter',
              clearProps: 'clipPath',
            },
            0.5,
          );
          // The outline fills solid for a beat, then lets the portrait show through again.
          tl.to(last, { '--fill': 1, duration: 0.32, ease: 'snap' }, 1.45).to(
            last,
            { '--fill': 0, duration: 0.9, ease: 'drift' },
            1.8,
          );
          tl.to(
            q('[data-portrait-settle]'),
            { scale: 1, yPercent: 0, autoAlpha: 1, duration: 1.9, ease: 'weight' },
            0,
          )
            .to(q('[data-rings-svg]'), { autoAlpha: 1, rotate: 0, scale: 1, duration: 2.2 }, 0.15)
            .set(portrait, { attr: { 'data-scanning': 'true' } }, 0.35)
            .fromTo(
              q('[data-portrait-figure]'),
              { '--scan': '0%' },
              { '--scan': '100%', duration: 1.6, ease: 'shutter' },
              0.35,
            )
            .set(portrait, { attr: { 'data-scanning': 'false', 'data-scanned': 'true' } }, 1.95)
            .to(qa('[data-hero-reveal]'), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.09 }, 0.85)
            .to(
              qa('[data-portrait-badge]'),
              { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.07, ease: 'weight' },
              1.15,
            )
            .to(q('[data-terminal-inner]'), { autoAlpha: 1, y: 0, rotateX: 0, duration: 1.1 }, 1.05)
            .to(q('[data-marquee-inner]'), { autoAlpha: 1, yPercent: 0, duration: 1.2 }, 1.3)
            .to(q('[data-hero-cue]'), { autoAlpha: 1, duration: 0.8 }, 2.1);
        };

        if (entrance) {
          const phase = bootStore.get().phase;
          if (phase === 'revealing' || phase === 'done') play();
          else {
            const off = bootStore.subscribe(() => {
              if (bootStore.get().phase !== 'revealing') return;
              off();
              play();
            });
            cleanups.push(off);
          }
        } else {
          portrait.dataset.scanned = 'true';
        }

        /* ---------- 2. scroll: the gateway accepts the request ---------- */
        const transmit = q('[data-hero-transmit]');
        const stops = journeyStore.get().stops;
        const nextStation = stops.find((stop) => stop.id !== 'gateway')?.id;
        const transmitText = t('hero.transmit', { station: nextStation ?? 'response' });

        const mm = gsap.matchMedia();
        mm.add('(min-width: 64rem)', () => {
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: '+=75%',
              pin: stage,
              scrub: 0.9,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          tl.to(first, { xPercent: -7 * sign, opacity: 0.14 }, 0).to(
            last,
            { xPercent: 9 * sign },
            0,
          );
          if (chars.length) {
            const mid = (chars.length - 1) / 2;
            tl.to(chars, { x: (i) => (i - mid) * 16 * sign }, 0);
          }
          if (words.length) tl.to(words, { x: (i) => (i % 2 ? 1 : -1) * 36 * sign }, 0);
          tl.to(portrait, { scale: 0.84, yPercent: 7 }, 0)
            .to(q('[data-rings-scroll]'), { rotate: 80 * sign, scale: 1.28, ease: 'drift' }, 0)
            .to(q('[data-hero-copy]'), { y: -48, autoAlpha: 0 }, 0.05)
            .to(q('[data-hero-status]'), { autoAlpha: 0 }, 0)
            .to(q('[data-hero-terminal]'), { y: 90, autoAlpha: 0 }, 0.05)
            .to(q('[data-hero-marquee]'), { yPercent: 110, opacity: 0 }, 0);
          if (transmit) {
            tl.fromTo(
              transmit,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, duration: 0.25 },
              0.35,
            ).to(
              transmit.querySelector('[data-transmit-text]'),
              {
                duration: 0.5,
                scrambleText: { text: transmitText, chars: SCRAMBLE_CHARS, speed: 0.6 },
              },
              0.4,
            );
          }
        });
        mm.add('(max-width: 63.999rem)', () => {
          const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
          gsap.to(first, { xPercent: -6 * sign, ease: 'none', scrollTrigger: scrub });
          gsap.to(last, { xPercent: 6 * sign, ease: 'none', scrollTrigger: scrub });
          gsap.to(portrait, { yPercent: -8, scale: 0.94, ease: 'none', scrollTrigger: scrub });
        });

        /* ---------- 3. life ---------- */
        if (!arabic && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          const decode = (/** @type {Event} */ event) => {
            const char = /** @type {HTMLElement} */ (event.currentTarget);
            if (gsap.isTweening(char)) return;
            gsap.to(char, {
              duration: 0.55,
              scrambleText: { text: '{original}', chars: SCRAMBLE_CHARS, speed: 1 },
            });
          };
          for (const char of chars) char.addEventListener('pointerenter', decode);
          cleanups.push(() =>
            chars.forEach((char) => char.removeEventListener('pointerenter', decode)),
          );
        }

        const marquee = q('[data-hero-marquee]');
        if (marquee) {
          const skew = gsap.quickTo(marquee, 'skewX', { duration: 0.6, ease: 'ember' });
          ScrollTrigger.create({
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            onUpdate: (self) => skew(gsap.utils.clamp(-7, 7, self.getVelocity() / -320)),
            onLeave: () => skew(0),
          });
        }

        // Lenis drives the scroll position; keep ScrollTrigger in the same frame.
        const lenis = lenisRef.current;
        if (lenis) {
          const off = lenis.on('scroll', ScrollTrigger.update);
          cleanups.push(() =>
            typeof off === 'function' ? off() : lenis.off?.('scroll', ScrollTrigger.update),
          );
        }

        // Pinning changes the document height: tell the journey tracker to re-measure.
        const onRefresh = () => emit(EVENTS.layout);
        ScrollTrigger.addEventListener('refresh', onRefresh);
        cleanups.push(() => ScrollTrigger.removeEventListener('refresh', onRefresh));
        ScrollTrigger.refresh();
        markBootReady('director');
      });

      // Never leave the hero hidden if something goes wrong while setting up.
      const safeSetup = () => {
        try {
          setup();
        } catch (error) {
          console.error(error);
          gsap.set(hidden, { clearProps: 'opacity,visibility,transform,clipPath' });
          markBootReady('director');
        }
      };
      // Glyph widths must be measured with the real font.
      if (!document.fonts || document.fonts.status === 'loaded') safeSetup();
      else document.fonts.ready.then(safeSetup);

      return () => cleanups.forEach((cleanup) => cleanup());
    },
    { dependencies: [locale, dir], revertOnUpdate: true },
  );

  return null;
}
