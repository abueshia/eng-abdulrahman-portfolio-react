import { useRef } from 'react';

import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/utils/cn';

/**
 * Wraps one interactive element in a magnetic field (see `useMagnetic`).
 * The wrapper owns the transform, so the child keeps its own CSS
 * hover/active transitions without conflict.
 *
 * @param {{ children: import('react').ReactNode, strength?: number, className?: string }} props
 */
export function Magnetic({ children, strength, className }) {
  const ref = useRef(/** @type {HTMLSpanElement | null} */ (null));
  useMagnetic(ref, { strength });
  return (
    <span ref={ref} className={cn('magnetic', className)}>
      {children}
    </span>
  );
}
