import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { stripLocale } from '@/config/routes';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

/**
 * Restores scroll on navigation, Lenis-aware.
 *
 * - New page → jump to top.
 * - URL with a hash → scroll to that section once it exists (sections may be
 *   lazy-loaded, so we poll for a short while instead of failing silently).
 * - Language switch → keep the current position (same page, new language).
 */
export function ScrollManager() {
  const { pathname, hash, state } = useLocation();
  const { scrollTo } = useSmoothScroll();
  const basePath = stripLocale(pathname);

  useEffect(() => {
    if (state?.localeSwitch) return undefined;
    if (!hash) {
      scrollTo(0, { immediate: true });
      return undefined;
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
