/**
 * Contact form contract: validation (zod, error messages are i18n keys), the
 * payload sent to `POST /contact` (API_CONTRACT.md §7), the mapping of the
 * server's 422 keys back onto the fields, and the live request preview.
 *
 * Mirrors the Laravel rules (name and email up to 150, message up to 5000)
 * and is a little stricter (a name of 2+ characters, a 10+ character
 * message): the server stays the authority.
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
    .max(150, 'contact.errors.emailInvalid')
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
    .max(5000, 'contact.errors.messageMax')
    .refine(plain, 'contact.errors.html'),
  // Honeypot: hidden from people; bots fill it. Never validated client-side
  // and never sent (a filled one looks accepted and sends nothing).
  website: z.string().optional(),
});

/** @typedef {z.input<typeof contactSchema>} ContactValues */

/** @type {ContactValues} */
export const EMPTY_CONTACT = { name: '', email: '', phone: '', type: '', message: '', website: '' };

/**
 * The project types offered by the form (settings) map onto the API's
 * request `type`; the chosen label itself travels as `service`.
 * @type {Record<string, import('@/services/api/contact.service').ContactPayload['type']>}
 */
const REQUEST_TYPES = { consulting: 'consultation', other: 'general_contact' };

/**
 * @param {string} value Project type value from `settings.contact.project_types`.
 * @returns {import('@/services/api/contact.service').ContactPayload['type']}
 */
export const requestType = (value) => REQUEST_TYPES[value] ?? 'project_inquiry';

/**
 * The JSON body for `POST /contact` (empty optional fields omitted).
 * @param {ContactValues} values
 * @param {string} [serviceLabel] Human label of the chosen project type.
 * @returns {import('@/services/api/contact.service').ContactPayload}
 */
export function toPayload(values, serviceLabel) {
  const trim = (/** @type {string | undefined} */ v) => (v ?? '').trim();
  const service = trim(serviceLabel) || trim(values.type);
  return {
    name: trim(values.name),
    email: trim(values.email),
    ...(trim(values.phone) ? { phone: trim(values.phone) } : {}),
    type: requestType(values.type),
    ...(service ? { service } : {}),
    message: trim(values.message),
    ...(values.website ? { website: values.website } : {}),
  };
}

/** API keys (API_CONTRACT.md §7) → form field; honeypot keys map to nothing. */
const FIELD_OF = /** @type {Record<string, keyof ContactValues>} */ ({
  name: 'name',
  email: 'email',
  phone: 'phone',
  message: 'message',
  service: 'type',
  type: 'type',
});

/**
 * The form field a 422 key belongs to (`name.0` → `name`), or `null`.
 * @param {string} key
 * @returns {keyof ContactValues | null}
 */
export const contactFieldFor = (key) => FIELD_OF[String(key).split('.')[0]] ?? null;

/**
 * Stable fingerprint of a payload, to refuse sending the same request twice.
 * @param {ReturnType<typeof toPayload>} payload
 */
export const fingerprint = (payload) =>
  JSON.stringify([
    payload.name,
    payload.email,
    payload.phone ?? '',
    payload.type,
    payload.service ?? '',
    payload.message,
  ]);

/**
 * The request as it will go on the wire, for the live preview (plain text;
 * the honeypot is never shown).
 * @param {ContactValues} values
 * @param {'ar' | 'en'} lang
 * @param {string} [serviceLabel] Human label of the chosen project type.
 */
export function requestPreview(values, lang, serviceLabel) {
  const { website: _honeypot, ...body } = toPayload(values, serviceLabel);
  return [
    `POST /api/v1/contact?lang=${lang} HTTP/1.1`,
    'Content-Type: application/json',
    `Accept-Language: ${lang}`,
    '',
    JSON.stringify(body, null, 2),
  ].join('\n');
}
