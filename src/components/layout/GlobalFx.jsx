import { lazy, Suspense } from 'react';

import { useIdleReady } from '@/hooks/useHydrated';

const RouteTrace = lazy(() => import('./RouteTrace'));

/**
 * Client-only chrome layers shared by every page, loaded when the browser is
 * idle (never in the prerendered HTML, never in the initial bundle): the
 * route trace (scroll progress as the request's route).
 *
 * The site uses the native cursor: a custom one (a JS-driven dot, ring and
 * trail) was dropped as distracting and as per-frame work for no content.
 */
export function GlobalFx() {
  const ready = useIdleReady();
  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <RouteTrace />
    </Suspense>
  );
}
