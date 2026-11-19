import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { THEME_STORAGE_KEY, resolveInitialTheme } from '@/context/theme-context';
import { useTheme } from '@/hooks/useTheme';
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

describe('Theme system (ThemeProvider & ThemeToggle)', () => {
  it('defaults to dark mode when no preference is stored and OS prefers dark', () => {
    expect(resolveInitialTheme()).toBe('dark');
    renderWithProviders(<ThemeReadout />);

    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('respects prefers-color-scheme: light on first visit when localStorage is empty', () => {
    setMediaQueryMatches('(prefers-color-scheme: light)', true);

    expect(resolveInitialTheme()).toBe('light');
    renderWithProviders(<ThemeReadout />);

    expect(screen.getByTestId('active-theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('prioritises saved localStorage theme over OS preference', () => {
    setMediaQueryMatches('(prefers-color-scheme: light)', true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    renderWithProviders(<ThemeReadout />);

    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('toggles between dark and light, updating data-theme, meta theme-color and localStorage', async () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    const { user } = renderWithProviders(<ThemeReadout />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(meta.getAttribute('content')).toBe('#07080b');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('active-theme')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(meta.getAttribute('content')).toBe('#f4f1ea');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('active-theme')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    meta.remove();
  });
});
