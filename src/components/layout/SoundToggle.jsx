import { useTranslation } from 'react-i18next';

import { soundStore, useSoundEnabled } from '@/lib/sound/sfx';
import { cn } from '@/utils/cn';

/**
 * Interface sound switch: OFF by default, remembered once chosen. The icon is
 * a live waveform (bars) that flattens when muted, drawn in CSS.
 * @param {{ className?: string, size?: 'md' | 'lg', desktopOnly?: boolean }} props
 */
export function SoundToggle({ className, size = 'md', desktopOnly = false }) {
  const { t } = useTranslation();
  const enabled = useSoundEnabled();
  const label = enabled ? t('sound.off') : t('sound.on');

  return (
    <button
      type="button"
      onClick={() => soundStore.set(!enabled)}
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      className={cn(
        'sound-toggle place-items-center rounded-full border border-line text-ink-muted',
        'transition-colors duration-300 hover:border-line-strong hover:text-ink',
        desktopOnly ? 'hidden sm:grid' : 'grid',
        size === 'lg' ? 'size-14' : 'size-10',
        className,
      )}
      data-on={enabled ? 'true' : 'false'}
    >
      <span className="sound-toggle__bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
