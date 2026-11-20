import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { stripLocale } from '@/config/routes';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { EVENTS, on } from '@/lib/events';

/**
 * Restores scroll on navigation, Lenis-aware.
 *
 * - New page → jump to top, while the page-transition curtain covers the
 *   screen (so the old page never visibly jumps); immediately on first load
 *   and under reduced motion (no curtain).
 * - URL with a hash → scroll to that section once it exists (sections may be
 *   lazy-loaded, so we poll for a short while instead of failing silently).
 * - Language switch → keep the current position (same page, new language).
 */
export function ScrollManager() {
  const { pathname, hash, state } = useLocation();
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();
  const basePath = stripLocale(pathname);
  const firstRun = useRef(true);

  useEffect(() => {
    const first = firstRun.current;
    firstRun.current = false;
    if (state?.localeSwitch) return undefined;
    if (!hash) {
      if (first || reduced) {
        scrollTo(0, { immediate: true });
        return undefined;
      }
      const toTop = () => scrollTo(0, { immediate: true });
      const off = on(EVENTS.covered, toTop);
      const fallback = window.setTimeout(toTop, 1200);
      return () => {
        off();
        window.clearTimeout(fallback);
      };
    }

    let attempts = 0;
    let frame = 0;
    const tryScroll = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        scrollTo(el);
      } else if (attempts++ < 60) {
        frame = requestAnimationFrame(tryScroll);
      }
    };
    frame = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(frame);
    // Intentionally keyed on the locale-agnostic path + hash only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, hash]);

  return null;
}
