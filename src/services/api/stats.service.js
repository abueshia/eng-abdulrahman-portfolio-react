import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /stats` service. Headline metrics. */
export const statsService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  list: (options) => unwrap(http.get(ENDPOINTS.stats, requestConfig(options))),
};
