import { useEffect } from 'react';

import { env } from '@/config/env';
import { usePointerFine } from './usePointerFine';
import { useReducedMotion } from './useReducedMotion';

/**
 * Magnetic pull: the element leans toward the pointer while it hovers its
 * (padded) hit area and springs back on leave. Written straight to
 * `style.transform` inside rAF, so hovering never re-renders React.
 *
 * Mouse/trackpad only and off under reduced motion. Apply it to a wrapper,
 * not to an element whose `transform` is already owned by CSS or GSAP.
 *
 * @param {import('react').RefObject<HTMLElement | null>} ref
 * @param {{ strength?: number }} [options] Fraction of the pointer offset to follow.
 */
export function useMagnetic(ref, { strength = 0.3 } = {}) {
  const fine = usePointerFine();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduced || !env.fx) return undefined;
    let frame = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;

    const loop = () => {
      // Spring-ish follow: quick to engage, softer to release.
      const k = tx === 0 && ty === 0 ? 0.12 : 0.2;
      x += (tx - x) * k;
      y += (ty - y) * k;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      frame = Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const onMove = (/** @type {PointerEvent} */ event) => {
      const rect = el.getBoundingClientRect();
      tx = (event.clientX - (rect.left + rect.width / 2)) * strength;
      ty = (event.clientY - (rect.top + rect.height / 2)) * strength;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      kick();
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
    };
  }, [ref, fine, reduced, strength]);
}
