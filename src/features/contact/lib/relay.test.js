import { describe, expect, it } from 'vitest';

import { relayMessage, relayTarget, whatsappNumber } from './relay';

const labels = {
  greeting: "Hello, I'm Sample Person.",
  email: 'Email',
  phone: 'Phone',
  type: 'Project type',
};
const payload = {
  name: 'Sample Person',
  email: 'person@example.com',
  type: 'api',
  message: 'We need a documented REST API.',
};

describe('contact relay', () => {
  it('builds a readable message from the form fields', () => {
    expect(relayMessage(payload, labels, 'API design & development')).toBe(
      [
        "Hello, I'm Sample Person.",
        'Email: person@example.com',
        'Project type: API design & development',
        '',
        'We need a documented REST API.',
      ].join('\n'),
    );
    expect(relayMessage({ ...payload, phone: '+201000000000' }, labels)).toContain(
      'Phone: +201000000000',
    );
  });

  it('extracts the WhatsApp number from a wa.me link or a phone value', () => {
    expect(whatsappNumber('https://wa.me/201028292449')).toBe('201028292449');
    expect(whatsappNumber('+20 102 829 2449')).toBe('201028292449');
    expect(whatsappNumber('not a number')).toBeNull();
    expect(whatsappNumber(undefined)).toBeNull();
  });

  it('prefers WhatsApp with the message encoded, and falls back to mailto', () => {
    const message = relayMessage(payload, labels);
    const whatsapp = relayTarget(
      { whatsapp: 'https://wa.me/201028292449', email: 'a@b.co', subject: 'Hi' },
      message,
    );
    expect(whatsapp?.channel).toBe('whatsapp');
    expect(whatsapp?.url.startsWith('https://wa.me/201028292449?text=')).toBe(true);
    expect(decodeURIComponent(whatsapp?.url.split('text=')[1] ?? '')).toBe(message);

    const email = relayTarget({ email: 'a@b.co', subject: 'Project request' }, message);
    expect(email).toEqual({
      channel: 'email',
      url: `mailto:a@b.co?subject=Project%20request&body=${encodeURIComponent(message)}`,
    });
    expect(relayTarget({ subject: 'x' }, message)).toBeNull();
  });
});
