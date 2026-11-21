import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect, useMemo } from 'react';

import { useLocale } from '@/hooks/useLocale';

/**
 * The carousel engine (lazy chunk, loaded near the viewport, never under
 * reduced motion): embla takes over the prerendered scroll-snap row.
 *
 * It renders nothing. `useEmblaCarousel`'s ref is attached to the existing
 * viewport element, so the markup stays the prerendered one. Autoplay stops
 * while the pointer is over the carousel or focus is inside it (and resumes
 * after), and pauses whenever the carousel is off screen. Unmounting
 * destroys embla and restores the native scroller.
 *
 * @param {{
 *   viewportRef: import('react').RefObject<HTMLDivElement | null>,
 *   onApi: (api: import('embla-carousel').EmblaCarouselType | null) => void,
 * }} props
 */
export default function CarouselEngine({ viewportRef, onApi }) {
  const { dir } = useLocale();
  const plugins = useMemo(
    () => [
      Autoplay({
        delay: 6500,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    ],
    [],
  );
  const [emblaRef, api] = useEmblaCarousel(
    { align: 'start', loop: true, direction: dir, skipSnaps: false },
    plugins,
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    viewport.scrollLeft = 0;
    viewport.dataset.embla = 'on';
    emblaRef(viewport);
    return () => {
      emblaRef(null);
      viewport.dataset.embla = 'off';
    };
  }, [emblaRef, viewportRef]);

  useEffect(() => {
    onApi(api ?? null);
    return () => onApi(null);
  }, [api, onApi]);

  // Autoplay only while the carousel is on screen.
  useEffect(() => {
    const viewport = viewportRef.current;
    const autoplay = api?.plugins()?.autoplay;
    if (!viewport || !autoplay || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) autoplay.play();
      else autoplay.stop();
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [api, viewportRef]);

  return null;
}
