import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, vi } from 'vitest';

import i18n, { loadLocale } from '@/i18n';
import { registerMockRoutes } from '@/services/api/mock/handlers';
import { fixtureRoutes } from './api-fixtures';

// Live resources have no mock data: serve the real captured API responses.
registerMockRoutes(fixtureRoutes);

// Base strings are lazy chunks in the app; tests use both languages freely.
beforeAll(() => Promise.all([loadLocale('ar'), loadLocale('en')]));

/**
 * Configurable matchMedia stub for jsdom. Tests can flip media query results
 * via `setMediaQueryMatches('(prefers-color-scheme: light)', true)`.
 */
const mediaOverrides = new Map();

/**
 * Sets the match result for a CSS media query during a test.
 * @param {string} query
 * @param {boolean} matches
 */
export function setMediaQueryMatches(query, matches) {
  mediaOverrides.set(query, matches);
}

// Node-environment suites (e.g. prerendering) have no DOM to reset.
const hasDom = typeof window !== 'undefined';

// jsdom lacks scrollIntoView (the mobile skills tab strip keeps the active tab in view).
if (hasDom && !Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};

// jsdom lacks ResizeObserver (used by Lenis when the full app mounts).
if (hasDom && !('ResizeObserver' in window)) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

beforeEach(async () => {
  mediaOverrides.clear();
  if (!hasDom) return;
  window.localStorage.clear();
  window.sessionStorage.clear();
  delete document.documentElement.dataset.theme;
  await i18n.changeLanguage('ar');
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn((query) => ({
      matches: mediaOverrides.get(query) ?? false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  window.scrollTo = vi.fn();
});

afterEach(() => {
  if (hasDom) cleanup();
});
