import { useEffect, useState } from 'react';

/**
 * Tracks coarse scroll state for chrome UI (navbar).
 *
 * Only two booleans are exposed and state updates happen solely when they
 * flip, so scrolling never causes per-frame React renders.
 *
 * @param {Object} [options]
 * @param {number} [options.threshold=24]   Distance before `scrolled` becomes true.
 * @param {number} [options.hideAfter=320]  Distance before hiding on downward scroll is allowed.
 * @returns {{ scrolled: boolean, hidden: boolean }}
 */
export function useScrollState({ threshold = 24, hideAfter = 320 } = {}) {
  const [state, setState] = useState({ scrolled: false, hidden: false });

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      setState((prev) => {
        const scrolled = y > threshold;
        // Ignore micro-movements so the bar doesn't flicker on trackpads.
        const hidden = Math.abs(delta) < 6 ? prev.hidden : delta > 0 && y > hideAfter;
        return prev.scrolled === scrolled && prev.hidden === hidden ? prev : { scrolled, hidden };
      });
      lastY = y;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, hideAfter]);

  return state;
}
