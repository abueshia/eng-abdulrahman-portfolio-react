import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrapMapped } from './client';

/** `GET /experiences` service: the full work history (mapped, see `mappers/experiences.js`). */
export const experiencesService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<import('./mappers/experiences').Experience[]>>}
   */
  list: (options) =>
    unwrapMapped(http.get(ENDPOINTS.experiences, requestConfig(options)), 'mapExperiences'),
};
