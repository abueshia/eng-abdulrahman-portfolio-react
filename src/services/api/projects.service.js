import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/**
 * @typedef {Object} ProjectListParams
 * @property {string} [type]        Filter by project type (saas, pos, api).
 * @property {string} [technology]  Filter by technology slug.
 * @property {boolean} [featured]
 * @property {number} [page]
 * @property {number} [per_page]
 */

/** Projects / case studies service. */
export const projectsService = {
  /**
   * Paginated project summaries.
   * @param {ProjectListParams} [params]
   * @param {import('./client').RequestOptions} [options]
   */
  list: (params = {}, options) =>
    unwrap(http.get(ENDPOINTS.projects, requestConfig(options, params))),

  /**
   * Full case study, including `related_projects`.
   * @param {string} slug
   * @param {import('./client').RequestOptions} [options]
   */
  show: (slug, options) => unwrap(http.get(ENDPOINTS.project(slug), requestConfig(options))),
};
