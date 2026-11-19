import { useQuery } from '@tanstack/react-query';

import { useLocale } from './useLocale';

/**
 * Locale-aware wrapper around `useQuery`.
 *
 * The active locale is appended to the query key AND forwarded to the service,
 * so switching language refetches localised content while the previous
 * language stays cached for instant toggling back.
 *
 * @template T
 * @param {readonly unknown[]} key  Resource key, e.g. ['projects', params].
 * @param {(options: import('@/services/api/client').RequestOptions) => Promise<import('@/services/api/client').ApiResult<T>>} fetcher
 * @param {Omit<import('@tanstack/react-query').UseQueryOptions<import('@/services/api/client').ApiResult<T>>, 'queryKey' | 'queryFn'>} [options]
 */
export function useApiQuery(key, fetcher, options = {}) {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...key, locale],
    queryFn: ({ signal }) => fetcher({ signal, lang: locale }),
    ...options,
  });
}
