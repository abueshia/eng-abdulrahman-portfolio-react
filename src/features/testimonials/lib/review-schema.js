/**
 * Visitor review contract: validation (zod, error messages are i18n keys),
 * the payload sent to `POST /testimonials`, and the duplicate guard.
 *
 * Mirrors the Laravel StoreTestimonialRequest rules documented in the README
 * ("Testimonials API contract"). The server stays the authority: its 422
 * errors are mapped back onto the fields.
 */
import { z } from 'zod';

/** Rejects anything that looks like markup: the form takes plain text only. */
const HTML = /<\/?[a-z!][^>]*>/i;
const plain = (/** @type {string} */ value) => !HTML.test(value);

export const REVIEW_LIMITS = Object.freeze({
  name: { min: 2, max: 60 },
  role: { min: 2, max: 80 },
  company: { max: 80 },
  message: { min: 20, max: 600 },
  rating: { min: 1, max: 5 },
});

const E = 'testimonials.write.errors';

export const reviewSchema = z.object({
  name: z
    .string()
    .trim()
    .min(REVIEW_LIMITS.name.min, `${E}.nameMin`)
    .max(REVIEW_LIMITS.name.max, `${E}.nameMax`)
    .refine(plain, `${E}.html`),
  role: z
    .string()
    .trim()
    .min(REVIEW_LIMITS.role.min, `${E}.roleMin`)
    .max(REVIEW_LIMITS.role.max, `${E}.roleMax`)
    .refine(plain, `${E}.html`),
  company: z
    .string()
    .trim()
    .max(REVIEW_LIMITS.company.max, `${E}.companyMax`)
    .refine(plain, `${E}.html`),
  // Radios give strings (or null when none is checked): 0 means "not chosen".
  rating: z.coerce
    .number()
    .int(`${E}.ratingRequired`)
    .min(REVIEW_LIMITS.rating.min, `${E}.ratingRequired`)
    .max(REVIEW_LIMITS.rating.max, `${E}.ratingRequired`),
  message: z
    .string()
    .trim()
    .min(REVIEW_LIMITS.message.min, `${E}.messageMin`)
    .max(REVIEW_LIMITS.message.max, `${E}.messageMax`)
    .refine(plain, `${E}.html`),
  consent: z.boolean().refine((value) => value === true, `${E}.consentRequired`),
  // Honeypot: hidden from people; bots fill it. Sent as is (the API answers
  // 201 and stores nothing), never validated client-side.
  hp: z.string().optional(),
});

/** @typedef {z.input<typeof reviewSchema>} ReviewValues */

/** @type {ReviewValues} */
export const EMPTY_REVIEW = {
  name: '',
  role: '',
  company: '',
  rating: '',
  message: '',
  consent: false,
  hp: '',
};

/**
 * @typedef {Object} ReviewPayload
 * @property {string} name
 * @property {string} role
 * @property {string} [company]
 * @property {number} rating   1..5
 * @property {string} message
 * @property {true} consent
 * @property {string} hp       Honeypot, empty for people.
 * @property {Blob} [avatar]   Square WebP/JPEG, already resized and stripped in the browser.
 */

/**
 * The payload for `testimonialsService.submit()` (trimmed, empty optionals omitted).
 * @param {ReviewValues} values
 * @param {Blob | null} [avatar]
 * @returns {ReviewPayload}
 */
export function toReviewPayload(values, avatar) {
  const trim = (/** @type {unknown} */ v) => String(v ?? '').trim();
  return {
    name: trim(values.name),
    role: trim(values.role),
    ...(trim(values.company) ? { company: trim(values.company) } : {}),
    rating: Number(values.rating),
    message: trim(values.message),
    consent: true,
    hp: values.hp ?? '',
    ...(avatar ? { avatar } : {}),
  };
}

/**
 * Stable fingerprint of a payload, to refuse sending the same review twice.
 * @param {ReviewPayload} payload
 */
export const reviewFingerprint = (payload) =>
  JSON.stringify([
    payload.name,
    payload.role,
    payload.company ?? '',
    payload.rating,
    payload.message,
    payload.avatar ? payload.avatar.size : 0,
  ]);
