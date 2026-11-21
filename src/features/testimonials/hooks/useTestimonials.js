import { useApiQuery } from '@/hooks/useApiQuery';
import { testimonialsService } from '@/services/api';

/** Testimonials (`GET /testimonials`). */
export function useTestimonials() {
  return useApiQuery(['testimonials'], testimonialsService.list, { staleTime: 5 * 60 * 1000 });
}
