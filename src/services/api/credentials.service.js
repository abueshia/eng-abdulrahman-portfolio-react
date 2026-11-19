import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /credentials` service. Education, certifications and courses. */
export const credentialsService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  list: (options) => unwrap(http.get(ENDPOINTS.credentials, requestConfig(options))),
};
