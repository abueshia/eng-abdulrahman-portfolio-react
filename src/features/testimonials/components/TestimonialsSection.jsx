import { lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/sections';
import '@/i18n/work';
import { Section } from '@/components/layout/Section';
import { SectionFx } from '@/components/layout/SectionFx';
import { LineIcon } from '@/components/ui/LineIcon';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getStation, stationForSection } from '@/config/journey';
import { SampleBadge } from '@/features/projects/components/SampleBadge';
import { useLocale } from '@/hooks/useLocale';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useTestimonials } from '../hooks/useTestimonials';

const CarouselEngine = lazy(() => import('./CarouselEngine'));
const TestimonialsDirector = lazy(() => import('../fx/TestimonialsDirector'));

/**
 * Testimonials, the REVIEW station ("Code Review"): every testimonial is a
 * pull-request review that approved the work.
 *
 * - The PR header aggregates the real data: approvals count and, when the
 *   records carry them, the checks the reviews passed. No names, photos,
 *   logos, stars or ratings: a review is its role and its words. Sample
 *   records say so (badge on the section and on every card). The director runs the checks
 *   with the scroll and flips the state to "Approved" once they all pass.
 * - The reviews are a carousel. Prerendered as a native scroll-snap row
 *   (swipe works with no JS, every review is text in the HTML); near the
 *   viewport, embla takes over (lazy chunk) with autoplay that stops on
 *   hover and focus, pauses off screen, and never runs under reduced motion.
 */
export default function TestimonialsSection() {
  const { t } = useTranslation();
  const { dir } = useLocale();
  const reduced = useReducedMotion();
  const { data } = useTestimonials();
  const items = useMemo(() => data?.data ?? [], [data]);
  const viewportRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [api, setApi] = useState(
    /** @type {import('embla-carousel').EmblaCarouselType | null} */ (null),
  );
  const [selected, setSelected] = useState(0);

  const checks = useMemo(() => [...new Set(items.flatMap((item) => item.checks ?? []))], [items]);
  const hasSamples = items.some((item) => item.is_sample);

  // Selected slide: from embla when it runs, from the native scroller before.
  useEffect(() => {
    if (api) {
      const onSelect = () => setSelected(api.selectedScrollSnap());
      onSelect();
      api.on('select', onSelect).on('reInit', onSelect);
      return () => {
        api.off('select', onSelect).off('reInit', onSelect);
      };
    }
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const slide = viewport.querySelector('[data-review]');
        const width = slide ? slide.getBoundingClientRect().width : viewport.clientWidth;
        setSelected(Math.round(Math.abs(viewport.scrollLeft) / Math.max(width, 1)));
      });
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener('scroll', onScroll);
    };
  }, [api]);

  const goTo = useCallback(
    (/** @type {number} */ index) => {
      if (api) {
        api.scrollTo(index);
        return;
      }
      const slide = viewportRef.current?.querySelectorAll('[data-review]')[index];
      slide?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'start',
      });
    },
    [api, reduced],
  );
  const step = (/** @type {number} */ delta) => {
    if (api) {
      if (delta > 0) api.scrollNext();
      else api.scrollPrev();
      return;
    }
    goTo(Math.min(items.length - 1, Math.max(0, selected + delta)));
  };

  if (items.length === 0) return null;

  return (
    <Section id="testimonials" className="reviews-section">
      <div className="container-fluid reviews-section__layout">
        <SectionHeading
          id="testimonials-title"
          index={getStation(stationForSection('testimonials'))?.code}
          eyebrow={<span dir="ltr">{t('testimonials.command')}</span>}
          title={t('sections.testimonials')}
          description={t('testimonials.lead')}
        />

        <div className="pr" data-pr>
          <div className="pr__head">
            <p className="pr__title">
              <span className="pr__state" data-pr-state>
                <span className="pr__state-on">
                  <LineIcon name="check" /> {t('testimonials.status')}
                </span>
                <span className="pr__state-off" aria-hidden="true">
                  {t('testimonials.pending')}
                </span>
              </span>
              <span className="pr__name">
                <span className="pr__kind">{t('testimonials.pr')}</span>{' '}
                <bdi dir="ltr">{t('testimonials.prTitle')}</bdi>
              </span>
            </p>
            <div className="pr__meta">
              <span>{t('testimonials.reviewers', { count: items.length })}</span>
              {checks.length > 0 && (
                <>
                  <span className="pr__sep" aria-hidden="true">
                    ·
                  </span>
                  <span className="pr__passed">
                    {t('testimonials.checksPassed')} ·{' '}
                    {t('testimonials.checks', { count: checks.length })}
                  </span>
                </>
              )}
              {hasSamples && <SampleBadge className="pr__badge" />}
            </div>
            {checks.length > 0 && (
              <ul className="pr__checks" aria-label={t('testimonials.checksPassed')}>
                {checks.map((check) => (
                  <li key={check} className="pr__check" data-pr-check>
                    <span className="pr__tick" aria-hidden="true">
                      <LineIcon name="check" />
                    </span>
                    <bdi>{check}</bdi>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className="reviews"
            role="region"
            aria-roledescription="carousel"
            aria-label={t('testimonials.carousel')}
          >
            {/* Focusable so keyboard users can scroll the row without JavaScript.
                Slides are groups (carousel pattern), so the track is not a list. */}
            <div className="reviews__viewport" ref={viewportRef} data-embla="off" tabIndex={0}>
              <div className="reviews__track">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="review"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={t('testimonials.slide', { index: i + 1, total: items.length })}
                    data-review
                    data-active={i === selected ? 'true' : undefined}
                  >
                    <article className="review__card">
                      <header className="review__head">
                        <p className="review__who">
                          <b className="review__name">{item.name || item.role}</b>{' '}
                          <span className="review__verb">
                            <LineIcon name="check" /> {t('testimonials.approved')}
                          </span>
                        </p>
                        {item.is_sample && <SampleBadge className="review__badge" />}
                      </header>
                      {item.name && item.role && (
                        <p className="review__role">
                          {item.role}
                          {item.company && <> · {item.company}</>}
                        </p>
                      )}
                      <blockquote className="review__quote">
                        <p>{item.quote}</p>
                      </blockquote>
                      {(item.scope || item.checks?.length > 0) && (
                        <footer className="review__foot">
                          {item.scope && (
                            <p className="review__scope">
                              <span className="review__scope-key">{t('testimonials.scope')}:</span>{' '}
                              {item.scope}
                            </p>
                          )}
                          {item.checks?.length > 0 && (
                            <ul className="review__checks">
                              {item.checks.map((check) => (
                                <li key={check}>
                                  <LineIcon name="check" /> <bdi>{check}</bdi>
                                </li>
                              ))}
                            </ul>
                          )}
                        </footer>
                      )}
                    </article>
                  </div>
                ))}
              </div>
            </div>

            {items.length > 1 && (
              <div className="reviews__controls">
                <button
                  type="button"
                  className="reviews__arrow"
                  onClick={() => step(-1)}
                  aria-label={t('testimonials.prev')}
                >
                  <LineIcon name={dir === 'rtl' ? 'chevron-right' : 'chevron-left'} />
                </button>
                <ol className="reviews__dots">
                  {items.map((item, i) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="reviews__dot"
                        aria-label={t('testimonials.goTo', { index: i + 1 })}
                        aria-current={i === selected ? 'true' : undefined}
                        onClick={() => goTo(i)}
                      />
                    </li>
                  ))}
                </ol>
                <button
                  type="button"
                  className="reviews__arrow"
                  onClick={() => step(1)}
                  aria-label={t('testimonials.next')}
                >
                  <LineIcon name={dir === 'rtl' ? 'chevron-left' : 'chevron-right'} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <SectionFx target="testimonials">
        <CarouselEngine viewportRef={viewportRef} onApi={setApi} />
        <TestimonialsDirector />
      </SectionFx>
    </Section>
  );
}
