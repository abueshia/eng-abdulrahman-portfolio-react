/**
 * Reviewer photo pipeline, entirely in the browser:
 *
 *  1. `checkImageFile`: JPG/PNG/WebP only, under 5 MB (checked before decoding).
 *  2. `squareAvatar`: decodes (honouring the EXIF orientation), crops the
 *     centre square, draws it at 256×256 on a canvas and re-encodes it as
 *     WebP (JPEG where WebP encoding is missing). Re-encoding from pixels
 *     drops every metadata block, EXIF and GPS included.
 *
 * The server re-validates and re-encodes anyway (see the README contract).
 */

export const AVATAR_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_SIZE = 256;

/**
 * @param {File | Blob | null | undefined} file
 * @returns {'photoType' | 'photoSize' | null} An error key under `testimonials.write.errors`.
 */
export function checkImageFile(file) {
  if (!file || !AVATAR_TYPES.includes(file.type)) return 'photoType';
  if (file.size >= AVATAR_MAX_BYTES) return 'photoSize';
  return null;
}

/**
 * Decodes an image file into something drawable.
 * @param {Blob} file
 * @returns {Promise<{ source: CanvasImageSource, width: number, height: number, release: () => void }>}
 */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => {},
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {string} type
 * @param {number} quality
 * @returns {Promise<Blob | null>}
 */
const encode = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Square, resized, metadata-free avatar.
 * @param {Blob} file A file that passed `checkImageFile`.
 * @param {number} [size]
 * @returns {Promise<Blob>}
 */
export async function squareAvatar(file, size = AVATAR_SIZE) {
  const { source, width, height, release } = await decode(file);
  try {
    const side = Math.min(width, height);
    if (!side) throw new Error('Empty image');
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      source,
      (width - side) / 2,
      (height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
    const webp = await encode(canvas, 'image/webp', 0.82);
    // Browsers without a WebP encoder fall back to PNG; prefer a JPEG then.
    const blob = webp?.type === 'image/webp' ? webp : await encode(canvas, 'image/jpeg', 0.85);
    if (!blob) throw new Error('Encoding failed');
    return blob;
  } finally {
    release();
  }
}
