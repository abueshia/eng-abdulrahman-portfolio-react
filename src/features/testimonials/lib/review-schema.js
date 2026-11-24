/**
 * Visitor review contract: validation (zod, error messages are i18n keys),
 * the payload sent to `POST /testimonials`, the mapping of the server's 422
 * keys back onto the fields, and the duplicate guard.
 *
 * Field names and limits are the API's (API_CONTRACT.md §5): `name` 2-80,
 * `name_job` and `company_name` up to 100, `description` 10-1000, `rating`
 * 1-5, `project_id`, `image`, `consent`. The form asks for a rating even
 * though the API would default it to 5: a review should say what it means.
 * The server stays the authority: its 422 errors land on the fields.
 */
import { z } from 'zod';

/** Rejects anything that looks like markup: the form takes plain text only. */
const HTML = /<\/?[a-z!][^>]*>/i;
const plain = (/** @type {string} */ value) => !HTML.test(value);

export const REVIEW_LIMITS = Object.freeze({
  name: { min: 2, max: 80 },
  name_job: { max: 100 },
  company_name: { max: 100 },
  description: { min: 10, max: 1000 },
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
  name_job: z
    .string()
    .trim()
    .max(REVIEW_LIMITS.name_job.max, `${E}.roleMax`)
    .refine(plain, `${E}.html`),
  company_name: z
    .string()
    .trim()
    .max(REVIEW_LIMITS.company_name.max, `${E}.companyMax`)
    .refine(plain, `${E}.html`),
  // Radios give strings (or null when none is checked): 0 means "not chosen".
  rating: z.coerce
    .number()
    .int(`${E}.ratingRequired`)
    .min(REVIEW_LIMITS.rating.min, `${E}.ratingRequired`)
    .max(REVIEW_LIMITS.rating.max, `${E}.ratingRequired`),
  description: z
    .string()
    .trim()
    .min(REVIEW_LIMITS.description.min, `${E}.messageMin`)
    .max(REVIEW_LIMITS.description.max, `${E}.messageMax`)
    .refine(plain, `${E}.html`),
  // "" = no project; otherwise the id of a published project.
  project_id: z.string().regex(/^\d*$/, `${E}.server`),
  consent: z.boolean().refine((value) => value === true, `${E}.consentRequired`),
  // Honeypot: hidden from people; bots fill it. Never validated client-side
  // and never sent (a filled one looks accepted and sends nothing).
  website: z.string().optional(),
});

/** @typedef {z.input<typeof reviewSchema>} ReviewValues */

/** @type {ReviewValues} */
export const EMPTY_REVIEW = {
  name: '',
  name_job: '',
  company_name: '',
  rating: '',
  description: '',
  project_id: '',
  consent: false,
  website: '',
};

/** Form fields a server error can point at. */
export const REVIEW_FIELDS = /** @type {const} */ ([
  'name',
  'name_job',
  'company_name',
  'rating',
  'description',
  'project_id',
  'consent',
]);

/** API aliases (API_CONTRACT.md §5) → form field. */
const ALIASES = /** @type {Record<string, string>} */ ({
  client_name: 'name',
  client_role: 'name_job',
  job_title: 'name_job',
  role: 'name_job',
  company: 'company_name',
  testimonial: 'description',
  comment: 'description',
  message: 'description',
  content: 'description',
  avatar: 'image',
});

/**
 * The form field a 422 key belongs to: `name.ar` → `name`, `testimonial` →
 * `description`, `avatar` → `image` (the photo control). Honeypot keys map to
 * nothing.
 * @param {string} key
 * @returns {string | null}
 */
export function reviewFieldFor(key) {
  const base = String(key).split('.')[0];
  const field = ALIASES[base] ?? base;
  if (field === 'image') return 'image';
  return /** @type {readonly string[]} */ (REVIEW_FIELDS).includes(field) ? field : null;
}

/**
 * @typedef {Object} ReviewPayload
 * @property {'ar' | 'en'} locale     Language the texts are written in (stored under it).
 * @property {string} name
 * @property {string} [name_job]
 * @property {string} [company_name]
 * @property {string} description
 * @property {number} rating          1..5
 * @property {number} [project_id]
 * @property {true} consent
 * @property {string} website         Honeypot, empty for people.
 * @property {Blob} [image]           Square WebP/JPEG, already resized and stripped in the browser.
 */

/**
 * The payload for `testimonialsService.submit()` (trimmed, empty optionals omitted).
 * @param {ReviewValues} values
 * @param {'ar' | 'en'} locale
 * @param {Blob | null} [image]
 * @returns {ReviewPayload}
 */
export function toReviewPayload(values, locale, image) {
  const trim = (/** @type {unknown} */ v) => String(v ?? '').trim();
  const projectId = Number(values.project_id);
  return {
    locale,
    name: trim(values.name),
    ...(trim(values.name_job) ? { name_job: trim(values.name_job) } : {}),
    ...(trim(values.company_name) ? { company_name: trim(values.company_name) } : {}),
    description: trim(values.description),
    rating: Number(values.rating),
    ...(Number.isInteger(projectId) && projectId > 0 ? { project_id: projectId } : {}),
    consent: true,
    website: values.website ?? '',
    ...(image ? { image } : {}),
  };
}

/**
 * Stable fingerprint of a payload, to refuse sending the same review twice.
 * @param {ReviewPayload} payload
 */
export const reviewFingerprint = (payload) =>
  JSON.stringify([
    payload.name,
    payload.name_job ?? '',
    payload.company_name ?? '',
    payload.rating,
    payload.description,
    payload.project_id ?? 0,
    payload.image ? payload.image.size : 0,
  ]);
