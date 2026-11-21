import { clsx } from 'clsx';

/**
 * Composes class names (conditional strings, arrays, objects).
 *
 * Deliberately plain `clsx`, not tailwind-merge (~9 KB gzip in the initial
 * bundle): components never receive a `className` that conflicts with their
 * own utilities. Variants are expressed as props (`size`, `desktopOnly`) or
 * as mutually exclusive branches (`current ? 'text-ink' : 'text-ink-muted'`).
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return clsx(inputs);
}
