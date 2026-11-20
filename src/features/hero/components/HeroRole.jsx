import { useEffect, useRef } from 'react';

import { env } from '@/config/env';
import { bootStore } from '@/features/intro/boot-store';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const sleep = (/** @type {number} */ ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Role line that types itself through `settings.hero.roles`.
 *
 * The prerendered HTML holds the first role (visible) and the full list for
 * assistive technology (`sr-only`), so nothing depends on the animation.
 * The typing loop writes `textContent` directly (no re-renders), pauses while
 * the line is off-screen or the tab hidden, and waits for the boot intro.
 * Reduced motion: the first role, still.
 *
 * @param {{ roles?: string[] }} props
 */
export function HeroRole({ roles = [] }) {
  const textRef = useRef(/** @type {HTMLSpanElement | null} */ (null));
  const reduced = useReducedMotion();
  const key = roles.join('|');

  useEffect(() => {
    const el = textRef.current;
    const list = key ? key.split('|') : [];
    if (!el || reduced || !env.fx || list.length < 2) return undefined;
    let cancelled = false;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);

    const idle = async (/** @type {number} */ ms) => {
      await sleep(ms);
      while (!cancelled && (!visible || document.hidden || bootStore.get().phase === 'running')) {
        await sleep(400);
      }
    };

    (async () => {
      let index = 0;
      el.textContent = list[0];
      while (!cancelled) {
        await idle(3200);
        if (cancelled) return;
        el.dataset.typing = 'true';
        for (let i = el.textContent.length; i >= 0 && !cancelled; i -= 1) {
          el.textContent = list[index].slice(0, i);
          await sleep(22);
        }
        index = (index + 1) % list.length;
        await sleep(260);
        const next = list[index];
        for (let i = 1; i <= next.length && !cancelled; i += 1) {
          el.textContent = next.slice(0, i);
          await sleep(38 + Math.random() * 46);
        }
        el.dataset.typing = 'false';
      }
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      el.textContent = list[0];
    };
  }, [key, reduced]);

  if (roles.length === 0) return null;
  return (
    <p className="hero-role" data-hero-reveal>
      <span className="hero-role__prompt" aria-hidden="true">
        ~/
      </span>
      <span className="sr-only">{roles.join(' · ')}</span>
      <span ref={textRef} className="hero-role__text" aria-hidden="true">
        {roles[0]}
      </span>
      <span className="hero-role__caret" aria-hidden="true" />
    </p>
  );
}
