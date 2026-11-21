import { useApiQuery } from '@/hooks/useApiQuery';
import { technologiesService } from '@/services/api';

/** Technologies grouped by category (`GET /technologies`), in display order. */
export function useTechnologies() {
  return useApiQuery(['technologies'], technologiesService.list, { staleTime: 5 * 60 * 1000 });
}
