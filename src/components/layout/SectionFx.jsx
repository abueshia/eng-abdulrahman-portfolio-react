import { Suspense, useEffect, useState } from 'react';

import { useIdleReady } from '@/hooks/useHydrated';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Mounts a section's lazy motion layer (its GSAP "director") only when it is
 * worth paying for: after hydration, once the browser is idle, never under
 * reduced motion, and only when the section comes near the viewport. A
 * visitor who never scrolls that far never downloads it.
 *
 * Children are the lazy element, e.g. `<SectionFx target="about"><AboutDirector /></SectionFx>`.
 * Once mounted the layer stays (scrolling back must not reload or restart it).
 *
 * @param {{ target: string, children: import('react').ReactNode, rootMargin?: string }} props
 */
export function SectionFx({ target, children, rootMargin = '80% 0px' }) {
  const ready = useIdleReady();
  const reduced = useReducedMotion();
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!ready || reduced || near || typeof IntersectionObserver === 'undefined') return undefined;
    const element = document.getElementById(target);
    if (!element) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setNear(true);
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready, reduced, near, target, rootMargin]);

  if (!near || reduced) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}
