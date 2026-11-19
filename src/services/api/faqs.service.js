import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /faqs` service. Frequently asked questions. */
export const faqsService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  list: (options) => unwrap(http.get(ENDPOINTS.faqs, requestConfig(options))),
};
