import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowUp, LuArrowUpRight } from 'react-icons/lu';

import '@/i18n/sections';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Logo } from '@/components/ui/Logo';
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
 * Footer, the BUILD SIGNATURE: the build that served the response.
 *
 * - Compact on purpose (one band plus a bar): logo, name and company role,
 *   the owner's local time (settings timezone), a sitemap of the visible
 *   sections only (hidden ones are never linked) and socials as wrapping
 *   rows, then the rights and `v{version} · commit {hash}` injected at
 *   build time.
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
  const clock = useZonedClock(general?.timezone ?? 'Africa/Cairo', i18n.language);

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
        <div className="foot__grid">
          <div className="foot__id">
            <div className="foot__brand">
              <Logo />
              <div>
                <p className="foot__name">{general?.owner_name ?? t('meta.siteName')}</p>
                {company?.name && (
                  <p className="foot__company">
                    {t('about.companyLine', { role: company.role, company: company.name })}
                  </p>
                )}
              </div>
            </div>
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
