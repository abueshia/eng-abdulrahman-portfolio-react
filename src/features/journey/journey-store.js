import { useSyncExternalStore } from 'react';

import { createStore } from '@/lib/create-store';
import { EVENTS, on } from '@/lib/events';

/**
 * Where the visitor (the request) is on its route.
 *
 * Written by one scroll tracker (`trackJourney`, started by the root layout)
 * and read by everything that tells the journey: the background light, the
 * service mesh camera, the route trace. Per-frame readers call
 * `journeyStore.get()`; React reads coarse values through hooks so scrolling
 * never re-renders the tree.
 *
 * @typedef {{ id: string, at: number }} JourneyStop  `at`: scroll fraction (0–1) where the stop is reached.
 *
 * @typedef {Object} JourneyState
 * @property {string | null} station  Active station (null on pages without a route).
 * @property {string | null} next     Next station on the route.
 * @property {number} index           Index of the active stop.
 * @property {number} local           0–1 progress from the active stop to the next one.
 * @property {number} progress        0–1 scroll progress of the whole page.
 * @property {JourneyStop[]} stops
 */

/** @type {JourneyState} */
const INITIAL = { station: null, next: null, index: 0, local: 0, progress: 0, stops: [] };

export const journeyStore = createStore(INITIAL);

const clamp01 = (/** @type {number} */ value) => Math.min(1, Math.max(0, value));

/**
 * Pure: the active stop for a scroll progress.
 * @param {JourneyStop[]} stops Sorted by `at`.
 * @param {number} progress
 * @returns {Pick<JourneyState, 'station' | 'next' | 'index' | 'local'>}
 */
export function resolveJourney(stops, progress) {
  if (stops.length === 0) return { station: null, next: null, index: 0, local: 0 };
  let index = 0;
  for (let i = 0; i < stops.length; i += 1) {
    if (progress + 1e-6 >= stops[i].at) index = i;
  }
  const current = stops[index];
  const next = stops[index + 1];
  const local = next ? clamp01((progress - current.at) / Math.max(next.at - current.at, 1e-6)) : 0;
  return { station: current.id, next: next?.id ?? null, index, local };
}

/**
 * Starts tracking the journey on the current page. Stops are read from
 * `[data-station-anchor]` sections; a stop is "reached" when its section's top
 * crosses the middle of the viewport.
 * @returns {() => void} Stops tracking.
 */
export function trackJourney() {
  /** @type {JourneyStop[]} */
  let stops = [];
  let max = 1;
  let frame = 0;
  let measureFrame = 0;

  const root = document.documentElement;
  const update = () => {
    frame = 0;
    const progress = clamp01(window.scrollY / max);
    journeyStore.set({ ...resolveJourney(stops, progress), progress, stops });
    // Coarse flag for CSS (scroll cue, mobile route chip); written only on change.
    const scrolled = window.scrollY > 40 ? 'true' : 'false';
    if (root.dataset.scrolled !== scrolled) root.dataset.scrolled = scrolled;
  };

  const measure = () => {
    measureFrame = 0;
    const viewport = window.innerHeight;
    max = Math.max(1, document.documentElement.scrollHeight - viewport);
    stops = [...document.querySelectorAll('[data-station-anchor]')]
      .map((el) => ({
        id: /** @type {HTMLElement} */ (el).dataset.station ?? '',
        at: clamp01((el.getBoundingClientRect().top + window.scrollY - viewport * 0.5) / max),
      }))
      .sort((a, b) => a.at - b.at);
    update();
  };

  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const scheduleMeasure = () => {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  };

  measure();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', scheduleMeasure);
  const offLayout = on(EVENTS.layout, scheduleMeasure);
  const observer =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure);
  observer?.observe(document.body);

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(measureFrame);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', scheduleMeasure);
    offLayout();
    observer?.disconnect();
    delete root.dataset.scrolled;
    journeyStore.set(INITIAL);
  };
}

/** Active station id (null on the server, during hydration and on route-less pages). */
export function useStation() {
  return useSyncExternalStore(
    journeyStore.subscribe,
    () => journeyStore.get().station,
    () => null,
  );
}

/** Route stops (re-renders only when they are re-measured). */
export function useJourneyStops() {
  return useSyncExternalStore(
    journeyStore.subscribe,
    () => journeyStore.get().stops,
    () => INITIAL.stops,
  );
}
