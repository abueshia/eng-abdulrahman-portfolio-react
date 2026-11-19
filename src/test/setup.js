import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import i18n from '@/i18n';

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
