import { useTranslation } from 'react-i18next';
import { LuMenu } from 'react-icons/lu';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Logo } from '@/components/ui/Logo';
import { NAV_ITEMS } from '@/config/navigation';
import { paths, SECTION_IDS } from '@/config/routes';
import { useScrollState } from '@/hooks/useScrollState';
import { cn } from '@/utils/cn';
import { LocaleSwitch } from './LocaleSwitch';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

/**
 * Fixed top navigation.
 *
 * - Transparent over the hero, glass once scrolled.
 * - Slides away on downward scroll and returns on upward scroll, giving
 *   content the full viewport while reading.
 * - Below `lg` the links collapse into a full-screen menu.
 */
export function Navbar() {
  const { t } = useTranslation();
  const { scrolled, hidden } = useScrollState();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-transform duration-500 ease-out-expo',
          hidden && !menuOpen && '-translate-y-full',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 -z-10 border-b transition-[background-color,border-color,backdrop-filter] duration-500',
            scrolled ? 'glass border-line/60' : 'border-transparent',
          )}
        />
        <nav
          aria-label={t('a11y.primaryNav')}
          className="container-fluid flex h-[var(--nav-height)] items-center justify-between gap-6"
        >
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item, index) => (
              <li key={item.key}>
                <LocalizedLink
                  to={item.to}
                  className="group relative inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-2 text-sm text-ink-muted transition-colors duration-300 hover:text-ink"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-[10px] text-ink-dim transition-colors group-hover:text-ember"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {t(item.key)}
                </LocalizedLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <LocaleSwitch />
            <ThemeToggle />
            <Button
              as={LocalizedLink}
              to={paths.section(SECTION_IDS.contact)}
              size="sm"
              className="ms-2 hidden md:inline-flex"
            >
              {t('nav.cta')}
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('a11y.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid size-10 place-items-center rounded-full border border-line text-ink lg:hidden"
            >
              <LuMenu aria-hidden="true" className="size-5" />
            </button>
          </div>
        </nav>
      </header>
      {/* Rendered outside <header>: its transform would re-anchor position:fixed. */}
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
