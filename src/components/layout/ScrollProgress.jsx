import { useEffect, useRef } from 'react';

/**
 * Thin reading-progress bar pinned to the top of the viewport.
 *
 * Writes `transform` directly on the element inside rAF: zero React renders
 * while scrolling. The origin follows the reading direction (RTL → right).
 */
export function ScrollProgress() {
  const barRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px]">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-ember to-ion will-change-transform rtl:origin-right rtl:bg-gradient-to-l"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
