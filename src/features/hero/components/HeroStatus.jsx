import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/hooks/useLocale';

/**
 * Status strip above the name: availability (real, from settings) plus the
 * owner's location and live local time. The clock is client-only (a
 * prerendered time would be wrong and would break hydration); its slot has a
 * fixed width so it appears without moving anything.
 *
 * @param {{ general?: any, hero?: any }} props
 */
export function HeroStatus({ general, hero }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [time, setTime] = useState(/** @type {string | null} */ (null));
  const timeZone = general?.timezone;

  useEffect(() => {
    if (!timeZone) return undefined;
    let format;
    try {
      format = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone,
      });
    } catch {
      return undefined;
    }
    const update = () => setTime(format.format(new Date()));
    update();
    const id = window.setInterval(update, 15_000);
    return () => window.clearInterval(id);
  }, [timeZone, locale]);

  return (
    <div className="hero-status" data-hero-reveal>
      <p className="hero-status__item">
        <span
          className="hero-status__dot"
          data-on={general?.available_for_work ? 'true' : 'false'}
          aria-hidden="true"
        />
        {hero?.eyebrow}
      </p>
      <p className="hero-status__item hero-status__item--muted">
        <span>{general?.location}</span>
        <span className="hero-status__clock" aria-hidden={time ? undefined : 'true'}>
          {time ? t('hero.status.localTime', { time }) : null}
        </span>
      </p>
    </div>
  );
}
