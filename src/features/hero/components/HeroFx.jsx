import { lazy, Suspense, useEffect, useState } from 'react';

import { env } from '@/config/env';
import { isBooting, markBootReady } from '@/features/intro/boot-store';
import { useIdleReady } from '@/hooks/useHydrated';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDeviceTier } from '@/lib/device';

const ServiceMesh = lazy(() => import('./ServiceMesh'));
const HeroDirector = lazy(() => import('../fx/HeroDirector'));

/**
 * Client-only motion layer for the home page. Mounts nothing on the server
 * or during hydration; loads its chunks when the browser is idle (or right
 * away while the boot intro covers the page, which waits for them).
 *
 * - Service mesh: animated on capable devices; a single still frame for
 *   reduced motion and low-tier devices; a lighter profile on phones.
 * - Hero director (GSAP): skipped entirely under reduced motion.
 */
export function HeroFx() {
  const [booting] = useState(isBooting);
  const ready = useIdleReady({ immediate: booting });
  const reduced = useReducedMotion();
  const tier = useDeviceTier();
  const mobile = useMediaQuery('(max-width: 47.999rem)');

  // Readiness the intro would otherwise wait for in vain.
  useEffect(() => {
    if (!env.fx) {
      markBootReady('mesh');
      markBootReady('director');
    } else if (reduced) {
      markBootReady('director');
    }
  }, [reduced]);

  if (!ready) return null;
  return (
    <>
      <Suspense fallback={null}>
        <ServiceMesh
          animated={!reduced && tier !== 'low'}
          mobile={mobile}
          highTier={tier === 'high'}
        />
      </Suspense>
      {!reduced && (
        <Suspense fallback={null}>
          <HeroDirector />
        </Suspense>
      )}
    </>
  );
}
