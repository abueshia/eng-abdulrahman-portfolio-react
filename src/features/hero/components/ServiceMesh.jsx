import { useEffect, useRef } from 'react';

import { markBootReady } from '@/features/intro/boot-store';
import { journeyStore } from '@/features/journey/journey-store';
import { deviceTier } from '@/lib/device';
import { EVENTS, on } from '@/lib/events';
import { subscribeTheme } from '@/lib/theme';
import { sfx } from '@/lib/sound/sfx';
import { PROFILES, createMeshRenderer } from '../lib/mesh/renderer';
import { meshStats } from '../lib/mesh-stats';

/**
 * Page-wide "Living Service Mesh" layer for the home page (lazy chunk,
 * client-only, mounted on idle). A fixed canvas behind the content: the hero
 * is its Gateway, and its camera follows the visitor's request down the
 * journey (see `lib/mesh/renderer.js`).
 *
 * Decorative: `aria-hidden`, never focusable, never required to understand
 * the page.
 *
 * @param {{ animated: boolean, mobile: boolean, highTier: boolean }} props
 */
export default function ServiceMesh({ animated, mobile, highTier }) {
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const hero = document.getElementById('hero');
    const portrait = /** @type {HTMLElement | null} */ (
      document.querySelector('[data-mesh-anchor]')
    );
    const profile = mobile ? PROFILES.mobile : highTier ? PROFILES.high : PROFILES.mid;

    const renderer = createMeshRenderer(canvas, {
      profile,
      animated,
      getJourney: journeyStore.get,
      getDirection: () => (document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'),
      // The Gateway sits behind the portrait's head; one rect read per frame.
      getAnchor: () => {
        if (!hero || !portrait) return null;
        const heroRect = hero.getBoundingClientRect();
        const rect = portrait.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height * 0.32,
          exit: Math.min(1, Math.max(0, -heroRect.top / Math.max(1, heroRect.height * 0.9))),
        };
      },
      onFps: (fps) => meshStats.set({ fps }),
      onDegrade: (level) => deviceTier.degrade(level),
    });
    markBootReady('mesh');
    if (!renderer) return undefined;
    renderer.start();

    const onPointer = (/** @type {PointerEvent} */ event) => {
      if (event.pointerType === 'mouse') renderer.setPointer(event.clientX, event.clientY);
    };
    const onLeave = () => renderer.setPointer(-1e4, -1e4);
    // Click / tap on empty hero space fires a burst of requests.
    const onDown = (/** @type {PointerEvent} */ event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      if (target.closest('a, button, input, textarea, select, label, [data-no-burst]')) return;
      if (renderer.burst(event.clientX, event.clientY)) sfx('packet');
    };
    const onVisibility = () => (document.hidden ? renderer.stop() : renderer.start());

    window.addEventListener('pointermove', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    hero?.addEventListener('pointerdown', onDown);
    document.addEventListener('visibilitychange', onVisibility);
    const resizeObserver = new ResizeObserver(() => renderer.resize());
    resizeObserver.observe(canvas);
    // Same store, same call as the DOM switch: the canvas never lags a theme.
    const offTheme = subscribeTheme(() => renderer.refreshPalette());
    const dirObserver = new MutationObserver(() => renderer.redraw());
    dirObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    document.fonts?.ready.then(() => renderer.refreshPalette({ fontsChanged: true }));

    // Still frames follow the journey station by station (no per-frame work).
    let lastStation = journeyStore.get().station;
    const offJourney = journeyStore.subscribe(() => {
      const { station } = journeyStore.get();
      if (station === lastStation) return;
      lastStation = station;
      renderer.redraw();
    });
    const offOutage = on(EVENTS.outage, () => renderer.outage());

    return () => {
      renderer.destroy();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      hero?.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver.disconnect();
      offTheme();
      dirObserver.disconnect();
      offJourney();
      offOutage();
    };
  }, [animated, mobile, highTier]);

  return <canvas ref={canvasRef} className="mesh-canvas" aria-hidden="true" />;
}
