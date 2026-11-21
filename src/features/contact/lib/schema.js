/**
 * Contact form contract: validation (zod, error messages are i18n keys), the
 * payload sent to `POST /contact`, and the live request preview.
 *
 * Mirrors the Laravel ContactRequest rules (and is a little stricter): the
 * server stays the authority and its 422 errors are mapped back onto the
 * fields.
 */
import { z } from 'zod';

/** Rejects anything that looks like markup: the form takes plain text only. */
const HTML = /<\/?[a-z!][^>]*>/i;
const plain = (/** @type {string} */ value) => !HTML.test(value);
const PHONE = /^\+?[0-9\s()-]{7,20}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'contact.errors.nameMin')
    .max(80, 'contact.errors.nameMax')
    .refine(plain, 'contact.errors.html'),
  email: z
    .string()
    .trim()
    .max(160, 'contact.errors.emailInvalid')
    .email('contact.errors.emailInvalid'),
  phone: z
    .string()
    .trim()
    .refine((value) => value === '' || PHONE.test(value), 'contact.errors.phoneInvalid'),
  type: z.string().min(1, 'contact.errors.typeInvalid'),
  message: z
    .string()
    .trim()
    .min(10, 'contact.errors.messageMin')
    .max(2000, 'contact.errors.messageMax')
    .refine(plain, 'contact.errors.html'),
  // Honeypot: hidden from people; bots fill it. Sent as is (the API pretends
  // success and stores nothing), never validated client-side.
  website: z.string().optional(),
});

/** @typedef {z.input<typeof contactSchema>} ContactValues */

/** @type {ContactValues} */
export const EMPTY_CONTACT = { name: '', email: '', phone: '', type: '', message: '', website: '' };

/**
 * The JSON body for `POST /contact` (empty optional fields omitted).
 * @param {ContactValues} values
 */
export function toPayload(values) {
  const trim = (/** @type {string | undefined} */ v) => (v ?? '').trim();
  return {
    name: trim(values.name),
    email: trim(values.email),
    ...(trim(values.phone) ? { phone: trim(values.phone) } : {}),
    type: values.type,
    message: trim(values.message),
    ...(values.website ? { website: values.website } : {}),
  };
}

/**
 * Stable fingerprint of a payload, to refuse sending the same request twice.
 * @param {ReturnType<typeof toPayload>} payload
 */
export const fingerprint = (payload) =>
  JSON.stringify([payload.name, payload.email, payload.phone ?? '', payload.type, payload.message]);

/**
 * The request as it will go on the wire, for the live preview (plain text;
 * the honeypot is never shown).
 * @param {ContactValues} values
 * @param {'ar' | 'en'} lang
 */
export function requestPreview(values, lang) {
  const { website: _honeypot, ...body } = toPayload(values);
  return [
    `POST /api/v1/contact?lang=${lang} HTTP/1.1`,
    'Content-Type: application/json',
    `Accept-Language: ${lang}`,
    '',
    JSON.stringify(body, null, 2),
  ].join('\n');
}
