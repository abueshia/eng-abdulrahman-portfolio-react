import { useEffect, useState, useSyncExternalStore } from 'react';

import { env } from '@/config/env';
import { onIdle } from '@/lib/idle';

const noopSubscribe = () => () => {};

/**
 * False on the server and during hydration, true afterwards. Gate anything
 * that must not exist in prerendered markup (client-only layers) behind it,
 * so the first client render always matches the HTML.
 * @returns {boolean}
 */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * True once the browser is idle after hydration: the moment to fetch and
 * mount heavy, non-essential effects (canvas, WebGL, GSAP directors) without
 * competing with first paint or hydration.
 *
 * Always false when visual effects are disabled (`VITE_FX=off`).
 *
 * @param {{ immediate?: boolean, timeout?: number }} [options]
 *   `immediate`: skip the idle wait (e.g. while the boot intro is covering the page).
 * @returns {boolean}
 */
export function useIdleReady({ immediate = false, timeout = 1500 } = {}) {
  const hydrated = useHydrated();
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!hydrated || !env.fx || immediate) return undefined;
    return onIdle(() => setIdle(true), { timeout });
  }, [hydrated, immediate, timeout]);

  return env.fx && hydrated && (immediate || idle);
}
