import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { env } from '@/config/env';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { bootStore, useBootPhase } from '@/features/intro/boot-store';
import { useLocale } from '@/hooks/useLocale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useTheme } from '@/hooks/useTheme';
import { EVENTS, emit } from '@/lib/events';
import { sfx } from '@/lib/sound/sfx';
import { cn } from '@/utils/cn';
import { meshStats } from '../lib/mesh-stats';
import { completeCommand, runCommand, stackTree } from '../lib/terminal';

const OutageOverlay = lazy(() => import('./OutageOverlay'));

const MAX_LINES = 40;
const sleep = (/** @type {number} */ ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @typedef {import('../lib/terminal').TermLine & { id: number, prompt?: boolean }} Row */

let rowId = 0;
/** @param {import('../lib/terminal').TermLine[]} lines @returns {Row[]} */
const rows = (lines) => lines.map((line) => ({ ...line, id: (rowId += 1) }));

/**
 * The live terminal: a real, tiny shell. The prerendered HTML already holds
 * the stack summary (from settings), so nothing depends on JavaScript.
 *
 * - Boot intro: once the slit opens, the command types itself and the tree
 *   prints line by line.
 * - Idle: an uptime/FPS status line ticks (real numbers: time on page and the
 *   mesh's measured frame rate).
 * - Commands: `help`, `whoami`, `stack`, `projects`, `contact`, `hire --me`,
 *   `cv`, `theme`, `lang`, `clear` (Tab completes, ↑/↓ recall history) and
 *   one undocumented artisan command.
 *
 * Accessibility: the decorative output is `aria-hidden`; the input is a
 * labelled field and every response is announced through a polite live
 * region as plain text.
 *
 * @param {{ general?: any, hero?: any }} props
 */
export function HeroTerminal({ general, hero }) {
  const { t } = useTranslation();
  const { locale, switchLocale } = useLocale();
  const { toggleTheme } = useTheme();
  const { scrollTo } = useSmoothScroll();
  const reduced = useReducedMotion();
  const phase = useBootPhase();
  const { data: projectsData } = useProjects();
  const command = hero?.terminal_stack_command ?? '';
  const stack = useMemo(() => hero?.terminal_stack ?? [], [hero]);

  /** Lines printed by the user session; `null` = the initial static summary. */
  const [history, setHistory] = useState(/** @type {Row[] | null} */ (null));
  /** Boot typing state: the command typed so far and how many tree lines show. */
  const [typing, setTyping] = useState(
    /** @type {{ chars: number, lines: number } | null} */ (null),
  );
  const [announce, setAnnounce] = useState('');
  const [outage, setOutage] = useState(false);
  /** `clear` also removes the initial summary. */
  const [cleared, setCleared] = useState(false);
  const [input, setInput] = useState('');
  const recall = useRef(/** @type {string[]} */ ([]));
  const recallIndex = useRef(-1);
  const bodyRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const statusRef = useRef(/** @type {HTMLSpanElement | null} */ (null));

  /** Boot typing sequence: `idle` → `waiting` (slit opening) → `done`. */
  const [sequence, setSequence] = useState(/** @type {'idle' | 'waiting' | 'done'} */ ('idle'));

  // Boot intro handoff: once the slit opens, type the command, then the tree.
  // Subscribed to the store (not keyed on the phase) so the sequence survives
  // the intro finishing while it is still typing.
  useEffect(() => {
    if (!env.fx || reduced) return undefined;
    let cancelled = false;
    let started = false;
    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      setSequence('waiting');
      await sleep(1100);
      for (let i = 1; i <= command.length && !cancelled; i += 1) {
        setTyping({ chars: i, lines: 0 });
        await sleep(26 + Math.random() * 34);
      }
      await sleep(180);
      for (let i = 1; i <= stack.length && !cancelled; i += 1) {
        setTyping({ chars: command.length, lines: i });
        sfx('tick');
        await sleep(110);
      }
      if (cancelled) return;
      setTyping(null);
      setSequence('done');
    };
    const check = () => {
      if (started || bootStore.get().phase !== 'revealing') return;
      started = true;
      run();
    };
    check();
    const off = bootStore.subscribe(check);
    return () => {
      cancelled = true;
      off();
    };
  }, [command, stack, reduced]);

  // Uptime + FPS: real, idle, written straight to the DOM once a second.
  useEffect(() => {
    const started = performance.now();
    const tick = () => {
      const el = statusRef.current;
      if (!el) return;
      const s = Math.floor((performance.now() - started) / 1000);
      const clock = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
        .map((n) => String(n).padStart(2, '0'))
        .join(':');
      const { fps } = meshStats.get();
      el.textContent = `uptime ${clock}${fps ? ` · ${fps} fps` : ''} · 200 OK`;
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [history, typing]);

  const perform = useCallback(
    (/** @type {import('../lib/terminal').TermEffect | undefined} */ effect) => {
      if (!effect) return;
      switch (effect.type) {
        case 'clear':
          setHistory([]);
          setCleared(true);
          break;
        case 'scroll': {
          const target = document.getElementById(effect.target);
          if (target) window.setTimeout(() => scrollTo(target), 450);
          break;
        }
        case 'download': {
          const link = document.createElement('a');
          link.href = effect.href;
          link.download = '';
          link.click();
          break;
        }
        case 'theme':
          toggleTheme();
          break;
        case 'locale':
          window.setTimeout(() => switchLocale(locale === 'ar' ? 'en' : 'ar'), 350);
          break;
        case 'outage':
          sfx('down');
          emit(EVENTS.outage);
          setOutage(true);
          break;
        default:
      }
    },
    [locale, scrollTo, switchLocale, toggleTheme],
  );

  const submit = (/** @type {import('react').FormEvent} */ event) => {
    event.preventDefault();
    const value = input.trim();
    setInput('');
    recallIndex.current = -1;
    if (!value) return;
    recall.current = [value, ...recall.current.filter((entry) => entry !== value)].slice(0, 20);
    const result = runCommand(value, {
      t,
      general,
      hero,
      projects: projectsData?.data ?? [],
    });
    sfx(result.lines[0]?.tone === 'error' ? 'blip' : 'tick');
    setHistory((previous) =>
      [
        ...(previous ?? []),
        ...rows([{ text: value, tone: 'plain' }]).map((row) => ({ ...row, prompt: true })),
        ...rows(result.lines),
      ].slice(-MAX_LINES),
    );
    setAnnounce(result.lines.map((line) => line.text).join('. '));
    perform(result.effect);
  };

  const onKeyDown = (/** @type {import('react').KeyboardEvent<HTMLInputElement>} */ event) => {
    if (event.key === 'Tab' && input.trim()) {
      const completion = completeCommand(input);
      if (completion) {
        event.preventDefault();
        setInput(completion);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const list = recall.current;
      if (list.length === 0) return;
      event.preventDefault();
      const next =
        event.key === 'ArrowUp'
          ? Math.min(recallIndex.current + 1, list.length - 1)
          : Math.max(recallIndex.current - 1, -1);
      recallIndex.current = next;
      setInput(next === -1 ? '' : list[next]);
    } else if (event.key.length === 1) {
      sfx('tick');
    }
  };

  const onOutageDone = useCallback(() => {
    setOutage(false);
    setHistory((previous) =>
      [
        ...(previous ?? []),
        ...rows([{ text: 'php artisan up', tone: 'plain' }]).map((row) => ({
          ...row,
          prompt: true,
        })),
        ...rows([{ text: t('terminal.up'), tone: 'ok' }]),
      ].slice(-MAX_LINES),
    );
    setAnnounce(t('terminal.up'));
    sfx('up');
  }, [t]);

  // While the intro covers the page (and until the typing starts) the summary
  // is hidden; derived from the phase, which is `off` during hydration, so the
  // first client render always matches the prerendered HTML.
  const awaitingBoot =
    env.fx &&
    !reduced &&
    (phase === 'pending' ||
      phase === 'running' ||
      (phase === 'revealing' && sequence === 'idle') ||
      sequence === 'waiting');
  const view = typing ?? (awaitingBoot ? { chars: 0, lines: 0 } : null);
  const tree = stackTree(stack);
  const shownCommand = view ? command.slice(0, view.chars) : command;
  const shownTree = view ? tree.slice(0, view.lines) : tree;
  const booting = view !== null;

  return (
    <div className="hero-terminal" data-hero-terminal>
      <div className="hero-terminal__inner glass" data-terminal-inner>
        <div className="term__bar" aria-hidden="true">
          <span className="term__lights">
            <i />
            <i />
            <i />
          </span>
          <span className="term__title" dir="ltr">
            ~/portfolio — zsh
          </span>
        </div>

        <div ref={bodyRef} className="term__body" dir="ltr" aria-hidden="true">
          {!cleared && (
            <>
              <p className="term__line">
                <span className="term__ps1">$</span> {shownCommand}
                {booting && view.lines === 0 && <span className="term__caret" />}
              </p>
              {shownTree.map((line) => (
                <p key={line.text} className="term__line term__line--tree" data-tone={line.tone}>
                  {line.text}
                </p>
              ))}
            </>
          )}
          {(history ?? []).map((row) => (
            <p
              key={row.id}
              className={cn('term__line', row.prompt && 'term__line--input')}
              data-tone={row.tone}
              dir="auto"
            >
              {row.prompt && <span className="term__ps1">$</span>} {row.text}
            </p>
          ))}
        </div>

        <p className="term__status" aria-hidden="true">
          <span ref={statusRef} dir="ltr">
            uptime 00:00:00 · 200 OK
          </span>
        </p>

        <form className="term__prompt" onSubmit={submit} data-no-burst>
          <label htmlFor="hero-terminal-input" className="sr-only">
            {t('hero.terminal.label')}
          </label>
          <span className="term__ps1" aria-hidden="true">
            $
          </span>
          <input
            id="hero-terminal-input"
            className="term__input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t('hero.terminal.placeholder')}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            dir="ltr"
          />
        </form>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>

      {outage && (
        <Suspense fallback={null}>
          <OutageOverlay onDone={onOutageDone} />
        </Suspense>
      )}
    </div>
  );
}
