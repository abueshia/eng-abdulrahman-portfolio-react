import { AnimatePresence, m } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';

import { stripLocale } from '@/config/routes';
import { useLocale } from '@/hooks/useLocale';
import { EVENTS, emit } from '@/lib/events';
import { sfx } from '@/lib/sound/sfx';
import { EASE } from '@/utils/motion';

/** Read at event time only: subscribing would re-render the page (see below). */
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Reads the CURRENT location, so a leaving page's curtain names the destination. */
function CurtainRequest() {
  const { pathname } = useLocation();
  return (
    <span className="curtain__request" dir="ltr">
      GET {stripLocale(pathname)}
    </span>
  );
}

/**
 * Route transitions: an Ember-edged curtain (a new page is a new request).
 *
 * Leaving: the curtain sweeps in from the inline start, its leading edge a
 * line of Ember light, with the next request line (`GET /path`) at its
 * centre. Arriving: it retreats toward the inline end and uncovers the new
 * page. Scroll resets while the screen is covered (`EVENTS.covered`), so the
 * old page never visibly jumps.
 *
 * `useOutlet()` is captured per render so the leaving page keeps its content
 * during the exit. The key ignores the locale prefix: switching language
 * re-renders in place, no curtain. First load: no curtain (the boot intro
 * owns that moment). Reduced motion: instant swap (MotionConfig), with the
 * same tree.
 *
 * This component must not subscribe to anything that changes right after
 * hydration (reduced motion, theme...). Re-rendering it re-renders the page
 * through `useOutlet()`, and React then discards the prerendered HTML of
 * every section that has not hydrated yet: the page emptied below the hero.
 *
 * View Transitions: a navigation carrying `state.viewTransition` (case file →
 * case study, see useCaseNavigation) is animated by the browser, which morphs
 * the cover into the new header. The curtain steps aside: the leaving page
 * exits instantly (AnimatePresence `custom` reaches the exiting child) and the
 * new one arrives uncovered.
 */
export function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const { dir } = useLocale();
  const key = stripLocale(location.pathname);
  // View Transitions skip the curtain. Reduced motion needs nothing here:
  // `MotionConfig reducedMotion="user"` already makes its transform instant.
  const skip = Boolean(location.state?.viewTransition);

  const start = dir === 'rtl' ? 1 : 0;
  const instant = { duration: 0 };
  const curtain = {
    initial: (/** @type {boolean} */ skip) =>
      skip ? { scaleX: 0, transition: instant } : { scaleX: 1, originX: 1 - start },
    enter: (/** @type {boolean} */ skip) =>
      skip
        ? { scaleX: 0, transition: instant }
        : {
            scaleX: 0,
            originX: 1 - start,
            transition: { duration: 0.8, ease: EASE.shutter, delay: 0.08 },
          },
    exit: (/** @type {boolean} */ skip) =>
      skip
        ? { scaleX: 0, transition: instant }
        : { scaleX: [0, 1], originX: start, transition: { duration: 0.55, ease: EASE.inOutQuart } },
  };

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      custom={skip}
      onExitComplete={() => emit(EVENTS.covered)}
    >
      <m.div key={key} initial="initial" animate="enter" exit="exit">
        {outlet}
        <m.div
          className="curtain"
          custom={skip}
          variants={curtain}
          aria-hidden="true"
          onAnimationStart={(definition) => {
            if (definition === 'exit' && !skip && !prefersReducedMotion()) sfx('whoosh');
          }}
        >
          <span className="curtain__edge" />
          <CurtainRequest />
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
