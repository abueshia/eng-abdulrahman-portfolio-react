import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /home` service. Aggregated home payload (stats, featured projects, services, testimonials). */
export const homeService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  get: (options) => unwrap(http.get(ENDPOINTS.home, requestConfig(options))),
};
