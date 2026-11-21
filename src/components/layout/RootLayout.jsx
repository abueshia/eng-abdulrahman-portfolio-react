import { lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { env } from '@/config/env';
import { useBootPhase } from '@/features/intro/boot-store';
import { trackJourney } from '@/features/journey/journey-store';
import { useHydrated } from '@/hooks/useHydrated';
import { whenNeeded } from '@/lib/hydrate-on-demand';
import { pauseOffscreenAnimations } from '@/lib/offscreen-animations';
import { BackgroundLayer } from './BackgroundLayer';
import { GlobalFx } from './GlobalFx';
import { Navbar } from './Navbar';
import { PageTransition } from './PageTransition';
import { ScrollManager } from './ScrollManager';

// The footer is a lazy chunk: prerendered in full, hydrated when it is about
// to be seen (or on the first interaction), see lib/hydrate-on-demand.
const Footer = lazy(() => whenNeeded('footer.foot').then(() => import('./Footer')));
const BootSequence = lazy(() => import('@/features/intro/components/BootSequence'));

/** Minimal, layout-stable fallback while a page chunk downloads. */
function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status">
      <span className="font-mono text-sm text-ink-dim">
        {t('common.loading')}
        <span className="ms-1 inline-block animate-blink text-ember">▍</span>
      </span>
    </div>
  );
}

/** The first-visit boot intro, client-only and only when the pre-paint script asked for it. */
function BootGate() {
  const hydrated = useHydrated();
  const phase = useBootPhase();
  if (!hydrated || !env.fx || phase === 'off' || phase === 'done') return null;
  return (
    <Suspense fallback={null}>
      <BootSequence />
    </Suspense>
  );
}

/** Measures the journey stops of the current page and tracks the request along them. */
function useJourneyTracking() {
  const { pathname } = useLocation();
  useEffect(() => trackJourney(), [pathname]);
  useEffect(() => pauseOffscreenAnimations(), [pathname]);
}

/**
 * Application shell shared by every route: skip link, global layers
 * (background light, route trace), navbar, animated page outlet and
 * footer. Landmarks: <header>, <main>, <footer>.
 *
 * `isolate` makes this the stacking context the fixed layers live in: the
 * background (z −2) and the service mesh (z −1) sit behind the content but
 * above the canvas colour.
 */
export function RootLayout() {
  const { t } = useTranslation();
  useJourneyTracking();

  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <a
        href="#main"
        className="fixed start-4 top-4 z-[100] -translate-y-24 rounded-full bg-ember px-5 py-3 text-sm font-medium text-on-ember transition-transform focus:translate-y-0"
      >
        {t('a11y.skipToContent')}
      </a>
      <BackgroundLayer />
      <ScrollManager />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<PageFallback />}>
          <PageTransition />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <GlobalFx />
      <BootGate />
    </div>
  );
}
