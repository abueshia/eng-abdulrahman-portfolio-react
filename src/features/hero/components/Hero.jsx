import { useTranslation } from 'react-i18next';

import { SECTION_IDS } from '@/config/routes';
import { useLocale } from '@/hooks/useLocale';
import { useSettings } from '@/hooks/useSettings';
import { HeroCtas } from './HeroCtas';
import { HeroMarquee } from './HeroMarquee';
import { HeroName } from './HeroName';
import { HeroRole } from './HeroRole';
import { HeroStatus } from './HeroStatus';
import { HeroTerminal } from './HeroTerminal';
import { Portrait } from './Portrait';

/**
 * Hero: "The Architect's Core", station 01 (Gateway) of the journey.
 *
 * Everything here is prerendered: the name (LCP), role, summary, actions,
 * portrait and terminal summary are real HTML from settings, so crawlers and
 * no-JS visitors get the full content. Motion is layered on afterwards by
 * client-only modules (`HeroFx`), and the layout never depends on it.
 *
 * Desktop: asymmetric composition, the name across the full width with the
 * portrait at the inline end between its two lines (depth sandwich), the
 * terminal docked over the portrait's lower edge, and the live bands at the
 * foot. Phones: name first, then actions in the thumb zone, then the monolith.
 */
export function Hero() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { data } = useSettings();
  const general = data?.data?.general;
  const hero = data?.data?.hero;

  return (
    <section
      id={SECTION_IDS.hero}
      className="hero"
      aria-labelledby="hero-title"
      data-section="hero"
      data-station="gateway"
      data-station-anchor="true"
    >
      {/* Seam-free outline for the surname: dilate the glyphs' union, keep only the ring. */}
      <svg className="hero__defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="hero-outline" x="-2%" y="-10%" width="104%" height="120%">
          <feMorphology in="SourceGraphic" operator="dilate" radius="1.3" result="thick" />
          <feComposite in="thick" in2="SourceGraphic" operator="out" />
        </filter>
        <filter id="hero-outline-thin" x="-2%" y="-10%" width="104%" height="120%">
          <feMorphology in="SourceGraphic" operator="dilate" radius="0.8" result="thick" />
          <feComposite in="thick" in2="SourceGraphic" operator="out" />
        </filter>
      </svg>
      <div className="hero__stage" data-hero-stage>
        <div className="hero__grid container-fluid">
          <div className="hero__status" data-hero-status>
            <HeroStatus general={general} hero={hero} />
          </div>

          <HeroName first={general?.first_name} last={general?.last_name} locale={locale} />

          <div className="hero__copy" data-hero-copy>
            <HeroRole roles={hero?.roles} />
            <p className="hero__summary" data-hero-reveal>
              {hero?.summary}
            </p>
            <HeroCtas cvUrl={general?.cv_url} />
          </div>

          <Portrait className="hero__portrait" name={general?.owner_name} badges={hero?.badges} />
          <HeroTerminal general={general} hero={hero} />

          <p className="hero__cue" aria-hidden="true" data-hero-cue>
            <span className="hero__cue-line" />
            {t('hero.cue')}
          </p>
          <p className="hero__transmit" aria-hidden="true" data-hero-transmit dir="ltr">
            <span className="hero__transmit-dot" />
            <span data-transmit-text>GET /</span>
          </p>
        </div>

        <HeroMarquee hero={hero} />
      </div>
    </section>
  );
}
