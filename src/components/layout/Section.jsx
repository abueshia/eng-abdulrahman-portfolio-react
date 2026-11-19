import { forwardRef } from 'react';

import { useSectionVisible } from '@/hooks/useSettings';
import { cn } from '@/utils/cn';

/**
 * Home-page section wrapper.
 *
 * - Respects `settings.sections_visibility[visibilityKey]` (renders nothing when hidden).
 * - Emits `data-section` so the global background layer can react to the
 *   active section (phase 2).
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
      aria-labelledby={`${id}-title`}
      className={cn('section-y relative', className)}
      {...props}
    >
      {children}
    </section>
  );
});
