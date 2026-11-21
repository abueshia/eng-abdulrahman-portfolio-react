import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { paths } from '@/config/routes';
import { useLocale } from '@/hooks/useLocale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePrefetchProject } from './useProjects';

/** Shared element name: the case file's cover becomes the case study's header. */
export const COVER_TRANSITION = 'case-cover';
const READY_TIMEOUT = 1600;

/**
 * Resolves once the new page's cover is in the DOM and decoded (or after a
 * timeout), so the View Transition snapshots a finished header.
 */
function whenCoverReady() {
  return new Promise((resolve) => {
    const started = performance.now();
    const poll = () => {
      const cover = /** @type {HTMLImageElement | null} */ (
        document.querySelector('[data-vt-cover]')
      );
      if (cover) {
        Promise.resolve(cover.decode?.())
          .catch(() => {})
          .finally(() => resolve(undefined));
      } else if (performance.now() - started > READY_TIMEOUT) {
        resolve(undefined);
      } else {
        requestAnimationFrame(poll);
      }
    };
    poll();
  });
}

/**
 * Click handler for case-file links: navigates with a View Transition in
 * which the clicked cover morphs into the case study's header image.
 *
 * Progressive: modified clicks, browsers without `startViewTransition` and
 * reduced motion fall through to the plain link (and its curtain). The data
 * and page chunk are warmed first, and the navigation carries
 * `state.viewTransition`, which tells the page transition to step aside.
 */
export function useCaseNavigation() {
  const navigate = useNavigate();
  const { localize } = useLocale();
  const reduced = useReducedMotion();
  const prefetch = usePrefetchProject();

  return useCallback(
    (
      /** @type {import('react').MouseEvent} */ event,
      /** @type {string} */ slug,
      /** @type {HTMLElement | null} */ cover,
    ) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (reduced || typeof document.startViewTransition !== 'function') return;
      event.preventDefault();
      const to = localize(paths.project(slug));

      prefetch(slug)
        .catch(() => {})
        .then(() => {
          if (cover) cover.style.viewTransitionName = COVER_TRANSITION;
          const transition = document.startViewTransition(() => {
            // The old snapshot is taken: release the name before the new
            // page claims it (two live elements may not share one).
            if (cover) cover.style.viewTransitionName = '';
            navigate(to, { state: { viewTransition: true } });
            return whenCoverReady();
          });
          transition.finished
            .catch(() => {})
            .finally(() => {
              if (cover) cover.style.viewTransitionName = '';
            });
        });
    },
    [navigate, localize, reduced, prefetch],
  );
}
