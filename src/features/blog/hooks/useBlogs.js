import { blogsService } from '@/services/api';
import { useApiQuery } from '@/hooks/useApiQuery';

/**
 * Paginated blog list.
 * @param {{ category?: string, page?: number, per_page?: number }} [params]
 */
export function useBlogs(params = {}) {
  return useApiQuery(['blogs', params], (options) => blogsService.list(params, options), {
    placeholderData: (previous) => previous,
  });
}

/**
 * Single post by slug.
 * @param {string | undefined} slug
 */
export function useBlog(slug) {
  return useApiQuery(['blog', slug], (options) => blogsService.show(slug, options), {
    enabled: Boolean(slug),
  });
}
