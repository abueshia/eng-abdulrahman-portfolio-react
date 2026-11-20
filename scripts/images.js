/**
 * Image pipeline (`npm run images`; also runs automatically from the Vite
 * plugin in `vite.config.js` on dev start, on every build and whenever the
 * source portrait changes while `npm run dev` is running).
 *
 * Source: public/images/profile-cutout.png (owner-approved portrait).
 * Output (committed, imported by the app so Vite fingerprints the files):
 *   src/assets/portrait/portrait-<w>.avif|webp   responsive variants
 *   src/assets/portrait/portrait.json            facts the UI and `data:todo` read
 *   src/assets/textures/grain.png                tiled film-grain texture
 *
 * Replacing the portrait is the whole workflow: drop a new file at the same
 * path and the pipeline re-detects transparency, trims the empty margins,
 * finds the head and regenerates every variant.
 *
 *  - Transparent cutout → `status: "cutout"`: trimmed to the figure so the
 *    hero can let the head break out of its frame.
 *  - Opaque photo (or a JPEG renamed to .png) → `status: "photo"`: kept whole;
 *    the hero falls back to a cropped, masked, colour-graded frame.
 *  - No file → `status: "missing"`: the hero shows a monogram.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PORTRAIT_SOURCE = 'public/images/profile-cutout.png';
const PORTRAIT_DIR = 'src/assets/portrait';
const GRAIN_FILE = 'src/assets/textures/grain.png';

/** Candidate output widths; only those the source can honestly serve are used. */
const WIDTHS = [360, 540, 720, 960, 1280];
/** Upscaling beyond 2× invents detail that is not there. */
const MAX_UPSCALE = 2;
/** Bump to force regeneration when this script's output format changes. */
const PIPELINE_VERSION = 4;

/**
 * @typedef {Object} PortraitFacts
 * @property {'cutout' | 'photo' | 'missing'} status
 * @property {number} [width]   Intrinsic width of the largest variant.
 * @property {number} [height]
 * @property {number[]} [widths]
 * @property {{ x: number, chin: number }} [head] Head centre (x) and chin line (y), as fractions.
 * @property {{ width: number, height: number, figureWidth: number, figureHeight: number, hash: string }} [source]
 * @property {number} version
 */

/**
 * Bounding box of pixels whose alpha exceeds `threshold`.
 * @param {Buffer} rgba
 * @param {number} width
 * @param {number} height
 */
function alphaBounds(rgba, width, height, threshold = 8) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] > threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }
  return right < 0 ? null : { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/**
 * Locates the head inside a trimmed cutout: its horizontal centre and the
 * chin line (where the silhouette widens into the shoulders).
 * @param {Buffer} rgba Trimmed RGBA pixels.
 * @param {number} width
 * @param {number} height
 * @returns {{ x: number, chin: number }} Fractions of width / height.
 */
function findHead(rgba, width, height) {
  /** @type {Array<{ from: number, to: number } | null>} */
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    let from = -1;
    let to = -1;
    for (let x = 0; x < width; x += 1) {
      if (rgba[(y * width + x) * 4 + 3] > 32) {
        if (from < 0) from = x;
        to = x;
      }
    }
    rows.push(from < 0 ? null : { from, to });
  }
  const crown = rows.slice(0, Math.max(4, Math.round(height * 0.1))).filter(Boolean);
  const headWidth =
    crown.reduce(
      (sum, row) => sum + /** @type {any} */ (row.to - /** @type {any} */ (row).from),
      0,
    ) / Math.max(crown.length, 1);
  const centre =
    crown.reduce(
      (sum, row) => sum + /** @type {any} */ (row.from + /** @type {any} */ (row).to) / 2,
      0,
    ) / Math.max(crown.length, 1);
  // Chin: first row (below the crown) where the silhouette is clearly wider than the head.
  let chin = Math.round(height * 0.25);
  for (let y = crown.length; y < height * 0.5; y += 1) {
    const row = rows[y];
    if (row && row.to - row.from > headWidth * 1.9) {
      chin = y;
      break;
    }
  }
  return {
    x: Number((centre / width).toFixed(4)),
    chin: Number((chin / height).toFixed(4)),
  };
}

/** Deterministic PRNG so the grain texture never changes between runs. */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {import('sharp')} sharp
 * @param {string} root
 */
async function generateGrain(sharp, root) {
  const file = join(root, GRAIN_FILE);
  if (existsSync(file)) return false;
  const size = 160;
  const random = mulberry32(0x5eed);
  const pixels = Buffer.alloc(size * size);
  for (let i = 0; i < pixels.length; i += 1) {
    // Triangular distribution: centred on mid-grey, so `overlay` blending is neutral on average.
    pixels[i] = Math.round(((random() + random()) / 2) * 255);
  }
  mkdirSync(join(root, 'src/assets/textures'), { recursive: true });
  await sharp(pixels, { raw: { width: size, height: size, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(file);
  return true;
}

/**
 * Runs the pipeline. Cheap when nothing changed (source hash + version check).
 * @param {{ root?: string, force?: boolean, log?: (message: string) => void }} [options]
 * @returns {Promise<PortraitFacts>}
 */
export async function generateImages({
  root = process.cwd(),
  force = false,
  log = console.log,
} = {}) {
  const sharp = (await import('sharp')).default;
  const outDir = join(root, PORTRAIT_DIR);
  const factsFile = join(outDir, 'portrait.json');
  const sourceFile = join(root, PORTRAIT_SOURCE);
  mkdirSync(outDir, { recursive: true });

  if (await generateGrain(sharp, root)) log(`  ✓ ${GRAIN_FILE}`);

  const previous = existsSync(factsFile) ? JSON.parse(readFileSync(factsFile, 'utf-8')) : null;

  if (!existsSync(sourceFile)) {
    /** @type {PortraitFacts} */
    const facts = { status: 'missing', version: PIPELINE_VERSION };
    if (previous?.status !== 'missing' || force) {
      clearVariants(outDir);
      writeFileSync(factsFile, `${JSON.stringify(facts, null, 2)}\n`);
      log(`  ⚠ ${PORTRAIT_SOURCE} not found: the hero will show a monogram.`);
    }
    return facts;
  }

  const input = readFileSync(sourceFile);
  const hash = createHash('sha1').update(input).digest('hex').slice(0, 12);
  if (!force && previous?.source?.hash === hash && previous.version === PIPELINE_VERSION) {
    return previous;
  }

  const meta = await sharp(input).metadata();
  const { data: rgba, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // A real cutout has a substantial transparent area (not just an alpha channel).
  let transparent = 0;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 128) transparent += 1;
  const isCutout = meta.hasAlpha === true && transparent / (info.width * info.height) > 0.05;

  let pipeline = sharp(input);
  let figure = { left: 0, top: 0, width: info.width, height: info.height };
  let head = { x: 0.5, chin: 0.25 };

  if (isCutout) {
    figure = alphaBounds(rgba, info.width, info.height) ?? figure;
    pipeline = pipeline.extract(figure);
    const trimmed = await sharp(input).extract(figure).ensureAlpha().raw().toBuffer();
    head = findHead(trimmed, figure.width, figure.height);
  }

  const maxWidth = Math.min(Math.round(figure.width * MAX_UPSCALE), WIDTHS[WIDTHS.length - 1]);
  let widths = WIDTHS.filter((w) => w <= maxWidth);
  if (widths.length === 0) widths = [maxWidth];
  const aspect = figure.height / figure.width;

  clearVariants(outDir);
  const base = await pipeline.toBuffer();
  for (const width of widths) {
    const upscaling = width > figure.width;
    const resized = sharp(base)
      .resize({ width, kernel: 'lanczos3' })
      .sharpen(upscaling ? { sigma: 0.7 } : undefined);
    await resized
      .clone()
      .avif({ quality: 58, effort: 5 })
      .toFile(join(outDir, `portrait-${width}.avif`));
    await resized
      .clone()
      .webp({ quality: 80, alphaQuality: 90, effort: 5 })
      .toFile(join(outDir, `portrait-${width}.webp`));
  }

  const largest = widths[widths.length - 1];

  /** @type {PortraitFacts} */
  const facts = {
    status: isCutout ? 'cutout' : 'photo',
    width: largest,
    height: Math.round(largest * aspect),
    widths,
    head,
    source: {
      width: info.width,
      height: info.height,
      figureWidth: figure.width,
      figureHeight: figure.height,
      hash,
    },
    version: PIPELINE_VERSION,
  };
  writeFileSync(factsFile, `${JSON.stringify(facts, null, 2)}\n`);
  log(
    `  ✓ portrait (${facts.status}): ${widths.join(', ')}w · avif + webp` +
      ` · figure ${figure.width}×${figure.height}px of ${info.width}×${info.height}`,
  );
  return facts;
}

/** @param {string} dir */
function clearVariants(dir) {
  for (const file of readdirSync(dir)) {
    if (/^portrait-\d+\.(avif|webp)$/.test(file)) rmSync(join(dir, file));
  }
}

// CLI: `node scripts/images.js [--force]`
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  console.log('Image pipeline');
  const facts = await generateImages({ root, force: process.argv.includes('--force') });
  if (facts.status !== 'cutout') {
    console.warn(`  ⚠ portrait status: ${facts.status} (see TODO_REAL_DATA.md)`);
  }
}
