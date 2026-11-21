import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/renderWithProviders';
import { Gallery } from './Gallery';

const IMAGES = [
  { image: '/a.svg', alt: 'First screen' },
  { image: '/b.svg', alt: 'Second screen' },
  { image: '/c.svg', alt: 'Third screen' },
];

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

describe('Gallery lightbox', () => {
  it('opens from a thumbnail, pages with the arrow keys and returns focus on close', async () => {
    const { user } = renderWithProviders(<Gallery images={IMAGES} />, {
      initialEntries: ['/en'],
    });
    const thumb = screen.getByRole('button', { name: /Open image 1 of 3: First screen/ });
    await user.click(thumb);

    const dialog = await screen.findByRole('dialog', { name: 'Image viewer' });
    expect(within(dialog).getByText('1 / 3')).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(within(dialog).getByText('2 / 3')).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'End' });
    expect(within(dialog).getByText('3 / 3')).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'ArrowRight' }); // wraps around
    expect(within(dialog).getByText('1 / 3')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(thumb).toHaveFocus());
  });

  it('follows the reading direction in Arabic: the left arrow moves forward', async () => {
    const { user } = renderWithProviders(<Gallery images={IMAGES} />, { initialEntries: ['/'] });
    await user.click(screen.getAllByRole('button')[0]);
    const dialog = await screen.findByRole('dialog');

    fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
    expect(within(dialog).getByText('2 / 3')).toBeInTheDocument();
    fireEvent.keyDown(dialog, { key: 'ArrowRight' });
    expect(within(dialog).getByText('1 / 3')).toBeInTheDocument();
  });
});
