import { useApiQuery } from '@/hooks/useApiQuery';
import { experiencesService } from '@/services/api';

/** Work history (`GET /experiences`), newest first. */
export function useExperiences() {
  return useApiQuery(['experiences'], experiencesService.list, { staleTime: 5 * 60 * 1000 });
}
