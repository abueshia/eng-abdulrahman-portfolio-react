import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { journeyStore } from '@/features/journey/journey-store';

const INTERACTIVE = 'a[href], button, [role="button"], summary, label[for], select';
const TEXT =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]';
const TRAIL_MS = 320;

/**
 * Custom cursor (lazy chunk; mouse/trackpad only, never under reduced motion
 * or on low-tier devices; the native cursor returns whenever it unmounts).
 *
 * - A dot that is exactly where the pointer is (no input lag), and a ring
 *   that follows with inertia.
 * - The ring reads what is underneath: links/buttons swell it; elements with
 *   `data-cursor="stick"` (hero CTAs) make it wrap their outline;
 *   `data-cursor="view"` turns it into a "View" disc (project cards);
 *   text fields turn it into a caret.
 * - Movement leaves a short request trace that fades in a third of a
 *   second: Ember, or Ion once the journey reaches the Response.
 *
 * One rAF loop that sleeps when the pointer rests; transforms only.
 */
export default function Cursor() {
  const { t } = useTranslation();
  const dotRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const ringRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const labelRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const canvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null));
  const viewLabel = t('cursor.view');

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!dot || !ring || !label || !canvas || !ctx) return undefined;
    const root = document.documentElement;
    root.dataset.cursor = 'custom';

    const state = { x: -100, y: -100, rx: -100, ry: -100, visible: false, pressed: false };
    /** @type {{ el: HTMLElement, rect: DOMRect } | null} */
    let stick = null;
    /** @type {Array<{ x: number, y: number, t: number }>} */
    const trail = [];
    let frame = 0;
    let colors = { ember: '#ff5a36', ion: '#3ddcff' };

    const readColors = () => {
      const style = getComputedStyle(root);
      colors = {
        ember: style.getPropertyValue('--accent').trim() || colors.ember,
        ion: style.getPropertyValue('--secondary').trim() || colors.ion,
      };
    };
    readColors();
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (/** @type {number} */ now) => {
      const k = stick ? 0.22 : 0.18;
      let tx = state.x;
      let ty = state.y;
      if (stick) {
        // Wrap the element, leaning slightly toward the pointer.
        tx =
          stick.rect.left +
          stick.rect.width / 2 +
          (state.x - (stick.rect.left + stick.rect.width / 2)) * 0.12;
        ty =
          stick.rect.top +
          stick.rect.height / 2 +
          (state.y - (stick.rect.top + stick.rect.height / 2)) * 0.12;
      }
      state.rx += (tx - state.rx) * k;
      state.ry += (ty - state.ry) * k;
      dot.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      ring.style.transform = `translate3d(${state.rx}px, ${state.ry}px, 0) scale(${state.pressed ? 0.82 : 1})`;

      // Request trace
      while (trail.length > 0 && now - trail[0].t > TRAIL_MS) trail.shift();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (trail.length > 1) {
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = journeyStore.get().station === 'response' ? colors.ion : colors.ember;
        for (let i = 1; i < trail.length; i += 1) {
          ctx.globalAlpha = (1 - (now - trail[i].t) / TRAIL_MS) * 0.55;
          ctx.beginPath();
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
          ctx.lineTo(trail[i].x, trail[i].y);
          ctx.stroke();
        }
      }

      const settled =
        Math.abs(tx - state.rx) < 0.1 && Math.abs(ty - state.ry) < 0.1 && trail.length === 0;
      frame = settled ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };

    const setMode = (/** @type {string} */ mode, /** @type {string} */ text = '') => {
      ring.dataset.mode = mode;
      dot.dataset.mode = mode;
      label.textContent = text;
    };

    const onMove = (/** @type {PointerEvent} */ event) => {
      if (event.pointerType !== 'mouse') return;
      state.x = event.clientX;
      state.y = event.clientY;
      if (!state.visible) {
        state.visible = true;
        state.rx = state.x;
        state.ry = state.y;
        root.dataset.cursorVisible = 'true';
      }
      trail.push({ x: state.x, y: state.y, t: performance.now() });
      if (trail.length > 40) trail.shift();
      if (stick) stick.rect = stick.el.getBoundingClientRect();
      kick();
    };

    const onOver = (/** @type {PointerEvent} */ event) => {
      const target = /** @type {HTMLElement} */ (event.target);
      const hint = /** @type {HTMLElement | null} */ (target.closest?.('[data-cursor]'));
      const kind = hint?.dataset.cursor;
      stick = null;
      ring.style.removeProperty('--w');
      ring.style.removeProperty('--h');
      if (kind === 'stick' && hint) {
        stick = { el: hint, rect: hint.getBoundingClientRect() };
        ring.style.setProperty('--w', `${stick.rect.width + 12}px`);
        ring.style.setProperty('--h', `${stick.rect.height + 12}px`);
        setMode('stick');
      } else if (kind === 'view') {
        setMode('view', hint?.dataset.cursorLabel ?? viewLabel);
      } else if (kind === 'text' || target.closest?.(TEXT)) {
        setMode('text');
      } else if (target.closest?.(INTERACTIVE)) {
        setMode('link');
      } else {
        setMode('default');
      }
      kick();
    };

    const onDown = () => {
      state.pressed = true;
      kick();
    };
    const onUp = () => {
      state.pressed = false;
      kick();
    };
    const onLeave = () => {
      state.visible = false;
      delete root.dataset.cursorVisible;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    root.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      delete root.dataset.cursor;
      delete root.dataset.cursorVisible;
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [viewLabel]);

  return (
    <div className="cursor" aria-hidden="true">
      <canvas ref={canvasRef} className="cursor__trail" />
      <div ref={ringRef} className="cursor__ring" data-mode="default">
        <span ref={labelRef} className="cursor__label" />
      </div>
      <div ref={dotRef} className="cursor__dot" data-mode="default" />
    </div>
  );
}
