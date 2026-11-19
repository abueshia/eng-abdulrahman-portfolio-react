import { useMemo } from 'react';

import { NAV_ITEMS } from '@/config/navigation';
import { useSettings } from './useSettings';

/**
 * Navigation items whose section is visible per `settings.sections_visibility`.
 * Hidden sections must not be linked: their pages are not prerendered, so the
 * link would lead to a 404 in production.
 */
export function useNavItems() {
  const { data } = useSettings();
  const visibility = data?.data?.sections_visibility;
  return useMemo(
    () => NAV_ITEMS.filter((item) => !item.section || visibility?.[item.section] !== false),
    [visibility],
  );
}
