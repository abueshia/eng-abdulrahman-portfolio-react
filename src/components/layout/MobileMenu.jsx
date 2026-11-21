import { AnimatePresence, m } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowUpRight, LuX } from 'react-icons/lu';

import { Button } from '@/components/ui/Button';
import { LocalizedLink } from '@/components/ui/LocalizedLink';
import { paths, SECTION_IDS } from '@/config/routes';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { EASE } from '@/utils/motion';
import { LocaleSwitch } from './LocaleSwitch';
import { SoundToggle } from './SoundToggle';
import { ThemeToggle } from './ThemeToggle';
import { useNavItems } from '@/hooks/useNavItems';

const listVariants = {
  open: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
  closed: {},
};
const itemVariants = {
  open: { y: 0, opacity: 1, transition: { duration: 0.6, ease: EASE.outExpo } },
  closed: { y: 32, opacity: 0 },
};

/**
 * Full-screen navigation for touch / small screens. Designed for thumbs:
 * large type, generous hit areas, primary CTA in the bottom zone.
 *
 * Accessibility: dialog semantics, Escape to close, focus moved in on open,
 * restored to the trigger on close, Tab cycles within the dialog, and page
 * scrolling is locked while open.
 *
 * @param {{ open: boolean, onClose: () => void }} props
 */
export function MobileMenu({ open, onClose }) {
  const { t } = useTranslation();
  const navItems = useNavItems();
  const { lenisRef } = useSmoothScroll();
  const dialogRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = /** @type {HTMLElement | null} */ (document.activeElement);
    const lenis = lenisRef.current;
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('a, button')?.focus();

    /** @param {KeyboardEvent} event */
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll('a[href], button:not([disabled])');
      const first = /** @type {HTMLElement} */ (focusables[0]);
      const last = /** @type {HTMLElement} */ (focusables[focusables.length - 1]);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      lenis?.start();
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, lenisRef]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={dialogRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t('a11y.mobileNav')}
          className="fixed inset-0 z-[70] flex flex-col bg-canvas lg:hidden"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.7, ease: EASE.inOutQuart }}
        >
          <div className="container-fluid flex h-[var(--nav-height)] items-center justify-between">
            <span className="font-mono text-xs text-ink-dim" dir="ltr">
              ~/navigation
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('a11y.closeMenu')}
              className="grid size-10 place-items-center rounded-full border border-line text-ink"
            >
              <LuX aria-hidden="true" className="size-5" />
            </button>
          </div>

          <m.ul
            className="container-fluid flex flex-1 flex-col justify-center gap-1"
            variants={listVariants}
            initial="closed"
            animate="open"
          >
            {navItems.map((item, index) => (
              <m.li key={item.key} variants={itemVariants}>
                <LocalizedLink
                  to={item.to}
                  onClick={onClose}
                  className="group flex items-baseline gap-4 border-b border-line/60 py-3 font-display text-4xl font-semibold text-ink xs:text-5xl"
                >
                  <span aria-hidden="true" className="font-mono text-xs text-ember">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {t(item.key)}
                  <LuArrowUpRight
                    aria-hidden="true"
                    className="ms-auto size-6 text-ink-dim transition-transform duration-300 group-active:-translate-y-1 rtl:-scale-x-100"
                  />
                </LocalizedLink>
              </m.li>
            ))}
          </m.ul>

          <div className="container-fluid flex items-center gap-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Button
              as={LocalizedLink}
              to={paths.section(SECTION_IDS.contact)}
              onClick={onClose}
              size="lg"
              className="flex-1"
            >
              {t('nav.cta')}
            </Button>
            <LocaleSwitch size="lg" />
            <ThemeToggle size="lg" />
            <SoundToggle size="lg" />
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
