import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /experiences` service. Work experience timeline, newest first. */
export const experiencesService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  list: (options) => unwrap(http.get(ENDPOINTS.experiences, requestConfig(options))),
};
