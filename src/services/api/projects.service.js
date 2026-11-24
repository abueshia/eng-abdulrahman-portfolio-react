import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrapMapped } from './client';

/** Largest page the API serves (`per_page` is clamped to 1..50). */
export const MAX_PER_PAGE = 50;

/**
 * @typedef {Object} ProjectListParams
 * @property {string} [type]        Filter by `project_type`.
 * @property {string} [technology]  Filter by technology slug or id.
 * @property {string} [category]    Filter by category slug or id.
 * @property {boolean} [featured]
 * @property {number} [page]
 * @property {number} [per_page]
 */

/**
 * Projects / case studies service. Results are mapped to the app's `Project`
 * shape (see `mappers/projects.js`).
 */
export const projectsService = {
  /**
   * One page of projects.
   * @param {ProjectListParams} [params]
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<import('./mappers/projects').Project[]>>}
   */
  list: (params = {}, options) =>
    unwrapMapped(http.get(ENDPOINTS.projects, requestConfig(options, params)), 'mapProjects'),

  /**
   * Every published project, following the pagination (one request today:
   * 14 projects fit in a page of 50).
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<import('./mappers/projects').Project[]>>}
   */
  all: (options) =>
    import('./mappers').then(({ collectPages }) =>
      collectPages((page) => projectsService.list({ page, per_page: MAX_PER_PAGE }, options)),
    ),

  /**
   * Full case study, including `related_projects` and `testimonials`.
   * @param {string} slug
   * @param {import('./client').RequestOptions} [options]
   * @returns {Promise<import('./client').ApiResult<import('./mappers/projects').Project | null>>}
   */
  show: (slug, options) =>
    unwrapMapped(http.get(ENDPOINTS.project(slug), requestConfig(options)), 'mapProject'),
};
