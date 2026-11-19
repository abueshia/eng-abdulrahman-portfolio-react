/**
 * TEMPORARY scaffolding for phase 1.
 *
 * Each placeholder proves the wiring (visibility flags, anchors, i18n, data
 * layer) and is replaced by the real feature section in phases 2-5.
 */
import { useTranslation } from 'react-i18next';

import { Section } from '@/components/layout/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';

/**
 * @param {Object} props
 * @param {string} props.id
 * @param {number} props.index
 * @param {number} props.phase
 * @param {import('react').ReactNode} [props.children]
 */
export function PlaceholderSection({ id, index, phase, children }) {
  const { t } = useTranslation();
  return (
    <Section id={id} className="border-t border-line/60">
      <div className="container-fluid flex flex-col gap-10">
        <SectionHeading
          id={`${id}-title`}
          index={String(index).padStart(2, '0')}
          eyebrow={`/${id}`}
          title={t(`sections.${id}`)}
          description={t('sections.placeholder', { phase })}
        />
        {children}
      </div>
    </Section>
  );
}
