import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { THEME_STORAGE_KEY, resolveInitialTheme } from '@/context/theme-context';
import { useTheme } from '@/hooks/useTheme';
import ar from '@/i18n/locales/ar.json';
import { subscribeTheme } from '@/lib/theme';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setMediaQueryMatches } from '@/test/setup';

function ThemeReadout() {
  const { theme } = useTheme();
  return (
    <div>
      <span data-testid="active-theme">{theme}</span>
      <ThemeToggle />
    </div>
  );
}

/** Calls toggleTheme several times inside ONE event, before React can re-render. */
function BurstButton({ times }) {
  const { toggleTheme } = useTheme();
  return (
    <button type="button" onClick={() => Array.from({ length: times }).forEach(toggleTheme)}>
      burst
    </button>
  );
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('Theme system (ThemeProvider & ThemeToggle)', () => {
  it('opens in dark for a new visitor with nothing stored', () => {
    expect(resolveInitialTheme()).toBe('dark');
    renderWithProviders(<ThemeReadout />);

    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignores the OS colour scheme: still dark when the system prefers light', () => {
    setMediaQueryMatches('(prefers-color-scheme: light)', true);

    expect(resolveInitialTheme()).toBe('dark');
    renderWithProviders(<ThemeReadout />);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('honours an explicitly saved light choice', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');

    renderWithProviders(<ThemeReadout />);

    expect(screen.getByTestId('active-theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('toggles between dark and light, updating data-theme, meta theme-color and localStorage', async () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    const { user } = renderWithProviders(<ThemeReadout />);
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('active-theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(meta.getAttribute('content')).toBe('#f4f1ea');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#07080b');

    meta.remove();
  });

  it('survives a burst of rapid clicks: every click lands and nothing is left between themes', async () => {
    renderWithProviders(<ThemeReadout />);
    const button = screen.getByRole('button');
    /** What the canvas layers see, at the moment they are told. */
    const seen = [];
    const off = subscribeTheme((theme) =>
      seen.push({
        theme,
        dom: document.documentElement.dataset.theme,
        transitionsOff: document.documentElement.hasAttribute('data-theme-switching'),
      }),
    );

    for (let i = 0; i < 11; i += 1) fireEvent.click(button);

    // Strict alternation, starting from dark: 11 clicks end on light.
    expect(seen.map((entry) => entry.theme)).toEqual(
      Array.from({ length: 11 }, (_, i) => (i % 2 === 0 ? 'light' : 'dark')),
    );
    // Subscribers are notified after the DOM switched, with transitions suppressed.
    for (const entry of seen) {
      expect(entry.dom).toBe(entry.theme);
      expect(entry.transitionsOff).toBe(true);
    }
    // React, the DOM, storage and the button label all agree.
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(screen.getByTestId('active-theme')).toHaveTextContent('light');
    expect(button).toHaveAttribute('aria-label', ar.theme.switchToDark);

    // Transitions come back on the next frame, with nothing left mid-fade.
    await nextFrame();
    expect(document.documentElement.hasAttribute('data-theme-switching')).toBe(false);
    off();
  });

  it('alternates correctly even when clicks land before React re-renders', () => {
    renderWithProviders(<BurstButton times={4} />);

    fireEvent.click(screen.getByRole('button'));

    // dark → light → dark → light → dark. A toggle based on the last render's
    // theme would have set "light" four times and ended on light.
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
