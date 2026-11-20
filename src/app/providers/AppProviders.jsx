import { QueryClientProvider } from '@tanstack/react-query';
import { LazyMotion, MotionConfig } from 'motion/react';
import { useState } from 'react';

import { SmoothScroll } from '@/components/layout/SmoothScroll';
import { HeadContext } from '@/context/head-context';
import { ThemeProvider } from '@/context/ThemeContext';
import { createQueryClient } from '../query-client';

/** motion's animation engine, fetched right after first render (not in the initial bundle). */
const loadMotionFeatures = () => import('./motion-features').then((module) => module.default);

/**
 * Composes every app-wide provider in one place.
 *
 * - `LazyMotion` + `m` components keep motion's bundle cost minimal
 *   (`strict` throws if a full `motion.*` component sneaks in), and the
 *   features load asynchronously: nothing animates before hydration anyway.
 * - `MotionConfig reducedMotion="user"` makes every motion animation honour
 *   the OS reduced-motion preference automatically.
 *
 * - `headCollector` is only passed by the prerenderer (see `<Seo>`).
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   queryClient?: import('@tanstack/react-query').QueryClient,
 *   headCollector?: import('@/context/head-context').HeadCollector | null,
 * }} props
 */
export function AppProviders({ children, queryClient, headCollector = null }) {
  const [client] = useState(() => queryClient ?? createQueryClient());

  return (
    <HeadContext.Provider value={headCollector}>
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <LazyMotion features={loadMotionFeatures} strict>
            <MotionConfig reducedMotion="user">
              <SmoothScroll>{children}</SmoothScroll>
            </MotionConfig>
          </LazyMotion>
        </ThemeProvider>
      </QueryClientProvider>
    </HeadContext.Provider>
  );
}
