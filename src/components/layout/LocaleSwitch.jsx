import { useTranslation } from 'react-i18next';

import { useLocale } from '@/hooks/useLocale';
import { cn } from '@/utils/cn';

/**
 * Language switch. Shows the *target* language in its own script ("EN" / "ع"),
 * which is the convention bilingual readers scan for.
 * @param {{ className?: string, size?: 'md' | 'lg' }} props
 */
export function LocaleSwitch({ className, size = 'md' }) {
  const { t } = useTranslation();
  const { locale, switchLocale } = useLocale();
  const target = locale === 'ar' ? 'en' : 'ar';

  return (
    <button
      type="button"
      onClick={() => switchLocale(target)}
      title={t('locale.switchTo')}
      className={cn(
        'grid place-items-center rounded-full border border-line px-3 font-mono text-xs font-medium text-ink-muted',
        'transition-colors duration-300 hover:border-line-strong hover:text-ink',
        size === 'lg' ? 'size-14' : 'h-10 min-w-10',
        className,
      )}
    >
      {/* Accessible name = visible label + its meaning (WCAG 2.5.3, label in name). */}
      <span lang={target}>{t('locale.targetShort')}</span>
      <span className="sr-only">: {t('locale.switchTo')}</span>
    </button>
  );
}
