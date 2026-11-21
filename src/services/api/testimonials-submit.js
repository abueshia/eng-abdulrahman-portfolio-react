import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { unwrap } from './client';

/**
 * Visitor review submission (`POST /testimonials`), split out of
 * `testimonials.service.js` so it loads with the review form, not with the
 * initial bundle (the service barrel ships with the first page).
 */

/**
 * Builds the multipart body. Booleans travel as "1"/"0" (Laravel's
 * `accepted` rule), the avatar as a named file part.
 * @param {import('@/features/testimonials/lib/review-schema').ReviewPayload} payload
 * @returns {FormData}
 */
export function toReviewFormData(payload) {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('role', payload.role);
  if (payload.company) form.append('company', payload.company);
  form.append('rating', String(payload.rating));
  form.append('message', payload.message);
  form.append('consent', payload.consent ? '1' : '0');
  form.append('hp', payload.hp ?? '');
  if (payload.avatar) {
    const ext = payload.avatar.type === 'image/webp' ? 'webp' : 'jpg';
    form.append('avatar', payload.avatar, `avatar.${ext}`);
  }
  return form;
}

/**
 * @param {import('@/features/testimonials/lib/review-schema').ReviewPayload} payload
 * @returns {Promise<import('./client').ApiResult<{ id: number, status: 'pending' } | null>>}
 */
export const submitReview = (payload) =>
  unwrap(http.post(ENDPOINTS.testimonials, toReviewFormData(payload)));
