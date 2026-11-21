import { lazy, Suspense, useEffect, useState } from 'react';

import { DEFAULT_STATION, getStation } from '@/config/journey';
import { useStation } from '@/features/journey/journey-store';
import { useIdleReady } from '@/hooks/useHydrated';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDeviceTier } from '@/lib/device';

const AmbientField = lazy(() => import('./AmbientField'));

/**
 * Sets `--daylight` (0 at 01:00 … 1 at 13:00, visitor's local time) and
 * `data-daypart` on <html>. Night leans the light toward cool Ion, day toward
 * warm Ember. Client-only (the prerender cannot know the visitor's clock).
 */
function useDaylight() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const daylight = 0.5 + 0.5 * Math.cos(((hour - 13) / 24) * Math.PI * 2);
      root.style.setProperty('--daylight', daylight.toFixed(3));
      root.dataset.daypart =
        hour < 5 || hour >= 20 ? 'night' : hour < 8 ? 'dawn' : hour < 17 ? 'day' : 'dusk';
    };
    update();
    const id = window.setInterval(update, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
}

/**
 * Fixed backdrop behind every page: blueprint grid, two light masses (Ember
 * = request, Ion = response), vignette and film grain.
 *
 * The light follows the journey: each station has a scene
 * (config/journey.js) and the masses glide to it (CSS transitions on
 * transform/opacity only). High-tier devices upgrade the masses to a WebGL
 * field (domain-warped light that also follows the pointer); everyone else,
 * and reduced motion, keeps the CSS version.
 */
export function BackgroundLayer() {
  const station = useStation() ?? DEFAULT_STATION;
  const scene = (getStation(station) ?? /** @type {any} */ (getStation(DEFAULT_STATION))).scene;
  const tier = useDeviceTier();
  const reduced = useReducedMotion();
  const ready = useIdleReady({ timeout: 2500 });
  const [gl, setGl] = useState(false);
  useDaylight();

  const style = /** @type {import('react').CSSProperties} */ ({
    '--ember-x': scene.ember.x,
    '--ember-y': scene.ember.y,
    '--ember-s': scene.ember.s,
    '--ember-a': scene.ember.a,
    '--ion-x': scene.ion.x,
    '--ion-y': scene.ion.y,
    '--ion-s': scene.ion.s,
    '--ion-a': scene.ion.a,
    '--grid-a': scene.grid,
  });

  return (
    <div
      className="bg-layer"
      aria-hidden="true"
      data-station={station}
      data-field={gl ? 'gl' : 'css'}
      data-tier={tier}
      style={style}
    >
      <div className="bg-layer__glow bg-layer__glow--ember" />
      <div className="bg-layer__glow bg-layer__glow--ion" />
      {ready && tier === 'high' && !reduced && (
        <Suspense fallback={null}>
          <AmbientField scene={scene} onActive={setGl} />
        </Suspense>
      )}
      <div className="bg-layer__grid" />
      <div className="bg-layer__vignette" />
      <div className="bg-layer__grain" />
    </div>
  );
}
