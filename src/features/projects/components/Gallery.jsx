import { AnimatePresence, m } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import '@/i18n/work';
import { LineIcon } from '@/components/ui/LineIcon';
import { useLocale } from '@/hooks/useLocale';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { EASE } from '@/utils/motion';

/** Slide between images; `custom` is the travel direction (+1 next, -1 previous). */
const SLIDE = {
  enter: (/** @type {number} */ d) => ({ x: `${d * 8}%`, opacity: 0 }),
  center: { x: '0%', opacity: 1, transition: { duration: 0.55, ease: EASE.outExpo } },
  exit: (/** @type {number} */ d) => ({
    x: `${d * -8}%`,
    opacity: 0,
    transition: { duration: 0.3, ease: EASE.snap },
  }),
};

/**
 * Modal image viewer on a native `<dialog>` (top layer, focus contained,
 * `Esc` closes). Arrow keys follow the reading direction: in RTL the left
 * arrow moves forward. Home/End jump to the first/last image. Focus returns
 * to the thumbnail that opened it.
 *
 * @param {{
 *   images: Array<{ image: string, alt: string }>,
 *   index: number,
 *   onIndex: (index: number, direction: number) => void,
 *   direction: number,
 *   onClose: () => void,
 * }} props
 */
function Lightbox({ images, index, onIndex, direction, onClose }) {
  const { t } = useTranslation();
  const { dir } = useLocale();
  const { lenisRef } = useSmoothScroll();
  const ref = useRef(/** @type {HTMLDialogElement | null} */ (null));
  const total = images.length;
  const current = images[index];

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    const lenis = lenisRef.current;
    lenis?.stop();
    return () => {
      lenis?.start();
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, [lenisRef]);

  const go = useCallback(
    (/** @type {number} */ step) => onIndex((index + step + total) % total, step),
    [index, total, onIndex],
  );

  const onKeyDown = (/** @type {import('react').KeyboardEvent} */ event) => {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    if (event.key === forward) go(1);
    else if (event.key === back) go(-1);
    else if (event.key === 'Home') onIndex(0, -1);
    else if (event.key === 'End') onIndex(total - 1, 1);
    else return;
    event.preventDefault();
  };

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={t('caseStudy.lightbox.label')}
      onKeyDown={onKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      data-lenis-prevent
    >
      <figure className="lightbox__figure">
        <div className="lightbox__stage">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <m.img
              key={current.image}
              src={current.image}
              alt={current.alt}
              width={1600}
              height={1000}
              className="lightbox__image"
              custom={direction}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
            />
          </AnimatePresence>
        </div>
        <figcaption className="lightbox__caption">
          <span className="lightbox__count" dir="ltr" aria-live="polite">
            {t('caseStudy.lightbox.counter', { index: index + 1, total })}
          </span>
          <span>{current.alt}</span>
        </figcaption>
      </figure>
      {total > 1 && (
        <>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            onClick={() => go(-1)}
            aria-label={t('caseStudy.lightbox.prev')}
          >
            <LineIcon name={dir === 'rtl' ? 'chevron-right' : 'chevron-left'} />
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            onClick={() => go(1)}
            aria-label={t('caseStudy.lightbox.next')}
          >
            <LineIcon name={dir === 'rtl' ? 'chevron-left' : 'chevron-right'} />
          </button>
        </>
      )}
      <button
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label={t('caseStudy.lightbox.close')}
        autoFocus
      >
        <LineIcon name="x" />
      </button>
    </dialog>
  );
}

/**
 * Case-study gallery: real thumbnails (buttons) that open the lightbox.
 * @param {{ images: Array<{ image: string, alt: string }> }} props
 */
export function Gallery({ images }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ index: -1, direction: 1 });
  const opener = useRef(/** @type {HTMLElement | null} */ (null));

  const open = (/** @type {number} */ index, /** @type {HTMLElement} */ trigger) => {
    opener.current = trigger;
    setState({ index, direction: 1 });
  };
  const close = useCallback(() => {
    setState((s) => ({ ...s, index: -1 }));
    // Return focus to the thumbnail that opened the viewer.
    requestAnimationFrame(() => opener.current?.focus());
  }, []);
  const onIndex = useCallback(
    (/** @type {number} */ index, /** @type {number} */ direction) =>
      setState({ index, direction }),
    [],
  );

  if (images.length === 0) return null;

  return (
    <>
      <ul className="gallery">
        {images.map((item, i) => (
          <li key={item.image} className="gallery__cell" data-gallery-cell>
            <button
              type="button"
              className="gallery__item"
              onClick={(event) => open(i, event.currentTarget)}
              aria-label={t('caseStudy.openImage', {
                index: i + 1,
                total: images.length,
                alt: item.alt,
              })}
            >
              <img
                src={item.image}
                alt={item.alt}
                width={1600}
                height={1000}
                loading="lazy"
                decoding="async"
              />
            </button>
          </li>
        ))}
      </ul>
      {state.index >= 0 && (
        <Lightbox
          images={images}
          index={state.index}
          direction={state.direction}
          onIndex={onIndex}
          onClose={close}
        />
      )}
    </>
  );
}
