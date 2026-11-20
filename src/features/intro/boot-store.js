import { useSyncExternalStore } from 'react';

import { createStore } from '@/lib/create-store';

/**
 * Boot intro state, shared by the intro overlay and everything it hands off to.
 *
 * Phases:
 *  - `off`       no intro this page view (returning in the same session, deep
 *                link, effects disabled, or the server).
 *  - `pending`   the pre-paint script decided to play it; a CSS cover is up
 *                while React hydrates.
 *  - `running`   the terminal is booting; the counter tracks REAL readiness.
 *  - `revealing` the camera slit is opening: the hero name animates now.
 *  - `done`      the intro is gone.
 *
 * Readiness is not theatre: each task is reported by the code that actually
 * waits for it (fonts, the hero portrait decode, settings data, the hero and
 * mesh chunks). The counter can only finish when they have, within
 * [min, max] milliseconds.
 *
 * @typedef {'off' | 'pending' | 'running' | 'revealing' | 'done'} BootPhase
 * @typedef {keyof typeof BOOT_TASKS} BootTask
 */

export const BOOT_STORAGE_KEY = 'portfolio.boot';

/** Real readiness tasks and their weight in the counter (sums to 1). */
export const BOOT_TASKS = Object.freeze({
  director: 0.2,
  mesh: 0.15,
  fonts: 0.25,
  portrait: 0.2,
  data: 0.2,
});

/** The intro never ends before `min` (no flash) nor holds the page past `max`. */
export const BOOT_TIMING = Object.freeze({ min: 2500, max: 4000 });

/** @returns {BootPhase} */
const initialPhase = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.boot === 'play'
    ? 'pending'
    : 'off';

export const bootStore = createStore({
  phase: initialPhase(),
  /** @type {Partial<Record<BootTask, number>>} Milliseconds since navigation start. */
  ready: {},
});

/** @param {BootTask} task */
export function markBootReady(task) {
  bootStore.set((state) =>
    state.ready[task] !== undefined
      ? state
      : { ...state, ready: { ...state.ready, [task]: Math.round(performance.now()) } },
  );
}

/** @param {BootPhase} phase */
export function setBootPhase(phase) {
  bootStore.set((state) => (state.phase === phase ? state : { ...state, phase }));
}

/** Whether the intro is (about to be) covering the page. */
export const isBooting = () => ['pending', 'running'].includes(bootStore.get().phase);

/**
 * Pure: weighted share of finished tasks (0–1).
 * @param {Partial<Record<string, unknown>>} ready
 */
export function readinessOf(ready) {
  const sum = Object.entries(BOOT_TASKS).reduce(
    (total, [task, weight]) => total + (ready[task] !== undefined ? weight : 0),
    0,
  );
  return Math.round(sum * 1000) / 1000;
}

/**
 * Pure: counter target. It may not run ahead of real readiness, nor of the
 * minimum duration; at the maximum duration it completes regardless.
 * @param {{ elapsed: number, readiness: number, min?: number, max?: number }} input
 */
export function bootProgress({ elapsed, readiness, min = BOOT_TIMING.min, max = BOOT_TIMING.max }) {
  if (elapsed >= max) return 1;
  return Math.max(0, Math.min(1, readiness, elapsed / min));
}

/** Current phase (`off` on the server and during hydration). */
export function useBootPhase() {
  return useSyncExternalStore(
    bootStore.subscribe,
    () => bootStore.get().phase,
    () => /** @type {BootPhase} */ ('off'),
  );
}
