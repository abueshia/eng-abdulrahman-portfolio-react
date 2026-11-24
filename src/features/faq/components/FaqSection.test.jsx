import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import faqsEn from '../../../../docs/api-fixtures/faqs.index.en.json';
import FaqSection from './FaqSection';

describe('FAQ (man faq)', () => {
  it('renders every API answer and keeps a single question open', async () => {
    const { container } = renderWithProviders(<FaqSection />, { initialEntries: ['/en'] });
    await screen.findByText(faqsEn.data[0].question);

    const items = /** @type {HTMLDetailsElement[]} */ ([...container.querySelectorAll('details')]);
    expect(items).toHaveLength(faqsEn.data.length);
    expect(items[0].open).toBe(true);
    // Closed answers are still in the DOM (and in the prerendered HTML).
    const last = faqsEn.data.at(-1);
    expect(screen.getByText(last?.answer ?? '')).toBeInTheDocument();

    items[2].open = true;
    fireEvent(items[2], new Event('toggle'));
    expect(items.filter((item) => item.open)).toEqual([items[2]]);
  });
});
