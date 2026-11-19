import { forwardRef } from 'react';

import { cn } from '@/utils/cn';

const VARIANTS = {
  primary: 'bg-ember text-on-ember shadow-glow hover:bg-ember-strong focus-visible:outline-ion',
  secondary:
    'border border-line-strong text-ink hover:border-ion hover:text-ion hover:shadow-glow-ion',
  ghost: 'text-ink-muted hover:text-ink hover:bg-surface-2',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm gap-2',
  md: 'h-11 px-6 text-sm gap-2.5',
  lg: 'h-14 px-8 text-base gap-3',
  icon: 'size-10 justify-center',
};

/**
 * Base button. Polymorphic through `as` so links (`<a>`, router `<Link>`)
 * share identical styling without nesting interactive elements.
 *
 * @typedef {Object} ButtonOwnProps
 * @property {keyof typeof VARIANTS} [variant='primary']
 * @property {keyof typeof SIZES} [size='md']
 * @property {import('react').ElementType} [as='button']
 *
 * @type {import('react').ForwardRefExoticComponent<ButtonOwnProps & Record<string, any>>}
 */
export const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', className, ...props },
  ref,
) {
  const isNativeButton = Component === 'button';
  return (
    <Component
      ref={ref}
      type={isNativeButton ? (props.type ?? 'button') : undefined}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none',
        'transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-out-expo',
        'active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
