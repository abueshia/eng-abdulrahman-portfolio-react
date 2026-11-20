import { useEffect } from 'react';

import { env } from '@/config/env';
import { usePointerFine } from './usePointerFine';
import { useReducedMotion } from './useReducedMotion';

/**
 * Writes the pointer position as CSS variables `--mx` / `--my` (−1…1) on the
 * element, eased with inertia in a single rAF loop: zero React renders.
 * Layers consume them in CSS (tilt, depth parallax) using their own `--d`.
 *
 * Touch devices get a slow autonomous drift instead (no gyroscope: iOS
 * requires a permission prompt for it). Paused off-screen; off under
 * reduced motion.
 *
 * @param {import('react').RefObject<HTMLElement | null>} ref
 */
export function usePointerParallax(ref) {
  const fine = usePointerFine();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !env.fx) return undefined;
    let frame = 0;
    let visible = true;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;

    const loop = (/** @type {number} */ now) => {
      if (!fine) {
        tx = Math.sin(now * 0.00031) * 0.45;
        ty = Math.cos(now * 0.00023) * 0.3;
      }
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      const settled = fine && Math.abs(tx - x) < 0.0005 && Math.abs(ty - y) < 0.0005;
      frame = visible && !settled ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!frame && visible) frame = requestAnimationFrame(loop);
    };
    const onMove = (/** @type {PointerEvent} */ event) => {
      tx = (event.clientX / window.innerWidth - 0.5) * 2;
      ty = (event.clientY / window.innerHeight - 0.5) * 2;
      kick();
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(el);
    if (fine) window.addEventListener('pointermove', onMove, { passive: true });
    else kick();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    };
  }, [ref, fine, reduced]);
}
