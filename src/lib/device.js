import { useSyncExternalStore } from 'react';

import { createStore } from './create-store';

/**
 * Device capability tier: how much visual effect a device can afford.
 *
 *  - `high`: precise pointer, ≥ 8 cores, ≥ 8 GB, wide screen → every effect,
 *            including the WebGL ambient field.
 *  - `mid`:  the default (most laptops and phones) → animated canvas layers
 *            with lighter counts.
 *  - `low`:  data saver, 2G, ≤ 2 cores or ≤ 2 GB, or a touch device with
 *            ≤ 4 cores or ≤ 4 GB (entry-level phones) → static frames only.
 *
 * The tier only ever goes down at runtime: the service mesh's FPS guard calls
 * `deviceTier.degrade()` when frames drop, and every effect follows.
 *
 * @typedef {'low' | 'mid' | 'high'} DeviceTier
 */

const RANK = { low: 0, mid: 1, high: 2 };

/**
 * Pure classification from capability signals. Missing signals are neutral
 * (Safari exposes neither `deviceMemory` nor `connection`).
 * @param {{
 *   cores?: number, memory?: number, saveData?: boolean, effectiveType?: string,
 *   reducedData?: boolean, pointerFine?: boolean, width?: number,
 * }} signals
 * @returns {DeviceTier}
 */
export function classifyDevice({
  cores,
  memory,
  saveData = false,
  effectiveType,
  reducedData = false,
  pointerFine = false,
  width = 1024,
}) {
  if (saveData || reducedData) return 'low';
  if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'low';
  if ((cores !== undefined && cores <= 2) || (memory !== undefined && memory <= 2)) return 'low';
  // Entry-level phones and tablets: animated canvas layers cost them frames.
  if (!pointerFine && ((cores ?? 8) <= 4 || (memory ?? 8) <= 4)) return 'low';
  if (pointerFine && width >= 1024 && (cores ?? 8) >= 8 && (memory ?? 8) >= 8) return 'high';
  return 'mid';
}

/** @returns {DeviceTier} */
function detect() {
  const nav = /** @type {any} */ (navigator);
  return classifyDevice({
    cores: nav.hardwareConcurrency,
    memory: nav.deviceMemory,
    saveData: nav.connection?.saveData,
    effectiveType: nav.connection?.effectiveType,
    reducedData: window.matchMedia?.('(prefers-reduced-data: reduce)').matches,
    pointerFine: window.matchMedia?.('(hover: hover) and (pointer: fine)').matches,
    width: window.innerWidth,
  });
}

const store = createStore(/** @type {DeviceTier | null} */ (null));

export const deviceTier = {
  /** @returns {DeviceTier} */
  get() {
    if (typeof window === 'undefined') return 'mid';
    if (store.get() === null) store.set(detect());
    return /** @type {DeviceTier} */ (store.get());
  },
  subscribe: store.subscribe,
  /**
   * Lowers the tier (never raises it).
   * @param {DeviceTier} to
   */
  degrade(to) {
    if (RANK[to] < RANK[deviceTier.get()]) store.set(to);
  },
};

/**
 * Current device tier: `mid` on the server and during hydration (markup never
 * depends on it), then the real tier.
 * @returns {DeviceTier}
 */
export function useDeviceTier() {
  return useSyncExternalStore(deviceTier.subscribe, deviceTier.get, () => 'mid');
}
