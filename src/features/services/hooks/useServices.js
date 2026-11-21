import { useApiQuery } from '@/hooks/useApiQuery';
import { servicesService } from '@/services/api';

/** Services catalogue (`GET /services`), sorted by group then id. */
export function useServices() {
  return useApiQuery(['services'], servicesService.list, { staleTime: 5 * 60 * 1000 });
}
