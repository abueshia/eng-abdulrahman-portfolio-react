import { createContext } from 'react';

/**
 * Ref to the active Lenis instance (`current` is `null` when smooth scrolling
 * is disabled, e.g. reduced motion or tests).
 * @type {import('react').Context<import('react').RefObject<import('lenis').default | null>>}
 */
export const LenisContext = createContext(
  /** @type {import('react').RefObject<import('lenis').default | null>} */ ({ current: null }),
);
