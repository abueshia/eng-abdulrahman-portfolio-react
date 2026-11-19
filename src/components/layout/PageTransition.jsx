import { AnimatePresence, m } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';

import { stripLocale } from '@/config/routes';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/utils/motion';

/**
 * Animated route outlet.
 *
 * `useOutlet()` is captured per render so the exiting page keeps rendering
 * its own content during the exit animation (a plain `<Outlet />` would swap
 * to the new route immediately).
 *
 * The key ignores the locale prefix: switching language re-renders the same
 * page in place instead of playing a page transition.
 */
export function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduced = useReducedMotion();
  const key = stripLocale(location.pathname);

  if (reduced) return outlet;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={key}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE.outExpo } }}
        exit={{ opacity: 0, y: -12, transition: { duration: 0.25, ease: EASE.inOutQuart } }}
      >
        {outlet}
      </m.div>
    </AnimatePresence>
  );
}
