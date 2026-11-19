import { projectsService } from '@/services/api';
import { useApiQuery } from '@/hooks/useApiQuery';

/**
 * Paginated project list.
 * @param {import('@/services/api/projects.service').ProjectListParams} [params]
 */
export function useProjects(params = {}) {
  return useApiQuery(['projects', params], (options) => projectsService.list(params, options), {
    placeholderData: (previous) => previous, // keep the grid while filters change
  });
}

/**
 * Single case study by slug.
 * @param {string | undefined} slug
 */
export function useProject(slug) {
  return useApiQuery(['project', slug], (options) => projectsService.show(slug, options), {
    enabled: Boolean(slug),
  });
}
