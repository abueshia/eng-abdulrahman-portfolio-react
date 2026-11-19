import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Composes class names and resolves Tailwind conflicts (last one wins).
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
