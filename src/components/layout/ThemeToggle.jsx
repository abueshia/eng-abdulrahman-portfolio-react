import { LuMoon, LuSun } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';

/**
 * Dark/light switch. Both icons are always rendered and cross-rotate, so the
 * transition is pure CSS (no remounts) and the button never changes size.
 * @param {{ className?: string, size?: 'md' | 'lg' }} props
 */
export function ThemeToggle({ className, size = 'md' }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'relative grid place-items-center overflow-hidden rounded-full border border-line text-ink-muted',
        'transition-colors duration-300 hover:border-line-strong hover:text-ink',
        size === 'lg' ? 'size-14' : 'size-10',
        className,
      )}
    >
      <LuSun
        aria-hidden="true"
        className={cn(
          'absolute size-[18px] transition-[transform,opacity] duration-500 ease-out-expo',
          isDark ? 'rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
        )}
      />
      <LuMoon
        aria-hidden="true"
        className={cn(
          'absolute size-[18px] transition-[transform,opacity] duration-500 ease-out-expo',
          isDark ? 'scale-50 rotate-90 opacity-0' : 'rotate-0 opacity-100',
        )}
      />
    </button>
  );
}
