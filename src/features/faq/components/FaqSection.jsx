import { lazy, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { LineIcon } from '@/components/ui/LineIcon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { useFaqs } from '../hooks/useFaqs';

const FaqDirector = lazy(() => import('../fx/FaqDirector'));

/**
 * FAQ, the MAN station ("man faq"): the manual the visitor reads before
 * building the request, laid out like a man page (NAME, SYNOPSIS,
 * DESCRIPTION) with a `less`-style pager line the director keeps in step
 * with the scroll.
 *
 * The accordion is native `<details name="faq">`: it works with no
 * JavaScript, exposes its expanded state to assistive technology, opens on
 * find-in-page, and keeps one question open at a time (the `name` group,
 * plus a toggle handler for browsers without it). Every answer is in the
 * prerendered HTML. The height animates in CSS where supported.
 */
export default function FaqSection() {
  const { t } = useTranslation();
  const { data } = useFaqs();
  const faqs = data?.data ?? [];
  const listRef = useRef(/** @type {HTMLOListElement | null} */ (null));

  /** One open at a time, also where `<details name>` is not supported. */
  const onToggle = (/** @type {import('react').SyntheticEvent<HTMLDetailsElement>} */ event) => {
    const current = event.currentTarget;
    if (!current.open) return;
    listRef.current?.querySelectorAll('details[open]').forEach((other) => {
      if (other !== current) /** @type {HTMLDetailsElement} */ (other).open = false;
    });
  };

  if (faqs.length === 0) return null;

  return (
    <Section id="faq" className="faq">
      <div className="container-fluid faq__layout">
        <SectionHeading
          id="faq-title"
          index={getStation(stationForSection('faq'))?.code}
          eyebrow={<span dir="ltr">{t('faq.command')}</span>}
          title={t('sections.faq')}
          description={t('faq.lead')}
        />

        <div className="man" data-man>
          <p className="man__bar" aria-hidden="true" dir="ltr">
            <span>{t('faq.header')}</span>
            <span className="man__manual">{t('faq.manual')}</span>
            <span>{t('faq.header')}</span>
          </p>

          <div className="man__block">
            <h3 className="man__label">{t('faq.name')}</h3>
            <p className="man__text">{t('faq.nameText')}</p>
          </div>
          <div className="man__block">
            <h3 className="man__label">{t('faq.synopsis')}</h3>
            <p className="man__text man__synopsis" dir="ltr">
              <b>faq</b> [<i>-1</i> … <i>-{faqs.length}</i>]
            </p>
          </div>
          <div className="man__block man__block--list">
            <h3 className="man__label">{t('faq.description')}</h3>
            <ol ref={listRef} className="man__list">
              {faqs.map((faq, i) => (
                <li key={faq.id} className="man__entry" data-man-entry>
                  <details className="man__item" name="faq" open={i === 0} onToggle={onToggle}>
                    <summary className="man__summary">
                      <span className="man__opt" dir="ltr" aria-hidden="true">
                        -{i + 1}
                      </span>
                      <h4 className="man__q">{faq.question}</h4>
                      <span className="man__toggle" aria-hidden="true">
                        <LineIcon name="plus" />
                      </span>
                    </summary>
                    <div className="man__a">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </div>

          <p className="man__pager" aria-hidden="true" dir="ltr">
            <span>{t('faq.pager')}</span> <span data-man-pager>line 1/{faqs.length} (TOP)</span>
          </p>
        </div>
      </div>
      <SectionFx target="faq">
        <FaqDirector total={faqs.length} />
      </SectionFx>
    </Section>
  );
}
