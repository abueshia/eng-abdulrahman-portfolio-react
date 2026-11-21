import { deviceTier } from '@/lib/device';
import { gsap } from '@/lib/gsap';
import { sectionTrigger, useDirector } from '@/lib/use-director';

const MAX_TILT = 6; // degrees (motion rule: tilt never exceeds 6°)

/**
 * Skills director: the services spin up.
 *
 * - Scroll (scrubbed, reversible): the core ignites, then each orbit expands
 *   out of it, inner to outer, its services lighting up as it lands.
 * - Pointer (fine pointers, not on low-tier devices): the constellation
 *   tilts toward the cursor. A direct rAF loop writes `--rx`/`--ry` (no React
 *   renders), sleeps once settled and stops while the section is off-screen.
 */
export default function SkillsDirector() {
  useDirector(
    ({ scope, onCleanup }) => {
      const stage = scope.querySelector('[data-cst]');
      if (!stage) return;
      const base = sectionTrigger(3);

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { ...base, trigger: stage, start: 'top 88%', end: 'center 58%', scrub: 0.8 },
      });
      tl.fromTo(
        scope.querySelector('[data-cst-core]'),
        { scale: 0.35, opacity: 0 },
        { scale: 1, opacity: 1, svgOrigin: '0 0', duration: 0.3, ease: 'weight' },
        0,
      );
      scope.querySelectorAll('[data-cst-orbit]').forEach((orbit, k) => {
        tl.fromTo(
          orbit,
          { scale: 0.2, opacity: 0 },
          { scale: 1, opacity: 1, svgOrigin: '0 0', duration: 0.45, ease: 'ember' },
          0.14 + k * 0.1,
        ).fromTo(
          orbit.querySelectorAll('[data-cst-node]'),
          { scale: 0 },
          { scale: 1, svgOrigin: '0 0', duration: 0.25, stagger: 0.03, ease: 'weight' },
          0.32 + k * 0.1,
        );
      });

      /* ---------- pointer tilt ---------- */
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const tilt = /** @type {HTMLElement | null} */ (stage.querySelector('[data-cst-tilt]'));
      if (!fine || !tilt || deviceTier.get() === 'low') return;

      const state = { x: 0, y: 0, tx: 0, ty: 0 };
      let frame = 0;
      let visible = false;
      const step = () => {
        frame = 0;
        state.x += (state.tx - state.x) * 0.08;
        state.y += (state.ty - state.y) * 0.08;
        tilt.style.setProperty('--rx', `${(state.y * MAX_TILT).toFixed(3)}deg`);
        tilt.style.setProperty('--ry', `${(-state.x * MAX_TILT).toFixed(3)}deg`);
        const settled =
          Math.abs(state.tx - state.x) < 0.001 && Math.abs(state.ty - state.y) < 0.001;
        if (!settled && visible) frame = requestAnimationFrame(step);
      };
      const kick = () => {
        if (!frame && visible) frame = requestAnimationFrame(step);
      };
      const onMove = (/** @type {PointerEvent} */ event) => {
        const rect = stage.getBoundingClientRect();
        state.tx = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
        state.ty = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
        kick();
      };
      const onLeave = () => {
        state.tx = 0;
        state.ty = 0;
        kick();
      };
      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      });
      observer.observe(stage);
      stage.addEventListener('pointermove', /** @type {EventListener} */ (onMove));
      stage.addEventListener('pointerleave', onLeave);
      onCleanup(() => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        stage.removeEventListener('pointermove', /** @type {EventListener} */ (onMove));
        stage.removeEventListener('pointerleave', onLeave);
        tilt.style.removeProperty('--rx');
        tilt.style.removeProperty('--ry');
      });
    },
    { target: 'skills' },
  );

  return null;
}
