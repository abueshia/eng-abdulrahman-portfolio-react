import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useLocale } from '@/hooks/useLocale';
import { projectsService } from '@/services/api';

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

/**
 * Warms everything a case study needs before navigating to it: its data (same
 * key as `useProject`) and its page chunk. Used by the view-transition
 * navigation, which must find the new page ready to snapshot.
 * @returns {(slug: string) => Promise<unknown>}
 */
export function usePrefetchProject() {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  return useCallback(
    (slug) =>
      Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['project', slug, locale],
          queryFn: ({ signal }) => projectsService.show(slug, { signal, lang: locale }),
        }),
        import('@/pages/ProjectDetailsPage'),
      ]),
    [queryClient, locale],
  );
}
