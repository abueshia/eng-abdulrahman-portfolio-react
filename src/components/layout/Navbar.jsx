import { useTranslation } from 'react-i18next';
import { LuMenu } from 'react-icons/lu';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { Logo } from '@/components/ui/Logo';
import { isStationAnchor, stationForSection } from '@/config/journey';
import { paths, SECTION_IDS } from '@/config/routes';
import { useStation } from '@/features/journey/journey-store';
import { useScrollState } from '@/hooks/useScrollState';
import { cn } from '@/utils/cn';
import { LocaleSwitch } from './LocaleSwitch';
import { MobileMenu } from './MobileMenu';
import { SoundToggle } from './SoundToggle';
import { ThemeToggle } from './ThemeToggle';
import { useNavItems } from '@/hooks/useNavItems';

/**
 * Fixed top navigation.
 *
 * - Transparent over the hero, a solid surface once scrolled (no backdrop
 *   blur: over the animated canvases it was re-blurred every frame).
 * - Slides away on downward scroll and returns on upward scroll, giving
 *   content the full viewport while reading.
 * - Below `lg` the links collapse into a full-screen menu.
 * - Follows the journey: the link of the station the request is at is
 *   marked current (`aria-current="location"`, Ember index).
 */
export function Navbar() {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const station = useStation();
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
            'absolute inset-0 -z-10 border-b transition-[background-color,border-color] duration-500',
            scrolled ? 'nav-surface border-line/60' : 'border-transparent',
          )}
        />
        <nav
          aria-label={t('a11y.primaryNav')}
          className="container-fluid flex h-[var(--nav-height)] items-center justify-between gap-6"
        >
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((item, index) => {
              const current =
                station !== null &&
                item.section !== undefined &&
                isStationAnchor(item.section) &&
                stationForSection(item.section) === station;
              return (
                <li key={item.key}>
                  <LocalizedLink
                    to={item.to}
                    aria-current={current ? 'location' : undefined}
                    className={cn(
                      'group relative inline-flex items-baseline gap-1.5 rounded-full px-3.5 py-2 text-sm transition-colors duration-300 hover:text-ink',
                      current ? 'nav-current text-ink' : 'text-ink-muted',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'font-mono text-[10px] transition-colors group-hover:text-ember',
                        current ? 'text-ember' : 'text-ink-dim',
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {t(item.key)}
                  </LocalizedLink>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <SoundToggle desktopOnly />
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
