import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { unwrap } from './client';

/**
 * Visitor review submission (`POST /testimonials`, API_CONTRACT.md §5), split
 * out of `testimonials.service.js` so it loads with the review form, not with
 * the initial bundle (the service barrel ships with the first page).
 */

/**
 * Builds the multipart body. Translatable texts go under the visitor's
 * language (`name[ar]`, `description[ar]`…), which the API stores in that
 * locale; `consent` travels as "1" (Laravel's `accepted` rule), the photo as
 * the `image` part. The honeypot is never sent (see `submitReview`), and
 * neither is `hp` (the API rejects any request carrying it).
 * @param {import('@/features/testimonials/lib/review-schema').ReviewPayload} payload
 * @returns {FormData}
 */
export function toReviewFormData(payload) {
  const form = new FormData();
  const { locale } = payload;
  form.append(`name[${locale}]`, payload.name);
  if (payload.name_job) form.append(`name_job[${locale}]`, payload.name_job);
  if (payload.company_name) form.append(`company_name[${locale}]`, payload.company_name);
  form.append(`description[${locale}]`, payload.description);
  form.append('rating', String(payload.rating));
  if (payload.project_id) form.append('project_id', String(payload.project_id));
  form.append('consent', '1');
  form.append('locale', locale);
  if (payload.image) {
    const ext = payload.image.type === 'image/webp' ? 'webp' : 'jpg';
    form.append('image', payload.image, `avatar.${ext}`);
  }
  return form;
}

/**
 * @param {import('@/features/testimonials/lib/review-schema').ReviewPayload} payload
 * @returns {Promise<import('./client').ApiResult<unknown>>}
 */
export const submitReview = async (payload) => {
  // Honeypot filled (a bot): look accepted, send nothing.
  if (payload.website) return { data: null, message: '', code: 201, pagination: undefined };
  return unwrap(
    http.post(ENDPOINTS.testimonials, toReviewFormData(payload), {
      params: { lang: payload.locale },
    }),
  );
};
