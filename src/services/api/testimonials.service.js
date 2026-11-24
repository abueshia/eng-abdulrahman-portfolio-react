import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrapMapped } from './client';

/** Client testimonials: approved reviews (`GET`) and visitor submissions (`POST`). */
export const testimonialsService = {
  /**
   * Approved testimonials only (the API never lists pending ones), mapped
   * (see `mappers/testimonials.js`).
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<import('./mappers/testimonials').Testimonial[]>>}
   */
  list: (options) =>
    unwrapMapped(http.get(ENDPOINTS.testimonials, requestConfig(options)), 'mapTestimonials'),

  /**
   * Submits a visitor review as `multipart/form-data`. The record is stored
   * inactive and appears only after the owner approves it. The
   * implementation is a lazy chunk (see `testimonials-submit.js`).
   * @param {import('@/features/testimonials/lib/review-schema').ReviewPayload} payload
   * @returns {Promise<import('./client').ApiResult<unknown>>}
   * @throws {import('./errors').ApiError} `isValidation` (field `errors`), `isRateLimited` (429).
   */
  submit: (payload) =>
    import('./testimonials-submit').then(({ submitReview }) => submitReview(payload)),
};
