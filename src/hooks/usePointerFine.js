import { useMediaQuery } from './useMediaQuery';

/**
 * True on devices with a precise, hover-capable pointer (mouse / trackpad).
 * Gate custom cursors, magnetic effects and hover-only reveals behind this so
 * touch users get purpose-built interactions instead.
 * @returns {boolean}
 */
export function usePointerFine() {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}
