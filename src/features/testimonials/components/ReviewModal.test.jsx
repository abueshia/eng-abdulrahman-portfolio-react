import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { testimonialsService } from '@/services/api';
import { ApiError } from '@/services/api/errors';
import { renderWithProviders } from '@/test/renderWithProviders';
import projectsEn from '../../../../docs/api-fixtures/projects.index.per_page50.en.json';
import testimonialsEn from '../../../../docs/api-fixtures/testimonials.index.en.json';
import TestimonialsSection from './TestimonialsSection';

const THANKS = 'Thank you! Your review has been received and will appear after review.';

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
  await user.type(d.getByLabelText(/Job title/), 'Operations lead');
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
    // The job title is optional in the API contract.
    expect(d.getByLabelText(/Job title/)).toHaveAttribute('aria-invalid', 'false');
    expect(d.getByText('Please choose a rating from 1 to 5 stars.')).toBeInTheDocument();
    expect(d.getByText('Tell a little more (at least 10 characters).')).toBeInTheDocument();
    expect(d.getByText('Please agree to the publication to send your review.')).toBeInTheDocument();
    expect(d.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');

    await user.type(d.getByLabelText('Name'), '<b>x</b>');
    expect(await d.findByText('HTML is not allowed here.')).toBeInTheDocument();
  });

  it('counts characters as the review is typed', async () => {
    const { user, dialog } = await openForm();
    const d = within(dialog);
    expect(d.getByText('0 / 1000 characters')).toBeInTheDocument();
    await user.type(d.getByLabelText('Your review'), 'Hello');
    expect(d.getByText('5 / 1000 characters')).toBeInTheDocument();
    expect(d.getByLabelText('Your review')).toHaveAccessibleDescription('5 / 1000 characters');
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

describe('Write a review: submission (POST /testimonials contract)', () => {
  it('posts the API fields, thanks the visitor, says it was not delivered (not live), never lists it', async () => {
    const submit = vi.spyOn(testimonialsService, 'submit');
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    const status = await within(dialog).findByText(THANKS);
    const panel = /** @type {HTMLElement} */ (status.closest('.req__result'));
    expect(panel).toHaveFocus();
    // Tests run with no live resource: the mock answered, and the panel says so.
    expect(within(panel).getByText(/Mock mode: not delivered/)).toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        name: 'Visitor Reviewer',
        name_job: 'Operations lead',
        description: 'A calm, well organised project from start to finish.',
        rating: 4,
        consent: true,
        website: '',
      }),
    );
    expect(submit.mock.calls[0][0]).not.toHaveProperty('hp');
    expect(await submit.mock.results[0].value).toMatchObject({ code: 201 });

    // Stored inactive: neither the rendered list nor a fresh fetch shows it.
    await user.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Visitor Reviewer')).not.toBeInTheDocument();
    const list = await testimonialsService.list({ lang: 'en' });
    expect(list.data.some((item) => item.name === 'Visitor Reviewer')).toBe(false);
    expect(list.data).toHaveLength(testimonialsEn.data.length);
  });

  it('links the review to a published project picked from the API list', async () => {
    const submit = vi.spyOn(testimonialsService, 'submit');
    const { user, dialog } = await openForm();
    const d = within(dialog);
    const select = await d.findByLabelText('Project (optional)');
    // "No specific project" + every published project.
    expect(within(select).getAllByRole('option')).toHaveLength(projectsEn.data.length + 1);
    await fillValid(user, dialog);
    await user.selectOptions(select, String(projectsEn.data[1].id));
    await user.click(d.getByRole('button', { name: /Submit review/ }));
    await d.findByText(THANKS);
    expect(submit.mock.calls[0][0].project_id).toBe(projectsEn.data[1].id);
  });

  it('looks accepted when the honeypot is filled, and sends nothing', async () => {
    const submit = vi.spyOn(testimonialsService, 'submit');
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    fireEvent.change(/** @type {HTMLElement} */ (dialog.querySelector('#review-website')), {
      target: { value: 'https://spam.example' },
    });
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));
    await within(dialog).findByText(THANKS);
    expect(submit.mock.calls[0][0].website).toBe('https://spam.example');
    expect((await submit.mock.results[0].value).data).toBeNull();
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

  it('shows "500 — Retry" on a server failure and retries the same review', async () => {
    const submit = vi
      .spyOn(testimonialsService, 'submit')
      .mockRejectedValueOnce(new ApiError({ message: 'Server error', status: 500 }));
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('500 — Retry');
    await user.click(within(dialog).getByRole('button', { name: /Retry/ }));
    await within(dialog).findByText(THANKS);
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it('keeps everything typed after a network error, and says so', async () => {
    vi.spyOn(testimonialsService, 'submit').mockRejectedValueOnce(
      new ApiError({ message: 'Network Error', status: 0 }),
    );
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    const d = within(dialog);
    expect(await d.findByRole('alert')).toHaveTextContent(/could not be reached/);
    expect(d.getByLabelText('Name')).toHaveValue('Visitor Reviewer');
    expect(d.getByLabelText('Your review')).toHaveValue(
      'A calm, well organised project from start to finish.',
    );
    expect(d.getByRole('radio', { name: /4 stars/ })).toBeChecked();
  });

  it('says "try again later" on 429 (one hour for reviews) and keeps the review', async () => {
    vi.spyOn(testimonialsService, 'submit').mockRejectedValueOnce(
      new ApiError({
        message: 'Too Many Attempts.',
        status: 429,
        cause: { response: { status: 429, headers: { 'retry-after': '3600' } } },
      }),
    );
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    const d = within(dialog);
    expect(await d.findByRole('alert')).toHaveTextContent(/try again in about 60 min/);
    expect(d.getByLabelText('Name')).toHaveValue('Visitor Reviewer');
  });

  it('maps 422 errors onto their fields: translatable keys (name.en) and the photo', async () => {
    vi.spyOn(testimonialsService, 'submit').mockRejectedValueOnce(
      new ApiError({
        message: 'The given data was invalid.',
        status: 422,
        errors: {
          'name.en': ['The name looks like spam.'],
          name_job: ['The job title looks like spam.'],
          image: ['The image failed the server check.'],
        },
      }),
    );
    const { user, dialog } = await openForm();
    await fillValid(user, dialog);
    await user.click(within(dialog).getByRole('button', { name: /Submit review/ }));

    const d = within(dialog);
    expect(await d.findByText('The name looks like spam.')).toBeInTheDocument();
    expect(d.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(d.getByText('The job title looks like spam.')).toBeInTheDocument();
    expect(d.getByLabelText(/Job title/)).toHaveAttribute('aria-invalid', 'true');
    expect(d.getByRole('alert')).toHaveTextContent('The image failed the server check.');
    expect(d.getAllByText('422 — Some fields need attention.').length).toBeGreaterThan(0);
    // Values stay for correction.
    expect(d.getByLabelText('Name')).toHaveValue('Visitor Reviewer');
  });
});
