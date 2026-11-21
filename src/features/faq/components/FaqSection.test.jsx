import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import FaqSection from './FaqSection';

describe('FAQ (man faq)', () => {
  it('renders every answer and keeps a single question open', async () => {
    const { container } = renderWithProviders(<FaqSection />, { initialEntries: ['/en'] });
    await screen.findByText('How do you usually work?');

    const items = /** @type {HTMLDetailsElement[]} */ ([...container.querySelectorAll('details')]);
    expect(items).toHaveLength(13);
    expect(items[0].open).toBe(true);
    // Closed answers are still in the DOM (and in the prerendered HTML).
    expect(screen.getByText(/it does not guarantee them/)).toBeInTheDocument();

    items[2].open = true;
    fireEvent(items[2], new Event('toggle'));
    expect(items.filter((item) => item.open)).toEqual([items[2]]);
  });
});
