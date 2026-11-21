import { useApiQuery } from '@/hooks/useApiQuery';
import { statsService } from '@/services/api';

/** Headline metrics (`GET /stats`) for the observability board. */
export function useStats() {
  return useApiQuery(['stats'], statsService.list, { staleTime: 5 * 60 * 1000 });
}
