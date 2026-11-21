import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowUp, LuArrowUpRight } from 'react-icons/lu';

import '@/i18n/sections';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { env } from '@/config/env';
import { paths, SECTION_IDS } from '@/config/routes';
import { useNavItems } from '@/hooks/useNavItems';
import { useSectionVisible, useSettings } from '@/hooks/useSettings';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

const TICK = 30_000;
/** @param {() => void} onTick */
const subscribeClock = (onTick) => {
  const id = window.setInterval(onTick, TICK);
  return () => window.clearInterval(id);
};
/** Time rounded to the tick, so the snapshot is stable between ticks. */
const clockSnapshot = () => Math.floor(Date.now() / TICK) * TICK;

/**
 * The owner's local time, client-only: the prerender cannot know "now", so
 * the slot is reserved (`--:--`) and filled after hydration, every 30 s.
 * @param {string} timeZone
 * @param {string} locale
 */
function useZonedClock(timeZone, locale) {
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);
  if (now === null) return '--:--';
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    }).format(now);
  } catch {
    return '--:--';
  }
}

/**
 * The giant outline wordmark fills when it is reached, and empties again when
 * the visitor scrolls back up (state, not a one-shot entrance).
 * @param {import('react').RefObject<HTMLElement | null>} ref
 */
function useReached(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        el.dataset.reached = entry.isIntersecting ? 'true' : 'false';
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      delete el.dataset.reached;
    };
  }, [ref]);
}

/**
 * Footer, the BUILD SIGNATURE: the build that served the response.
 *
 * - A giant outline wordmark (the owner's name) that fills when reached.
 * - Sitemap of the visible sections only (hidden ones are never linked),
 *   socials, the owner's local time (settings timezone), the company role,
 *   and `v{version} · commit {hash}` injected at build time.
 *
 * A lazy chunk like the home sections: prerendered in full, hydrated when it
 * arrives, never part of the initial bundle.
 */
export default function Footer() {
  const { t, i18n } = useTranslation();
  const navItems = useNavItems();
  const { data } = useSettings();
  const { scrollTo } = useSmoothScroll();
  const faqVisible = useSectionVisible('faq');
  const reviewsVisible = useSectionVisible('testimonials');
  const general = data?.data?.general;
  const wordmarkRef = useRef(/** @type {HTMLParagraphElement | null} */ (null));
  const clock = useZonedClock(general?.timezone ?? 'Africa/Cairo', i18n.language);
  useReached(wordmarkRef);

  const sitemap = [
    { key: 'home', label: t('footer.home'), to: paths.home() },
    ...navItems.map((item) => ({ key: item.key, label: t(item.key), to: item.to })),
    ...(reviewsVisible
      ? [
          {
            key: 'reviews',
            label: t('footer.reviews'),
            to: paths.section(SECTION_IDS.testimonials),
          },
        ]
      : []),
    ...(faqVisible
      ? [{ key: 'faq', label: t('footer.faq'), to: paths.section(SECTION_IDS.faq) }]
      : []),
  ];
  const company = general?.company;

  return (
    <footer className="foot">
      <div className="container-fluid foot__inner">
        <p ref={wordmarkRef} className="foot__wordmark" aria-hidden="true">
          <span className="foot__ghost">{general?.owner_name}</span>
          <span className="foot__fill">{general?.owner_name}</span>
        </p>

        <div className="foot__grid">
          <div className="foot__id">
            <p className="foot__name">{general?.owner_name ?? t('meta.siteName')}</p>
            <p className="foot__role">{general?.job_title}</p>
            {company?.name && (
              <p className="foot__company">
                {t('about.companyLine', { role: company.role, company: company.name })}
              </p>
            )}
            <p className="foot__clock">
              <span className="foot__dot" aria-hidden="true" />
              <time dir="ltr" className="foot__time">
                {clock}
              </time>{' '}
              <span>
                {t('footer.localTime')} · <span dir="ltr">{general?.timezone}</span>
              </span>
            </p>
          </div>

          <nav aria-label={t('a11y.footerNav')} className="foot__col">
            <p className="foot__label">{t('footer.sitemap')}</p>
            <ul className="foot__links">
              {sitemap.map((item) => (
                <li key={item.key}>
                  <LocalizedLink to={item.to} className="foot__link">
                    {item.label}
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="foot__col">
            <p className="foot__label">{t('footer.socials')}</p>
            <ul className="foot__links">
              {general?.socials?.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="foot__link foot__link--ext"
                  >
                    {social.label}
                    <LuArrowUpRight aria-hidden="true" className="foot__ext" />
                    <span className="sr-only">{t('a11y.externalLink')}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="foot__bar">
        <div className="container-fluid foot__bar-inner">
          <p>
            © {new Date().getFullYear()} {general?.owner_name ?? t('meta.siteName')}.{' '}
            {t('footer.rights')}
          </p>
          <p className="foot__build" dir="ltr">
            <span className="foot__build-key">{t('footer.signature')}</span>{' '}
            {t('footer.version', { version: env.appVersion, commit: env.commit })}
          </p>
          <button type="button" onClick={() => scrollTo(0)} className="foot__top">
            {t('a11y.backToTop')}
            <LuArrowUp aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
