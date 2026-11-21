import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { testimonialsService } from '@/services/api';
import { renderWithProviders } from '@/test/renderWithProviders';
import TestimonialsSection from './TestimonialsSection';

// A production build still on the mock adapter: the review form relays to WhatsApp.
vi.mock('@/config/env', async (importOriginal) => {
  const actual = /** @type {any} */ (await importOriginal());
  return { ...actual, env: { ...actual.env, useMock: true, reviewRelay: true } };
});

beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  proto.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => vi.restoreAllMocks());

async function openAndFill() {
  const view = renderWithProviders(<TestimonialsSection />, { initialEntries: ['/en'] });
  await view.user.click(await screen.findByRole('button', { name: 'Write a review' }));
  const dialog = await screen.findByRole('dialog', { name: 'Write a review' });
  const d = within(dialog);
  await view.user.type(d.getByLabelText('Name'), 'Visitor Reviewer');
  await view.user.type(d.getByLabelText('Job title'), 'Operations lead');
  await view.user.type(d.getByLabelText('Company (optional)'), 'Sample Co');
  await view.user.click(d.getByRole('radio', { name: /5 stars/ }));
  fireEvent.change(d.getByLabelText('Your review'), {
    target: { value: 'A calm, well organised project from start to finish.' },
  });
  await view.user.click(d.getByRole('checkbox'));
  return { ...view, dialog, d };
}

describe('Write a review in relay mode (production without the API)', () => {
  it('says up front that WhatsApp is used and the photo is not sent, then opens it pre-filled', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(/** @type {any} */ ({ opener: {} }));
    const submit = vi.spyOn(testimonialsService, 'submit');
    const { user, d } = await openAndFill();

    expect(
      await d.findByText(/Submitting opens WhatsApp with your review pre-filled/),
    ).toHaveTextContent('Your photo is not sent this way, only the text.');
    await user.click(d.getByRole('button', { name: /Send via WhatsApp/ }));

    expect(await d.findByText('Your review is ready in WhatsApp.')).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledTimes(1);
    const [url, target] = open.mock.calls[0];
    expect(target).toBe('_blank');
    expect(String(url)).toMatch(/^https:\/\/wa\.me\/201028292449\?text=/);
    const text = decodeURIComponent(String(url).split('text=')[1]);
    expect(text).toContain("Hello, I'm Visitor Reviewer.");
    expect(text).toContain('Job title: Operations lead · Sample Co');
    expect(text).toContain('Rating 5/5: ★★★★★');
    expect(text).toContain('A calm, well organised project from start to finish.');
    expect(d.queryByText(/Mock mode: not delivered/)).not.toBeInTheDocument();
    expect(d.getByRole('link', { name: /Didn't open\? Open WhatsApp/ })).toHaveAttribute(
      'href',
      String(url),
    );
  });

  it('opens nothing when the honeypot is filled, but looks done', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { user, dialog, d } = await openAndFill();
    fireEvent.change(/** @type {HTMLElement} */ (dialog.querySelector('#review-hp')), {
      target: { value: 'bot' },
    });
    await user.click(d.getByRole('button', { name: /Send via WhatsApp/ }));
    expect(await d.findByText('Your review is ready in WhatsApp.')).toBeInTheDocument();
    expect(open).not.toHaveBeenCalled();
  });
});
