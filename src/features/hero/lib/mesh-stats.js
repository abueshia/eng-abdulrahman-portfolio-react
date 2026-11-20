import { createStore } from '@/lib/create-store';

/**
 * Live numbers published by the service mesh (its measured frame rate), read
 * by the hero terminal's status line. Null until the mesh has measured.
 */
export const meshStats = createStore(/** @type {{ fps: number | null }} */ ({ fps: null }));
