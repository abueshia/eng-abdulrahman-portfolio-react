import { screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LocaleSwitch } from '@/components/layout/LocaleSwitch';
import { getLocaleFromPath, localizePath, stripLocale } from '@/config/routes';
import { useLocale } from '@/hooks/useLocale';
import { renderWithProviders } from '@/test/renderWithProviders';

function LocaleProbe() {
  const { locale, dir, isRTL, localize } = useLocale();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="dir">{dir}</span>
      <span data-testid="rtl">{String(isRTL)}</span>
      <span data-testid="path">{pathname}</span>
      <span data-testid="localized-blog">{localize('/blog')}</span>
      <span data-testid="nav-projects">{t('nav.projects')}</span>
      <LocaleSwitch />
    </div>
  );
}

describe('Locale & RTL/LTR routing system', () => {
  it('computes locale paths accurately via route helpers', () => {
    expect(getLocaleFromPath('/')).toBe('ar');
    expect(getLocaleFromPath('/projects/nexus')).toBe('ar');
    expect(getLocaleFromPath('/en')).toBe('en');
    expect(getLocaleFromPath('/en/projects/nexus')).toBe('en');

    expect(stripLocale('/en/projects/nexus')).toBe('/projects/nexus');
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/projects/nexus')).toBe('/projects/nexus');

    expect(localizePath('ar', '/blog')).toBe('/blog');
    expect(localizePath('en', '/blog')).toBe('/en/blog');
    expect(localizePath('en', '/')).toBe('/en');
  });

  it('defaults to Arabic (RTL) on unprefixed routes and syncs <html lang/dir>', () => {
    renderWithProviders(<LocaleProbe />, { initialEntries: ['/'] });

    expect(screen.getByTestId('locale')).toHaveTextContent('ar');
    expect(screen.getByTestId('dir')).toHaveTextContent('rtl');
    expect(screen.getByTestId('rtl')).toHaveTextContent('true');
    expect(screen.getByTestId('nav-projects')).toHaveTextContent('الأعمال');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('activates English (LTR) on /en routes and syncs <html lang/dir>', () => {
    renderWithProviders(<LocaleProbe />, { initialEntries: ['/en/projects/nexus'] });

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('rtl')).toHaveTextContent('false');
    expect(screen.getByTestId('localized-blog')).toHaveTextContent('/en/blog');
    expect(screen.getByTestId('nav-projects')).toHaveTextContent('Work');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('switches language immediately without reload, preserving the current route', async () => {
    const { user } = renderWithProviders(<LocaleProbe />, {
      initialEntries: ['/projects/nexus-commerce-platform'],
    });

    expect(screen.getByTestId('locale')).toHaveTextContent('ar');
    expect(document.documentElement.dir).toBe('rtl');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('path')).toHaveTextContent('/en/projects/nexus-commerce-platform');
    expect(screen.getByTestId('nav-projects')).toHaveTextContent('Work');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');

    await user.click(screen.getByRole('button'));

    expect(screen.getByTestId('locale')).toHaveTextContent('ar');
    expect(screen.getByTestId('path')).toHaveTextContent('/projects/nexus-commerce-platform');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
