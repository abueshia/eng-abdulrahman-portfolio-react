import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /technologies` service. Technologies grouped by category. */
export const technologiesService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  list: (options) => unwrap(http.get(ENDPOINTS.technologies, requestConfig(options))),
};
