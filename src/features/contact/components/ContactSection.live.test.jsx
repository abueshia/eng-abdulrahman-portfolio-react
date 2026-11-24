import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { contactService } from '@/services/api';
import { renderWithProviders } from '@/test/renderWithProviders';
import ContactSection from './ContactSection';

// The production setup: `contact` is a live API resource (VITE_API_RESOURCES).
vi.mock('@/config/api', async (importOriginal) => {
  const actual = /** @type {any} */ (await importOriginal());
  return {
    ...actual,
    api: { ...actual.api, resources: ['contact'], contactRelay: false },
    isLiveResource: (/** @type {string} */ name) => name === 'contact',
  };
});

afterEach(() => vi.restoreAllMocks());

describe('Contact form with the live API', () => {
  it('posts to the API (no WhatsApp relay) and confirms without any mock notice', async () => {
    const open = vi.spyOn(window, 'open');
    const send = vi
      .spyOn(contactService, 'send')
      .mockResolvedValue({ data: { id: 5 }, message: '', code: 201, pagination: undefined });
    const { user } = renderWithProviders(<ContactSection />, { initialEntries: ['/'] });

    await user.type(await screen.findByLabelText(/الاسم/), 'زائر تجريبي');
    await user.type(screen.getByLabelText(/البريد/), 'visitor@example.com');
    await user.selectOptions(screen.getByLabelText(/نوع المشروع/), 'web_app');
    await user.type(screen.getByLabelText(/الرسالة/), 'نحتاج منصة متكاملة للحجوزات.');
    expect(screen.queryByText(/واتساب/, { selector: '.req__relay' })).toBeNull();
    await user.click(screen.getByRole('button', { name: /أرسل الطلب/ }));

    expect(
      await screen.findByText('تم استلام طلبك وسيتم الرد عليك في أقرب وقت.'),
    ).toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(1);
    expect(open).not.toHaveBeenCalled();
    expect(document.querySelector('.req__mock')).toBeNull();
  });
});
