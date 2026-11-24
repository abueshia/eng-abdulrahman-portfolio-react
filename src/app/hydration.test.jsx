import { hydrate } from '@tanstack/react-query';
import { act, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { prerender } from 'react-dom/static';
import { afterEach, describe, expect, it } from 'vitest';

import App from '@/app/App';
import { createQueryClient } from '@/app/query-client';
import { createAppRouter } from '@/app/router';
import { renderPage } from '@/entry-server';
import i18n from '@/i18n';
import { FIXTURE_SLUG } from '@/test/api-fixtures';
import projectsEn from '../../docs/api-fixtures/projects.index.per_page50.en.json';
import showEn from '../../docs/api-fixtures/projects.show.en.json';

/** @type {import('react-dom/client').Root | undefined} */
let root;
afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = '';
  window.history.replaceState(null, '', '/');
});

/**
 * Prerenders `url`, then hydrates that exact markup like `main.jsx` does and
 * returns every recoverable error React reported (hydration mismatches).
 * @param {string} url
 * @param {string} expectedText Text that proves the page content hydrated.
 */
async function hydrateUrl(url, expectedText) {
  const { html, queryState } = await renderPage(url);
  // Test-only: the server renderer leaves its last context values in place
  // (harmless in a real server, which never runs react-dom/client). A trivial
  // render resets the shared context stack before the client renderer starts.
  await prerender(<i />);
  const container = document.createElement('div');
  container.id = 'root';
  container.innerHTML = html;
  document.body.append(container);

  window.history.replaceState(null, '', url);
  await i18n.changeLanguage(url.startsWith('/en') ? 'en' : 'ar');
  const queryClient = createQueryClient();
  hydrate(queryClient, queryState);

  const errors = [];
  await act(async () => {
    root = hydrateRoot(container, <App router={createAppRouter()} queryClient={queryClient} />, {
      onRecoverableError: (error) => errors.push(error),
    });
  });
  await screen.findAllByText(expectedText, {}, { timeout: 3000 });
  return errors;
}

describe('Hydration of prerendered pages', () => {
  it('hydrates the English case study without mismatches', async () => {
    expect(await hydrateUrl(`/en/projects/${FIXTURE_SLUG}`, showEn.data.title)).toEqual([]);
  });

  it('hydrates a filtered home URL without mismatches (filters apply after hydration)', async () => {
    const errors = await hydrateUrl('/en?type=saas', projectsEn.data[0].title);
    expect(errors).toEqual([]);
  });

  it('hydrates the Arabic home page without mismatches', async () => {
    const errors = await hydrateUrl('/', /عبدالرحمن/);
    expect(errors).toEqual([]);
  });

  it('hydrates for a light-theme visitor (prerendered as dark) without mismatches', async () => {
    document.documentElement.dataset.theme = 'light';
    expect(await hydrateUrl('/en', projectsEn.data[0].title)).toEqual([]);
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
