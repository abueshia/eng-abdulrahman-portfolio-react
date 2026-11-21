import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** Client testimonials: approved reviews (`GET`) and visitor submissions (`POST`). */
export const testimonialsService = {
  /**
   * Approved testimonials only (the API never lists pending or rejected ones).
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  list: (options) => unwrap(http.get(ENDPOINTS.testimonials, requestConfig(options))),

  /**
   * Submits a visitor review as `multipart/form-data`. The record is created
   * as `pending` and appears only after the owner approves it. The
   * implementation is a lazy chunk (see `testimonials-submit.js`).
   * @param {import('@/features/testimonials/lib/review-schema').ReviewPayload} payload
   * @returns {Promise<import('./client').ApiResult<{ id: number, status: 'pending' } | null>>}
   * @throws {import('./errors').ApiError} `isValidation` with field `errors` on 422.
   */
  submit: (payload) =>
    import('./testimonials-submit').then(({ submitReview }) => submitReview(payload)),
};
