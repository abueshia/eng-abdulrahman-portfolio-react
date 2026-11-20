import { useTranslation } from 'react-i18next';

import { soundStore, useSoundEnabled } from '@/lib/sound/sfx';
import { cn } from '@/utils/cn';

/**
 * Interface sound switch: OFF by default, remembered once chosen. The icon is
 * a live waveform (bars) that flattens when muted, drawn in CSS.
 * @param {{ className?: string }} props
 */
export function SoundToggle({ className }) {
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
        'sound-toggle grid size-10 place-items-center rounded-full border border-line text-ink-muted',
        'transition-colors duration-300 hover:border-line-strong hover:text-ink',
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
