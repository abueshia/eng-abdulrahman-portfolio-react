import { settingsService } from '@/services/api';
import { useApiQuery } from './useApiQuery';

/**
 * Site-wide settings (general, seo, sections_visibility, hero, about, contact, cta).
 * Settings rarely change, so they are treated as fresh for the whole session.
 */
export function useSettings() {
  return useApiQuery(['settings'], settingsService.get, { staleTime: Infinity });
}

/**
 * Whether a home section should render, per `settings.sections_visibility`.
 * Defaults to visible while settings load so the layout doesn't jump.
 * @param {string} key Section key, e.g. "projects".
 * @returns {boolean}
 */
export function useSectionVisible(key) {
  const { data } = useSettings();
  return data?.data?.sections_visibility?.[key] ?? true;
}
