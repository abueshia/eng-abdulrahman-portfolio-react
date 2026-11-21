import { useCallback, useLayoutEffect, useRef } from 'react';

/** Same curve as the `ember` ease (utils/motion.js EASE.outExpo). */
const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * FLIP for the case-file list when the filter changes: records that stay in
 * the result set glide from where they were to where they land.
 *
 * Why not motion's `layout` prop: it needs motion's full feature bundle
 * (`domMax`), and splitting that bundle off makes the build re-chunk motion's
 * core out of the entry, growing the initial JS. Entering and leaving
 * records stay with motion (AnimatePresence); this hook only moves the
 * survivors, on `transform` (a property nothing else animates on `<li>`).
 *
 * Usage: call `capture()` right before the state change (in the event
 * handler, so positions are exact even after scrolling); the move plays once
 * the new list commits (`key` changes). Positions are offsets inside the
 * list, so page and list scroll do not matter. Skipped under reduced motion.
 *
 * @param {import('react').RefObject<HTMLElement | null>} listRef
 * @param {string} key   Changes when the list content changes.
 * @param {boolean} enabled
 */
export function useFlip(listRef, key, enabled) {
  const before = useRef(/** @type {Map<string, { x: number, y: number }> | null} */ (null));

  const capture = useCallback(() => {
    const list = listRef.current;
    if (!list || !enabled) return;
    const map = new Map();
    list.querySelectorAll('[data-flip]').forEach((node) => {
      const el = /** @type {HTMLElement} */ (node);
      map.set(el.dataset.flip ?? '', { x: el.offsetLeft, y: el.offsetTop });
    });
    before.current = map;
  }, [listRef, enabled]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const previous = before.current;
    before.current = null;
    if (!list || !previous) return;
    list.querySelectorAll('[data-flip]').forEach((node) => {
      const el = /** @type {HTMLElement} */ (node);
      const from = previous.get(el.dataset.flip ?? '');
      if (!from || typeof el.animate !== 'function') return;
      const dx = from.x - el.offsetLeft;
      const dy = from.y - el.offsetTop;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
        duration: 700,
        easing: EASING,
      });
    });
  }, [listRef, key]);

  return capture;
}
