import { useEffect, useRef, useState } from 'react';

/**
 * Observes when an element enters the viewport.
 *
 * @template {Element} T
 * @param {Object} [options]
 * @param {string} [options.rootMargin='0px']
 * @param {number | number[]} [options.threshold=0]
 * @param {boolean} [options.once=true] Stop observing after the first intersection.
 * @returns {[import('react').RefObject<T | null>, boolean]} Ref to attach and visibility flag.
 */
export function useInView({ rootMargin = '0px', threshold = 0, once = true } = {}) {
  const ref = useRef(/** @type {T | null} */ (null));
  // Without IntersectionObserver (old browsers, jsdom) content simply renders.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, threshold, once]);

  return [ref, inView];
}
