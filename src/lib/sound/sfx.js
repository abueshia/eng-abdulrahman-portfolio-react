import { useSyncExternalStore } from 'react';

import { readStorage, writeStorage } from '@/utils/storage';
import { createStore } from '../create-store';

/**
 * Optional interface sound. OFF by default; the visitor opts in with the
 * navbar toggle and the choice is remembered.
 *
 * This module is the only part in the initial bundle: a store plus a no-op
 * `sfx()` proxy. The Web Audio synth (`engine.js`) is downloaded the first
 * time sound is switched on. There are no audio files: every sound is
 * synthesised, so enabling sound costs a few kilobytes of code.
 *
 * @typedef {'tick' | 'blip' | 'hover' | 'whoosh' | 'success' | 'down' | 'up' | 'packet'} SoundName
 */

export const SOUND_STORAGE_KEY = 'portfolio.sound';

const store = createStore(/** @type {boolean | null} */ (null));

/** @type {Promise<import('./engine').SoundEngine> | null} */
let enginePromise = null;

const loadEngine = () => {
  enginePromise ??= import('./engine').then(({ createSoundEngine }) => {
    const engine = createSoundEngine();
    // A returning visitor who left sound on gets the ambient hum back.
    if (store.get()) engine.setEnabled(true);
    return engine;
  });
  return enginePromise;
};

export const soundStore = {
  /** @returns {boolean} */
  get() {
    if (typeof window === 'undefined') return false;
    if (store.get() === null) store.set(readStorage(SOUND_STORAGE_KEY) === 'on');
    return /** @type {boolean} */ (store.get());
  },
  subscribe: store.subscribe,
  /** @param {boolean} enabled Must be called from a user gesture when enabling. */
  set(enabled) {
    store.set(enabled);
    writeStorage(SOUND_STORAGE_KEY, enabled ? 'on' : 'off');
    if (enabled) {
      loadEngine().then((engine) => {
        engine.setEnabled(true);
        engine.play('success');
      });
    } else {
      enginePromise?.then((engine) => engine.setEnabled(false));
    }
  },
};

/**
 * Plays a sound if (and only if) the visitor enabled sound.
 * @param {SoundName} name
 */
export function sfx(name) {
  if (!soundStore.get()) return;
  loadEngine().then((engine) => engine.play(name));
}

/** @returns {boolean} Whether sound is on (false on the server and during hydration). */
export function useSoundEnabled() {
  return useSyncExternalStore(soundStore.subscribe, soundStore.get, () => false);
}
