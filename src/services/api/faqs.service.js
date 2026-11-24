import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrapMapped } from './client';

/** `GET /faqs` service: questions and answers (mapped, see `mappers/faqs.js`). */
export const faqsService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<import('./mappers/faqs').Faq[]>>}
   */
  list: (options) => unwrapMapped(http.get(ENDPOINTS.faqs, requestConfig(options)), 'mapFaqs'),
};
