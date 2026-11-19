import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { stripLocale } from '@/config/routes';
import { useLocale } from '@/hooks/useLocale';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

/**
 * Router link that accepts locale-agnostic paths (`/blog`, `/#contact`) and
 * prefixes the active locale. Hash links pointing at the current page
 * smooth-scroll instead of navigating, keeping history clean.
 *
 * @type {import('react').ForwardRefExoticComponent<{ to: string, onClick?: (e: import('react').MouseEvent<HTMLAnchorElement>) => void } & Record<string, any>>}
 */
export const LocalizedLink = forwardRef(function LocalizedLink({ to, onClick, ...props }, ref) {
  const { localize } = useLocale();
  const { pathname } = useLocation();
  const { scrollTo } = useSmoothScroll();

  const [targetPath, hash] = to.split('#');
  const isSamePageHash = Boolean(hash) && (targetPath || '/') === stripLocale(pathname);

  /** @param {import('react').MouseEvent<HTMLAnchorElement>} event */
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || !isSamePageHash) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    const target = document.getElementById(hash);
    if (!target) return;
    event.preventDefault();
    window.history.replaceState(window.history.state, '', `#${hash}`);
    scrollTo(target);
  };

  return <Link ref={ref} to={localize(to)} onClick={handleClick} {...props} />;
});
