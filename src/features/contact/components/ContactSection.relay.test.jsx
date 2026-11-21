import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { contactService } from '@/services/api';
import { renderWithProviders } from '@/test/renderWithProviders';
import ContactSection from './ContactSection';

// A production build still on the mock adapter: the form relays to WhatsApp.
vi.mock('@/config/env', async (importOriginal) => {
  const actual = /** @type {any} */ (await importOriginal());
  return { ...actual, env: { ...actual.env, useMock: true, contactRelay: true } };
});

afterEach(() => vi.restoreAllMocks());

describe('Contact form in relay mode (production without the API)', () => {
  it('says up front that sending opens WhatsApp, then opens it pre-filled', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(/** @type {any} */ ({ opener: {} }));
    const send = vi.spyOn(contactService, 'send');
    const { user } = renderWithProviders(<ContactSection />, { initialEntries: ['/en'] });

    expect(
      await screen.findByText(/Sending opens WhatsApp with a message pre-filled/),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Name/), 'Sample Person');
    await user.type(screen.getByLabelText(/Email/), 'person@example.com');
    await user.selectOptions(screen.getByLabelText(/Project type/), 'api');
    await user.type(screen.getByLabelText(/Message/), 'We need a documented REST API.');
    await user.click(screen.getByRole('button', { name: /Send via WhatsApp/ }));

    expect(await screen.findByText('Your message is ready in WhatsApp.')).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
    const [url, target] = open.mock.calls[0];
    expect(target).toBe('_blank');
    expect(String(url)).toMatch(/^https:\/\/wa\.me\/201028292449\?text=/);
    const text = decodeURIComponent(String(url).split('text=')[1]);
    expect(text).toContain("Hello, I'm Sample Person.");
    expect(text).toContain('Email: person@example.com');
    expect(text).toContain('Project type: API design & development');
    expect(text).toContain('We need a documented REST API.');
    // No "mock: not delivered" claim in relay mode, and a manual fallback link.
    expect(screen.queryByText(/Mock mode: not delivered/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Didn't open\? Open WhatsApp/ })).toHaveAttribute(
      'href',
      String(url),
    );
    expect(screen.getByText('302 Found → WhatsApp')).toBeInTheDocument();
  });
});
