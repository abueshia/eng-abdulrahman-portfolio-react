import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useApiQuery } from '@/hooks/useApiQuery';
import { useLocale } from '@/hooks/useLocale';
import { projectsService } from '@/services/api';

/**
 * Every published project (the API pages are followed; filtering happens
 * client-side, see `lib/filters`).
 * @param {boolean} [enabled=true]
 */
export function useProjects(enabled = true) {
  return useApiQuery(['projects'], projectsService.all, { staleTime: 5 * 60 * 1000, enabled });
}

/**
 * The home page's three case files (featured, topped up with the latest; see
 * `projectsService.featured`). Its own key: the home page never loads the
 * full list.
 * @param {boolean} [enabled=true]
 */
export function useFeaturedProjects(enabled = true) {
  return useApiQuery(['projects', 'featured'], projectsService.featured, {
    staleTime: 5 * 60 * 1000,
    enabled,
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
