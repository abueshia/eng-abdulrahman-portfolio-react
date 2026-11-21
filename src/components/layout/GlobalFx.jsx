import { lazy, Suspense } from 'react';

import { useIdleReady } from '@/hooks/useHydrated';
import { usePointerFine } from '@/hooks/usePointerFine';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDeviceTier } from '@/lib/device';

const RouteTrace = lazy(() => import('./RouteTrace'));
const Cursor = lazy(() => import('./Cursor'));

/**
 * Client-only chrome layers shared by every page, loaded when the browser is
 * idle (never in the prerendered HTML, never in the initial bundle):
 *  - the route trace (scroll progress as the request's route);
 *  - the custom cursor (mouse only, full motion). It is cheap and it is
 *    interaction feedback, so the performance guard never removes it: on a
 *    low tier only its decorative trail is dropped.
 */
export function GlobalFx() {
  const ready = useIdleReady();
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const tier = useDeviceTier();
  if (!ready) return null;

  return (
    <>
      <Suspense fallback={null}>
        <RouteTrace />
      </Suspense>
      {fine && !reduced && (
        <Suspense fallback={null}>
          <Cursor trail={tier !== 'low'} />
        </Suspense>
      )}
    </>
  );
}
