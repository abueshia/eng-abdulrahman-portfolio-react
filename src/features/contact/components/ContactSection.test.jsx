import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { contactService } from '@/services/api';
import { ApiError } from '@/services/api/errors';
import { renderWithProviders } from '@/test/renderWithProviders';
import ContactSection from './ContactSection';

/** Fills the form with a valid request (English UI). */
async function fill(user) {
  await user.type(await screen.findByLabelText(/Name/), 'Sample Person');
  await user.type(screen.getByLabelText(/Email/), 'person@example.com');
  await user.selectOptions(screen.getByLabelText(/Project type/), 'api');
  await user.type(screen.getByLabelText(/Message/), 'We need a documented REST API.');
}

describe('Contact request builder', () => {
  it('validates live, previews the request and answers 201 with an honest mock notice', async () => {
    const { user } = renderWithProviders(<ContactSection />, { initialEntries: ['/en'] });

    // Live validation on blur, with translated messages wired to the field.
    const email = await screen.findByLabelText(/Email/);
    await user.type(email, 'nope');
    await user.tab();
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    await user.clear(email);

    await fill(user);
    expect(screen.getByText(/"name": "Sample Person"/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Send request/ }));
    const result = await screen.findByText('Request received.', {}, { timeout: 3000 });
    const panel = result.closest('.req__result');
    expect(
      within(/** @type {HTMLElement} */ (panel)).getByText(/Mock mode: not delivered/),
    ).toBeInTheDocument();
    expect(screen.getByText('HTTP/1.1 201 Created')).toBeInTheDocument();
  });

  it('maps 422 errors from the API onto their fields', async () => {
    const spy = vi.spyOn(contactService, 'send').mockRejectedValueOnce(
      new ApiError({
        message: 'The given data was invalid.',
        status: 422,
        errors: { email: ['The email has already been used today.'] },
      }),
    );
    const { user } = renderWithProviders(<ContactSection />, { initialEntries: ['/en'] });
    await fill(user);
    await user.click(screen.getByRole('button', { name: /Send request/ }));

    expect(await screen.findByText('The email has already been used today.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('422 — Some fields need attention.')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows "500 — Retry" when the request fails', async () => {
    const spy = vi
      .spyOn(contactService, 'send')
      .mockRejectedValueOnce(new ApiError({ message: 'Server error', status: 500 }));
    const { user } = renderWithProviders(<ContactSection />, { initialEntries: ['/en'] });
    await fill(user);
    await user.click(screen.getByRole('button', { name: /Send request/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('500 — Retry');
    expect(screen.getByRole('button', { name: /Retry/ })).toBeEnabled();
    spy.mockRestore();
  });
});
