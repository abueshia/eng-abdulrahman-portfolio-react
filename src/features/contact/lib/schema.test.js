import { describe, expect, it } from 'vitest';

import { contactSchema, fingerprint, requestPreview, toPayload } from './schema';

const VALID = {
  name: 'Sample Person',
  email: 'person@example.com',
  phone: '',
  type: 'api',
  message: 'We need a documented REST API.',
  website: '',
};

/** Error message keys per field. */
const errorsOf = (values) => {
  const result = contactSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe('contact schema', () => {
  it('accepts a valid request', () => {
    expect(contactSchema.safeParse(VALID).success).toBe(true);
  });

  it('returns i18n keys for every rule', () => {
    expect(
      errorsOf({ ...VALID, name: 'a', email: 'nope', phone: '12', type: '', message: 'short' }),
    ).toEqual({
      name: 'contact.errors.nameMin',
      email: 'contact.errors.emailInvalid',
      phone: 'contact.errors.phoneInvalid',
      type: 'contact.errors.typeInvalid',
      message: 'contact.errors.messageMin',
    });
  });

  it('refuses HTML in free-text fields', () => {
    expect(errorsOf({ ...VALID, message: 'Hello <script>alert(1)</script> there' })).toEqual({
      message: 'contact.errors.html',
    });
    expect(errorsOf({ ...VALID, name: '<b>Bold</b>' })).toEqual({ name: 'contact.errors.html' });
    // Comparisons are text, not markup.
    expect(errorsOf({ ...VALID, message: 'Budget is < 5 and > 2, flexible.' })).toEqual({});
  });

  it('builds the payload: trimmed, optional fields omitted, honeypot only when filled', () => {
    expect(toPayload({ ...VALID, name: '  Sample Person  ' })).toEqual({
      name: 'Sample Person',
      email: 'person@example.com',
      type: 'api',
      message: 'We need a documented REST API.',
    });
    expect(toPayload({ ...VALID, website: 'http://spam' }).website).toBe('http://spam');
  });

  it('previews the exact request, never showing the honeypot', () => {
    const preview = requestPreview({ ...VALID, website: 'http://spam' }, 'ar');
    expect(preview.split('\n')[0]).toBe('POST /api/v1/contact?lang=ar HTTP/1.1');
    expect(preview).toContain('"email": "person@example.com"');
    expect(preview).not.toContain('spam');
  });

  it('fingerprints identical requests identically', () => {
    expect(fingerprint(toPayload(VALID))).toBe(fingerprint(toPayload({ ...VALID, website: 'x' })));
  });
});
