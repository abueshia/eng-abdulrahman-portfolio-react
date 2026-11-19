import { ENDPOINTS } from './endpoints';
import { http } from './http';
import { requestConfig, unwrap } from './client';

/** Blog service. */
export const blogsService = {
  /**
   * Paginated post summaries.
   * @param {{ category?: string, page?: number, per_page?: number }} [params]
   * @param {import('./client').RequestOptions} [options]
   */
  list: (params = {}, options) => unwrap(http.get(ENDPOINTS.blogs, requestConfig(options, params))),

  /**
   * Single post with HTML `content`.
   * @param {string} slug
   * @param {import('./client').RequestOptions} [options]
   */
  show: (slug, options) => unwrap(http.get(ENDPOINTS.blog(slug), requestConfig(options))),

  /** @param {import('./client').RequestOptions} [options] */
  categories: (options) => unwrap(http.get(ENDPOINTS.blogCategories, requestConfig(options))),
};
