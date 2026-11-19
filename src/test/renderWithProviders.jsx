import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { MemoryRouter } from 'react-router-dom';

import { LocaleProvider } from '@/context/LocaleContext';
import { ThemeProvider } from '@/context/ThemeContext';

/**
 * Creates an isolated QueryClient for tests (no retries, no caching across tests).
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

/**
 * Renders a component tree inside all application providers (
 * `QueryClientProvider`, `ThemeProvider`, `MemoryRouter`, `LocaleProvider`).
 *
 * @param {import('react').ReactElement} ui
 * @param {Object} [options]
 * @param {string[]} [options.initialEntries=['/']]
 * @param {QueryClient} [options.queryClient]
 */
export function renderWithProviders(
  ui,
  { initialEntries = ['/'], queryClient = createTestQueryClient(), ...renderOptions } = {},
) {
  const user = userEvent.setup();

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LazyMotion features={domAnimation} strict>
            <MotionConfig reducedMotion="always">
              <MemoryRouter initialEntries={initialEntries}>
                <LocaleProvider>{children}</LocaleProvider>
              </MemoryRouter>
            </MotionConfig>
          </LazyMotion>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    user,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
