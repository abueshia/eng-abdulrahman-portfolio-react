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
 *  - the custom cursor (mouse only, full motion, not on low-tier devices).
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
      {fine && !reduced && tier !== 'low' && (
        <Suspense fallback={null}>
          <Cursor />
        </Suspense>
      )}
    </>
  );
}
