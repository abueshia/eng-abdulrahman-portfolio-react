import { useTranslation } from 'react-i18next';
import { LuArrowDown, LuArrowUpRight } from 'react-icons/lu';

import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Magnetic } from '@/components/ui/Magnetic';
import { paths, SECTION_IDS } from '@/config/routes';
import { useSectionVisible } from '@/hooks/useSettings';
import { sfx } from '@/lib/sound/sfx';

/**
 * The three hero actions, each with its own character:
 *  - Explore case studies: solid Ember, magnetic, fill sweeps in from the
 *    inline start (mirrors in RTL).
 *  - Start a project: Ion outline with a conic light orbiting the edge.
 *  - Download CV: quiet ghost link whose arrow drops on hover.
 *
 * Links to hidden sections are not rendered (they would lead nowhere).
 *
 * @param {{ cvUrl?: string }} props
 */
export function HeroCtas({ cvUrl }) {
  const { t } = useTranslation();
  const projectsVisible = useSectionVisible(SECTION_IDS.projects);
  const contactVisible = useSectionVisible(SECTION_IDS.contact);
  const hover = () => sfx('hover');

  return (
    <div className="hero-ctas" data-hero-reveal>
      {projectsVisible && (
        <Magnetic>
          <LocalizedLink
            to={paths.projects()}
            className="cta cta--ember"
            data-cursor="stick"
            onPointerEnter={hover}
          >
            <span className="cta__fill" aria-hidden="true" />
            <span className="cta__label">{t('hero.cta.explore')}</span>
            <LuArrowUpRight aria-hidden="true" className="cta__icon rtl:-scale-x-100" />
          </LocalizedLink>
        </Magnetic>
      )}
      {contactVisible && (
        <Magnetic>
          <LocalizedLink
            to={paths.section(SECTION_IDS.contact)}
            className="cta cta--ion"
            data-cursor="stick"
            onPointerEnter={hover}
          >
            <span className="cta__orbit" aria-hidden="true" />
            <span className="cta__label">{t('hero.cta.start')}</span>
          </LocalizedLink>
        </Magnetic>
      )}
      {cvUrl && (
        <a href={cvUrl} download className="cta cta--ghost" onPointerEnter={hover}>
          <span className="cta__label">{t('hero.cta.cv')}</span>
          <LuArrowDown aria-hidden="true" className="cta__drop" />
          <span className="sr-only">{t('hero.cta.cvFormat')}</span>
        </a>
      )}
    </div>
  );
}
