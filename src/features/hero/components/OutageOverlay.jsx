import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useReducedMotion } from '@/hooks/useReducedMotion';

/** Must match the mesh's outage timeline (renderer.js: OUTAGE_SECONDS / reboot at 2.55 s). */
const DOWN_MS = 2550;
const TOTAL_MS = 3400;

/**
 * `php artisan down`: the secret command's visual surprise (lazy chunk).
 *
 * The whole system "goes down": the screen drops into a CRT maintenance
 * mode with a giant 503 while the service mesh fails node by node, then the
 * terminal brings it back (`php artisan up`) with an Ion reboot wave.
 *
 * Decorative and non-blocking: `aria-hidden`, no pointer capture, no focus
 * change; the terminal announces the outcome in words. Reduced motion: a
 * calm fade, no flicker.
 *
 * @param {{ onDone: () => void }} props
 */
export default function OutageOverlay({ onDone }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const ref = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const enter = reduced
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [
          { opacity: 0 },
          { opacity: 0.9, offset: 0.15 },
          { opacity: 0.2, offset: 0.3 },
          { opacity: 1, offset: 0.45 },
          { opacity: 0.6, offset: 0.6 },
          { opacity: 1 },
        ];
    el.animate(enter, { duration: reduced ? 300 : 420, fill: 'forwards' });

    const leave = window.setTimeout(() => {
      el.animate(
        reduced
          ? [{ opacity: 1 }, { opacity: 0 }]
          : [
              { opacity: 1, filter: 'blur(0px)', transform: 'scale(1)' },
              { opacity: 0, filter: 'blur(16px)', transform: 'scale(1.04)' },
            ],
        { duration: TOTAL_MS - DOWN_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
      );
    }, DOWN_MS);
    const done = window.setTimeout(onDone, TOTAL_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [onDone, reduced]);

  return createPortal(
    <div ref={ref} className="outage" aria-hidden="true">
      <div className="outage__scan" />
      <p className="outage__code">503</p>
      <p className="outage__text">
        {t('outage.title')}
        <span dir="ltr">{t('outage.subtitle')}</span>
      </p>
    </div>,
    document.body,
  );
}
