import { useApiQuery } from '@/hooks/useApiQuery';
import { faqsService } from '@/services/api';

/** Frequently asked questions (`GET /faqs`). */
export function useFaqs() {
  return useApiQuery(['faqs'], faqsService.list, { staleTime: 5 * 60 * 1000 });
}
