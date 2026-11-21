import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';
import { LocalizedLink } from './LocalizedLink';

/**
 * Monogram wordmark. The blinking caret nods to the terminal identity
 * (and stops blinking under reduced motion via the global CSS rule).
 * @param {{ className?: string, onClick?: () => void }} props
 */
export function Logo({ className, onClick }) {
  const { t } = useTranslation();
  return (
    <LocalizedLink
      to="/"
      onClick={onClick}
      className={cn('group inline-flex items-center gap-3', className)}
    >
      <span
        aria-hidden="true"
        className="relative grid size-10 place-items-center rounded-md border border-line-strong bg-surface font-mono text-sm font-semibold text-ink transition-colors duration-300 group-hover:border-ember"
      >
        AA
        <span className="absolute -end-[3px] -bottom-[3px] size-2 rounded-full bg-ember shadow-glow" />
      </span>
      <span
        aria-hidden="true"
        className="logo__word hidden font-mono text-sm text-ink-muted sm:inline"
        dir="ltr"
      >
        abu<span className="text-ink">eisha</span>
        <span className="ms-0.5 inline-block w-2 animate-blink text-ember">_</span>
      </span>
      {/* The name comes from text, not aria-label: the visible marks are decorative. */}
      <span className="sr-only">{t('a11y.homeLink')}</span>
    </LocalizedLink>
  );
}
