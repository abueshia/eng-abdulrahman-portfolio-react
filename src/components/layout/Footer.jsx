import { useTranslation } from 'react-i18next';
import { LuArrowUp, LuArrowUpRight } from 'react-icons/lu';

import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Logo } from '@/components/ui/Logo';
import { env } from '@/config/env';
import { useSettings } from '@/hooks/useSettings';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useNavItems } from '@/hooks/useNavItems';

/**
 * Site footer (foundation version; the cinematic wordmark lands in phase 5).
 * Shows the build signature (version + commit) injected at build time.
 */
export function Footer() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const { data } = useSettings();
  const { scrollTo } = useSmoothScroll();
  const general = data?.data?.general;
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-line bg-canvas-raised">
      <div className="container-fluid grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:py-20">
        <div className="flex flex-col gap-5">
          <Logo />
          <p className="max-w-sm text-ink-muted">{t('footer.tagline')}</p>
        </div>

        <nav aria-label={t('a11y.footerNav')}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {navItems.map((item) => (
              <li key={item.key}>
                <LocalizedLink
                  to={item.to}
                  className="text-ink-muted transition-colors hover:text-ink"
                >
                  {t(item.key)}
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="flex flex-col gap-3 text-sm">
          {general?.socials?.map((social) => (
            <li key={social.platform}>
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-2 text-ink-muted transition-colors hover:text-ink"
              >
                {social.label}
                <LuArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
                />
                <span className="sr-only">{t('a11y.externalLink')}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line">
        <div className="container-fluid flex flex-col gap-4 py-6 text-xs text-ink-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {general?.owner_name ?? t('meta.siteName')}. {t('footer.rights')}
          </p>
          <p className="font-mono" dir="ltr">
            {t('footer.version', { version: env.appVersion, commit: env.commit })}
          </p>
          <button
            type="button"
            onClick={() => scrollTo(0)}
            className="inline-flex items-center gap-2 self-start text-ink-muted transition-colors hover:text-ink sm:self-auto"
          >
            {t('a11y.backToTop')}
            <LuArrowUp aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
