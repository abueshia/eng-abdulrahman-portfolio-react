/**
 * Portrait asset facts, produced by the image pipeline (`scripts/images.js`).
 *
 * Variants are imported through Vite (fingerprinted URLs, immutable caching)
 * and the facts file tells the hero how to stage them: a transparent cutout
 * breaks out of the frame; an opaque photo is cropped and graded inside it;
 * a missing file falls back to a monogram.
 */
import facts from '@/assets/portrait/portrait.json';

/** @type {Record<string, string>} */
const files = import.meta.glob('/src/assets/portrait/portrait-*.{avif,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/**
 * @typedef {Object} Portrait
 * @property {'cutout' | 'photo' | 'missing'} status
 * @property {string} [avif]       `srcset` of the AVIF variants.
 * @property {string} [webp]       `srcset` of the WebP variants.
 * @property {string} [src]        Largest WebP (the `<img src>` fallback).
 * @property {string} [mask]       Smallest WebP, used as a CSS mask for rim light.
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} aspect       width / height of the figure.
 * @property {{ x: number, chin: number }} head  Fractions of the figure box.
 * @property {boolean} lowRes      Source figure is too small for crisp rendering.
 */

/**
 * @param {typeof facts} data
 * @param {Record<string, string>} urls
 * @returns {Portrait}
 */
export function resolvePortrait(data, urls) {
  const head = /** @type {any} */ (data).head ?? { x: 0.5, chin: 0.25 };
  const widths = /** @type {number[]} */ (/** @type {any} */ (data).widths ?? []);
  const url = (/** @type {number} */ w, /** @type {string} */ ext) =>
    urls[`/src/assets/portrait/portrait-${w}.${ext}`];

  if (data.status === 'missing' || widths.length === 0 || !url(widths[0], 'webp')) {
    return { status: 'missing', aspect: 0.45, head, lowRes: false };
  }

  const srcset = (/** @type {string} */ ext) =>
    widths.map((w) => `${url(w, ext)} ${w}w`).join(', ');
  const width = /** @type {number} */ (/** @type {any} */ (data).width);
  const height = /** @type {number} */ (/** @type {any} */ (data).height);

  return {
    status: /** @type {'cutout' | 'photo'} */ (data.status),
    avif: srcset('avif'),
    webp: srcset('webp'),
    src: url(widths[widths.length - 1], 'webp'),
    mask: url(widths[0], 'webp'),
    width,
    height,
    aspect: width / height,
    head,
    lowRes: /** @type {any} */ (data.source?.figureHeight ?? 0) < 900,
  };
}

export const portrait = resolvePortrait(facts, files);
