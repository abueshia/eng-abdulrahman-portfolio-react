import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/hooks/useLocale';
import { useTheme } from '@/hooks/useTheme';
import { useDeviceTier } from '@/lib/device';
import { PENDING_MEASUREMENTS, measureTelemetry, stateTelemetry } from '../lib/telemetry';

/**
 * Two counter-moving bands at the foot of the hero, telling the "backend is
 * alive" story in text, not logos:
 *  1. Service registry: the real stack (settings) reporting healthy.
 *  2. Access log: facts about THIS visit (TTFB, hydration, fonts, viewport,
 *     language, timezone…), measured in the browser after hydration.
 *
 * Pure CSS motion (transform only), reversed in RTL, paused on hover/focus
 * and under reduced motion. Decorative: `aria-hidden`.
 *
 * @param {{ hero?: any }} props
 */
export function HeroMarquee({ hero }) {
  const { t } = useTranslation();
  const { locale, dir } = useLocale();
  const { theme } = useTheme();
  const tier = useDeviceTier();
  const [measured, setMeasured] = useState(/** @type {string[] | null} */ (null));

  const services = useMemo(() => {
    const names = [
      ...(hero?.badges ?? []),
      ...(hero?.terminal_stack ?? []).flatMap((/** @type {any} */ row) => row.value.split('·')),
    ]
      .map((name) => name.trim())
      .filter(Boolean);
    return [...new Set(names)];
  }, [hero]);

  useEffect(() => {
    // Once, after the page settles, so TTFB / hydration / font numbers are final.
    const id = window.setTimeout(() => setMeasured(measureTelemetry()), 1200);
    return () => window.clearTimeout(id);
  }, []);

  // Language, theme and tier come from live state: they can never lag the page.
  const entries = [
    `GET ${locale === 'ar' ? '/' : '/en'} 200`,
    ...(measured ?? PENDING_MEASUREMENTS),
    ...stateTelemetry({ locale, dir, theme, tier }),
  ];

  return (
    <div className="hero-marquee" aria-hidden="true" data-hero-marquee>
      <div className="hero-marquee__inner" data-marquee-inner>
        <Band reverse={false}>
          {services.map((name) => (
            <span key={name} className="marquee__item">
              <i className="marquee__dot" />
              {name}
              <em>{t('hero.marquee.healthy')}</em>
            </span>
          ))}
        </Band>
        <Band reverse>
          {entries.map((entry, i) => (
            <span key={`${entry}-${i}`} className="marquee__item marquee__item--log" dir="ltr">
              <i className="marquee__tick">{i % 3 === 0 ? '→' : '·'}</i>
              {entry}
            </span>
          ))}
        </Band>
      </div>
    </div>
  );
}

/**
 * One seamless band: the content is rendered twice and the track slides by
 * exactly one copy.
 * @param {{ children: import('react').ReactNode, reverse: boolean }} props
 */
function Band({ children, reverse }) {
  return (
    <div className="marquee" data-reverse={reverse ? 'true' : 'false'}>
      <div className="marquee__track">
        <div className="marquee__group">{children}</div>
        <div className="marquee__group">{children}</div>
      </div>
    </div>
  );
}
