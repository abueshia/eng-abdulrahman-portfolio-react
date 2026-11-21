import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { testimonialsService } from '@/services/api';
import { ApiError } from '@/services/api/errors';
import { renderWithProviders } from '@/test/renderWithProviders';
import TestimonialsSection from './TestimonialsSection';

// Canvas is not available in jsdom: the resize step is stubbed, the checks are real.
vi.mock('../lib/avatar-image', async (importOriginal) => {
  const actual = /** @type {any} */ (await importOriginal());
  return {
    ...actual,
    squareAvatar: vi.fn(async () => new Blob(['webp'], { type: 'image/webp' })),
  };
});

beforeAll(() => {
  // jsdom has no modal dialogs: emulate the open/close state.
  const proto = HTMLDialogElement.prototype;
  proto.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  proto.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => vi.restoreAllMocks());

/** @param {string} [entry] */
async function openForm(entry = '/en') {
  const view = renderWithProviders(<TestimonialsSection />, { initialEntries: [entry] });
  const name = entry === '/en' ? 'Write a review' : 'اكتب مراجعتك';
  const cta = await screen.findByRole('button', { name });
  cta.focus();
  await view.user.keyboard('{Enter}');
  const dialog = await screen.findByRole('dialog', { name });
  return { ...view, cta, dialog };
}

/** Fills every required field with valid values (English UI). */
async function fillValid(user, dialog) {
  const d = within(dialog);
  await user.type(d.getByLabelText('Name'), 'Visitor Reviewer');
  await user.type(d.getByLabelText('Job title'), 'Operations lead');
  await user.click(d.getByRole('radio', { name: /4 stars/ }));
  fireEvent.change(d.getByLabelText('Your review'), {
    target: { value: 'A calm, well organised project from start to finish.' },
  });
  await user.click(d.getByRole('checkbox'));
}

describe('Write a review: trigger and dialog', () => {
  it('opens from the keyboard, closes with Esc and returns focus to the trigger', async () => {
    const { user, cta, dialog } = await openForm();
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(/Nothing is published instantly/);
    expect(cta).toHaveAttribute('aria-haspopup', 'dialog');
    await waitFor(() => expect(within(dialog).getByLabelText('Name')).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(cta).toHaveFocus();
  });

  it('closes from the close button and from a click on the backdrop', async () => {
    const { user, cta, dialog } = await openForm();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(cta).toHaveFocus();

    await user.click(cta);
    const again = await screen.findByRole('dialog', { name: 'Write a review' });
    // A click inside the sheet does not close it; a click on the backdrop (the dialog box) does.
    await user.click(within(again).getByText('Write a review', { selector: 'h2' }));
    expect(again).toBeInTheDocument();
    fireEvent.pointerDown(again);
    fireEvent.click(again);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('is fully translated and mirrored in Arabic', async () => {
    const { dialog } = await openForm('/');
    expect(within(dialog).getByLabelText('الاسم')).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: /نجمة واحدة.*ضعيف/ })).toBeInTheDocument();
    expect(within(dialog).getByText(/أوافق على نشر اسمي ومسماي ورأيي/)).toBeInTheDocument();
  });
});

describe('Write a review: fields', () => {
  it('validates every required field with translated messages', async () => {
    const { user, dialog } = await openForm();
    const d = within(dialog);
    await user.click(d.getByRole('button', { name: /Submit review/ }));

    expect(
      await d.findByText('Please enter your name (at least 2 characters).'),
    ).toBeInTheDocument();
    expect(d.getByText('Please enter your job title (at least 2 characters).')).toBeInTheDocument();
    expect(d.getByText('Please choose a rating from 1 to 5 stars.')).toBeInTheDocument();
    expect(d.getByText('Tell a little more (at least 20 characters).')).toBeInTheDocument();
    expect(d.getByText('Please agree to the publication to send your review.')).toBeInTheDocument();
    expect(d.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');

    await user.type(d.getByLabelText('Name'), '<b>x</b>');
    expect(await d.findByText('HTML is not allowed here.')).toBeInTheDocument();
  });

  it('counts characters as the review is typed', async () => {
    const { user, dialog } = await openForm();
    const d = within(dialog);
    expect(d.getByText('0 / 600 characters')).toBeInTheDocument();
    await user.type(d.getByLabelText('Your review'), 'Hello');
    expect(d.getByText('5 / 600 characters')).toBeInTheDocument();
    expect(d.getByLabelText('Your review')).toHaveAccessibleDescription('5 / 600 characters');
  });

  it('moves through the stars with the arrow keys, in the reading direction', async () => {
    const { user, dialog } = await openForm();
    const d = within(dialog);
    const three = d.getByRole('radio', { name: /3 stars/ });
    await user.click(three);
    expect(d.getByText('Good')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(d.getByRole('radio', { name: /4 stars/ })).toBeChecked();
    expect(d.getByRole('radio', { name: /4 stars/ })).toHaveFocus();
    expect(d.getByText('Very good')).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(d.getByRole('radio', { name: /5 stars, Excellent/ })).toBeChecked();
    await user.keyboard('{ArrowRight}'); // clamps at 5
    expect(d.getByRole('radio', { name: /5 stars/ })).toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(d.getByRole('radio', { name: /3 stars/ })).toBeChecked();
    await user.keyboard('{Home}');
    expect(d.getByRole('radio', { name: /1 star, Poor/ })).toBeChecked();
  });

  it('mirrors the arrow keys in RTL', async () => {
    const { user, dialog } = await openForm('/');
    const d = within(dialog);
    await user.click(d.getByRole('radio', { name: /2 نجمتان|نجمتان/ }));
    await user.keyboard('{ArrowLeft}');
    expect(d.getByRole('radio', { name: /3 نجوم/ })).toBeChecked();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(d.getByRole('radio', { name: /نجمة واحدة/ })).toBeChecked();
  });

  it('shows a generated two-letter avatar that follows the name', async () => {
    const { user, dialog } = await openForm();
    const d = within(dialog);
    expect(d.getByRole('img', { name: 'Generated avatar: —' })).toBeInTheDocument();
    await user.type(d.getByLabelText('Name'), 'sample reviewer');
    expect(d.getByRole('img', { name: 'Generated avatar: SR' })).toHaveTextContent('SR');
    expect(dialog.querySelector('img')).toBeNull(); // no stock image
  });

  it('refuses a file that is not a JPG/PNG/WebP image, and an image of 5 MB or more', async () => {
    const { dialog } = await openForm();
    const d = within(dialog);
    const zone = /** @type {HTMLElement} */ (d.getByRole('group', { name: 'Photo (optional)' }));

    const pdf = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(zone, { dataTransfer: { files: [pdf] } });
    expect(await d.findByRole('alert')).toHaveTextContent(
      'Only JPG, PNG or WebP images are accepted.',
    );

    const big = new File(['x'], 'big.png', { type: 'image/png' });
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 });
    fireEvent.change(d.getByLabelText('Choose a photo'), { target: { files: [big] } });
    expect(await d.findByRole('alert')).toHaveTextContent('The image must be smaller than 5 MB.');
    expect(d.getByLabelText('Choose a photo')).toHaveAttribute('aria-invalid', 'true');
  });

  it('previews an accepted photo in a circle and revokes its object URL on removal and close', async () => {
    const create = vi.fn(() => 'blob:preview-1');
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const { user, dialog } = await openForm();
    const d = within(dialog);

    const photo = new File(['png'], 'me.png', { type: 'image/png' });
    fireEvent.change(d.getByLabelText('Choose a photo'), { target: { files: [photo] } });
    const preview = await d.findByRole('img', { name: 'Your photo' });
    expect(preview).toHaveAttribute('src', 'blob:preview-1');
    expect(preview).toHaveClass('avatar--photo');

    await user.click(d.getByRole('button', { name: 'Remove photo' }));
    expect(revoke).toHaveBeenCalledWith('blob:preview-1');
    expect(d.getByLabelText('Choose a photo')).toHaveFocus();
    expect(d.getByRole('img', { name: /Generated avatar/ })).toBeInTheDocument();

    fireEvent.change(d.getByLabelText('Choose a photo'), { target: { files: [photo] } });
    await d.findByRole('img', { name: 'Your photo' });
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(revoke).toHaveBeenCalledTimes(2);
  });
});

describe('Write a review: submission (mock adapter, development)', () => {
  it('posts the review, thanks the visitor, says it was not delivered, and never lists it', async () => {
    const submit = vi.spyOn(testimonialsService, 'submit');
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    const status = await within(dialog).findByText('Thank you! Your review arrived.');
    const panel = /** @type {HTMLElement} */ (status.closest('.req__result'));
    expect(panel).toHaveFocus();
    expect(within(panel).getByText(/after moderation, not right away/)).toBeInTheDocument();
    expect(within(panel).getByText(/Mock mode: not delivered/)).toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Visitor Reviewer',
        role: 'Operations lead',
        rating: 4,
        consent: true,
        hp: '',
      }),
    );
    const response = await submit.mock.results[0].value;
    expect(response).toMatchObject({ code: 201, data: { status: 'pending' } });

    // Pending: neither the rendered list nor a fresh fetch shows it.
    await user.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Visitor Reviewer')).not.toBeInTheDocument();
    const list = await testimonialsService.list({ lang: 'en' });
    expect(list.data.some((item) => item.name === 'Visitor Reviewer')).toBe(false);
    expect(list.data).toHaveLength(4);
  });

  it('sends the honeypot as is: the API answers 201 and stores nothing', async () => {
    const submit = vi.spyOn(testimonialsService, 'submit');
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    fireEvent.change(/** @type {HTMLElement} */ (dialog.querySelector('#review-hp')), {
      target: { value: 'https://spam.example' },
    });
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));
    await within(dialog).findByText('Thank you! Your review arrived.');
    expect(submit.mock.calls[0][0].hp).toBe('https://spam.example');
    expect((await submit.mock.results[0].value).data).toEqual({ id: 0, status: 'pending' });
  });

  it('sends once on a double click, with a busy progress button', async () => {
    const submit = vi
      .spyOn(testimonialsService, 'submit')
      .mockImplementation(() => new Promise(() => {}));
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    const button = within(dialog).getByRole('button', { name: /Submit review/ });
    await user.dblClick(button);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveTextContent('Submitting…');
  });

  it('shows "500 — Retry" on failure and retries', async () => {
    const submit = vi
      .spyOn(testimonialsService, 'submit')
      .mockRejectedValueOnce(new ApiError({ message: 'Server error', status: 500 }));
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    // Failure: "500 — Retry", and the same review can be retried.
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('500 — Retry');
    await user.click(within(dialog).getByRole('button', { name: /Retry/ }));
    await within(dialog).findByText('Thank you! Your review arrived.');
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('maps 422 errors from the API onto their fields (photo included)', async () => {
    vi.spyOn(testimonialsService, 'submit').mockRejectedValueOnce(
      new ApiError({
        message: 'The given data was invalid.',
        status: 422,
        errors: {
          role: ['The role looks like spam.'],
          avatar: ['The avatar failed the server check.'],
        },
      }),
    );
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    const d = within(dialog);
    expect(await d.findByText('The role looks like spam.')).toBeInTheDocument();
    expect(d.getByLabelText('Job title')).toHaveAttribute('aria-invalid', 'true');
    expect(d.getByRole('alert')).toHaveTextContent('The avatar failed the server check.');
    expect(d.getAllByText('422 — Some fields need attention.').length).toBeGreaterThan(0);
  });
});
