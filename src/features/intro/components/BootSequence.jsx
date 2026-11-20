import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/hooks/useLocale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSettings } from '@/hooks/useSettings';
import { sfx } from '@/lib/sound/sfx';
import { writeStorage } from '@/utils/storage';
import {
  BOOT_STORAGE_KEY,
  BOOT_TIMING,
  bootProgress,
  bootStore,
  markBootReady,
  readinessOf,
  setBootPhase,
} from '../boot-store';

/** Terminal lines and the real task each one waits for. */
const LINES = /** @type {const} */ ([
  { id: 'modules', tasks: ['director', 'mesh'] },
  { id: 'fonts', tasks: ['fonts'] },
  { id: 'data', tasks: ['data'] },
  { id: 'portrait', tasks: ['portrait'] },
]);

const SPINNER = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
const SHUTTER = 'cubic-bezier(0.7, 0, 0.15, 1)';

const sleep = (/** @type {number} */ ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * "Boot Sequence": the first-visit intro (home page, once per session).
 *
 * Hides real loading instead of adding a wait: the counter follows the
 * readiness tasks in `boot-store.js`, never finishing before 2.5 s nor holding
 * the page past 4 s. Exit: the terminal collapses into one Ember line, which
 * opens as a camera slit (clip-path) onto the hero. The name animation starts
 * the instant the slit opens (phase `revealing`), so both scenes read as one
 * shot.
 *
 * Never part of the prerendered HTML: crawlers and no-JS visitors get the
 * page directly. Pure DOM + Web Animations API (no GSAP), mounted in a
 * portal; the page behind is `inert` until the slit opens.
 * Skip button and Escape jump straight to the exit. Reduced motion: a static
 * readout and a 400 ms fade.
 */
export default function BootSequence() {
  const { t } = useTranslation();
  const { locale, dir } = useLocale();
  const reduced = useReducedMotion();
  const { data: settings } = useSettings();
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const exitRef = useRef(/** @type {null | ((fast: boolean) => void)} */ (null));

  useEffect(() => {
    if (settings) markBootReady('data');
  }, [settings]);

  // Take over from the CSS cover in the same frame (no flash), lock the page.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const page = document.getElementById('root');
    html.dataset.boot = 'run';
    if (page) page.inert = true;
    setBootPhase('running');
    document.fonts?.ready.then(() => markBootReady('fonts'));

    return () => {
      delete html.dataset.boot;
      if (page) page.inert = false;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const q = (/** @type {string} */ selector) =>
      /** @type {HTMLElement} */ (root.querySelector(selector));
    const counter = q('[data-boot-count]');
    const bar = q('[data-boot-bar]');
    const clock = q('[data-boot-clock]');
    const started = performance.now();
    let exiting = false;
    let disposed = false;
    let frame = 0;
    let shown = 0;
    let spin = 0;

    const finish = () => {
      if (disposed) return;
      writeStorage(BOOT_STORAGE_KEY, '1', 'session');
      setBootPhase('done');
    };

    /** Lines collapse into one Ember line, which opens as the camera slit. */
    const exit = async (fast = false) => {
      if (exiting) return;
      exiting = true;
      cancelAnimationFrame(frame);
      const k = fast ? 0.55 : 1;

      if (reduced) {
        setBootPhase('revealing');
        await root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' })
          .finished;
        finish();
        return;
      }

      const centre = window.innerHeight / 2;
      root.querySelectorAll('[data-boot-line]').forEach((line, i) => {
        const rect = line.getBoundingClientRect();
        const dy = centre - (rect.top + rect.height / 2);
        line.animate(
          [
            { transform: 'none', opacity: 1 },
            { transform: `translateY(${dy}px) scaleY(0.04)`, opacity: 0 },
          ],
          { duration: 460 * k, delay: i * 26 * k, easing: SHUTTER, fill: 'forwards' },
        );
      });
      for (const el of root.querySelectorAll('[data-boot-fade]')) {
        el.animate(
          [
            { opacity: 1, filter: 'blur(0px)' },
            { opacity: 0, filter: 'blur(10px)' },
          ],
          { duration: 360 * k, easing: 'ease-in', fill: 'forwards' },
        );
      }

      const slits = [q('[data-slit="top"]'), q('[data-slit="bottom"]')];
      for (const slit of slits) {
        slit.animate(
          [
            { transform: 'scaleX(0)', opacity: 0 },
            { transform: 'scaleX(1)', opacity: 1 },
          ],
          {
            duration: 340 * k,
            delay: 220 * k,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            fill: 'forwards',
          },
        );
      }
      await sleep(600 * k);
      if (disposed) return;

      // The slit opens: hand over to the hero in the same instant.
      setBootPhase('revealing');
      root.style.pointerEvents = 'none';
      const page = document.getElementById('root');
      if (page) page.inert = false;
      sfx('whoosh');
      const open = { duration: 1050 * k, easing: SHUTTER, fill: /** @type {const} */ ('forwards') };
      q('[data-shutter="top"]').animate(
        [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
        open,
      );
      const bottom = q('[data-shutter="bottom"]').animate(
        [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }],
        open,
      );
      slits[0].animate(
        [
          { transform: 'translateY(0) scaleX(1)', opacity: 1 },
          { transform: 'translateY(-50vh) scaleX(1)', opacity: 0 },
        ],
        open,
      );
      slits[1].animate(
        [
          { transform: 'translateY(0) scaleX(1)', opacity: 1 },
          { transform: 'translateY(50vh) scaleX(1)', opacity: 0 },
        ],
        open,
      );
      await bottom.finished.catch(() => {});
      finish();
    };
    exitRef.current = exit;

    if (reduced) {
      counter.textContent = '100';
      bar.style.transform = 'scaleX(1)';
      const timer = setTimeout(() => exit(), 250);
      return () => {
        disposed = true;
        clearTimeout(timer);
      };
    }

    /** Types `text` with a human cadence (occasional hesitation at spaces). */
    const type = async (
      /** @type {HTMLElement} */ el,
      /** @type {string} */ text,
      /** @type {number} */ speed,
    ) => {
      for (let i = 0; i < text.length; i += 1) {
        if (disposed || exiting) {
          el.textContent = text;
          return;
        }
        el.textContent = text.slice(0, i + 1);
        const hesitate = text[i] === ' ' && Math.random() < 0.14;
        await sleep(speed * (0.5 + Math.random()) + (hesitate ? 60 + Math.random() * 80 : 0));
      }
    };

    const lineDone = (/** @type {readonly string[]} */ tasks) => {
      const { ready } = bootStore.get();
      if (tasks.some((task) => ready[task] === undefined)) return null;
      return Math.max(...tasks.map((task) => /** @type {number} */ (ready[task])));
    };

    const tick = () => {
      const elapsed = performance.now() - started;
      const { ready } = bootStore.get();
      const target = bootProgress({ elapsed, readiness: readinessOf(ready) });
      // Inertia: the counter eases toward the target and never goes back.
      shown = Math.min(target, shown + Math.max((target - shown) * 0.14, 0.0025));
      counter.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      bar.style.transform = `scaleX(${shown})`;
      clock.textContent = `T+${(elapsed / 1000).toFixed(2)}s`;

      spin = (spin + 1) % (SPINNER.length * 3);
      for (const line of LINES) {
        const state = /** @type {HTMLElement | null} */ (
          root.querySelector(`[data-state="${line.id}"]`)
        );
        if (!state || state.dataset.armed !== 'true' || state.dataset.done === 'true') continue;
        const at = lineDone(line.tasks);
        if (at !== null) {
          state.dataset.done = 'true';
          state.textContent = `✓ ${Math.max(0, at - Math.round(started)) || '<1'}ms`;
          sfx('tick');
        } else if (elapsed >= BOOT_TIMING.max) {
          state.dataset.done = 'true';
          state.textContent = '↷ deferred';
        } else {
          state.textContent = SPINNER[Math.floor(spin / 3)];
        }
      }

      if (shown >= 0.999 && target >= 1) {
        exit();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // The script itself: prompt, then one line per readiness task.
    (async () => {
      const command = /** @type {HTMLElement} */ (root.querySelector('[data-type="command"]'));
      await type(command, command.dataset.text ?? '', 20);
      for (const line of LINES) {
        const label = /** @type {HTMLElement} */ (root.querySelector(`[data-type="${line.id}"]`));
        await type(label, label.dataset.text ?? '', 7);
        const state = /** @type {HTMLElement} */ (root.querySelector(`[data-state="${line.id}"]`));
        state.dataset.armed = 'true';
        await sleep(70);
      }
      const final = /** @type {HTMLElement} */ (root.querySelector('[data-type="final"]'));
      await type(final, final.dataset.text ?? '', 16);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
    };
  }, [reduced]);

  // Escape skips, like the button.
  useEffect(() => {
    const onKey = (/** @type {KeyboardEvent} */ event) => {
      if (event.key === 'Escape') exitRef.current?.(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const skip = useCallback(() => exitRef.current?.(true), []);

  const lineText = (/** @type {string} */ id) =>
    t(`boot.lines.${id}`, { locale, dir, interpolation: { escapeValue: false } });
  const staticMode = reduced;

  return createPortal(
    <div ref={rootRef} className="boot" dir={dir}>
      <div className="boot__shutter boot__shutter--top" data-shutter="top" />
      <div className="boot__shutter boot__shutter--bottom" data-shutter="bottom" />

      <div className="boot__hud" aria-hidden="true">
        <div className="boot__top" data-boot-fade>
          <span>{t('boot.title')}</span>
          <span data-boot-clock>T+0.00s</span>
        </div>

        <div className="boot__term" dir="ltr">
          <p className="boot__line" data-boot-line>
            <span className="boot__ps1">{t('boot.prompt')}</span>
            <span
              className="boot__cmd"
              data-type="command"
              data-text={settings?.data?.hero?.terminal_stack_command ?? t('boot.command')}
            >
              {staticMode
                ? (settings?.data?.hero?.terminal_stack_command ?? t('boot.command'))
                : ''}
            </span>
          </p>
          {LINES.map((line) => (
            <p key={line.id} className="boot__line" data-boot-line>
              <span className="boot__arrow">▸</span>
              <span data-type={line.id} data-text={lineText(line.id)}>
                {staticMode ? lineText(line.id) : ''}
              </span>
              <span className="boot__state" data-state={line.id}>
                {staticMode ? '✓' : ''}
              </span>
            </p>
          ))}
          <p className="boot__line boot__line--final" data-boot-line>
            <span className="boot__arrow">▸</span>
            <span data-type="final" data-text={t('boot.lines.final')}>
              {staticMode ? t('boot.lines.final') : ''}
            </span>
            <span className="boot__caret">▍</span>
          </p>
        </div>

        <div className="boot__meter" data-boot-fade>
          <div className="boot__bar" data-boot-bar />
        </div>
        <div className="boot__count" data-boot-count data-boot-fade>
          000
        </div>
        <div className="boot__slit" data-slit="top" />
        <div className="boot__slit" data-slit="bottom" />
      </div>

      <button type="button" className="boot__skip" onClick={skip} data-boot-fade>
        {t('boot.skip')}
        <kbd aria-hidden="true">Esc</kbd>
      </button>
    </div>,
    document.body,
  );
}
