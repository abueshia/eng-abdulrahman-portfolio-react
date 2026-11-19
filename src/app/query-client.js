import { QueryClient } from '@tanstack/react-query';

/**
 * Creates the query client with portfolio-friendly defaults: content is
 * mostly static, so avoid refetch storms and retry only transient failures
 * (never 4xx, which won't fix themselves).
 * @returns {QueryClient}
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          const status = /** @type {{ status?: number }} */ (error)?.status ?? 0;
          return !(status >= 400 && status < 500) && count < 2;
        },
      },
    },
  });
}
