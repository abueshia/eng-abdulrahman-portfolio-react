import { forwardRef } from 'react';

import { isStationAnchor, stationForSection } from '@/config/journey';
import { useSectionVisible } from '@/hooks/useSettings';
import { cn } from '@/utils/cn';

/**
 * Home-page section wrapper.
 *
 * - Respects `settings.sections_visibility[visibilityKey]` (renders nothing when hidden).
 * - Emits `data-section` and its journey station (`data-station`); a section
 *   where a station begins is also a route stop (`data-station-anchor`), which
 *   the journey tracker measures (see config/journey.js).
 * - Links the landmark to its heading via `aria-labelledby`.
 *
 * @type {import('react').ForwardRefExoticComponent<{
 *   id: string,
 *   visibilityKey?: string,
 *   className?: string,
 *   children: import('react').ReactNode,
 * } & Record<string, any>>}
 */
export const Section = forwardRef(function Section(
  { id, visibilityKey = id, className, children, ...props },
  ref,
) {
  const visible = useSectionVisible(visibilityKey);
  if (!visible) return null;

  return (
    <section
      ref={ref}
      id={id}
      data-section={id}
      data-station={stationForSection(id)}
      data-station-anchor={isStationAnchor(id) ? 'true' : undefined}
      aria-labelledby={`${id}-title`}
      className={cn('section-y relative', className)}
      {...props}
    >
      {children}
    </section>
  );
});
