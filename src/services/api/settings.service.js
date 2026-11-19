import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** `GET /settings` service. Site-wide settings: general, seo, sections_visibility, hero, about, contact, cta. */
export const settingsService = {
  /**
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<any>>}
   */
  get: (options) => unwrap(http.get(ENDPOINTS.settings, requestConfig(options))),
};
