/**
 * Real-data report (`npm run data:todo`).
 *
 * Two very different kinds of "not real yet":
 *
 *  1. REQUIRED BEFORE PUBLISHING: values marked `TODO_REAL_DATA` and required
 *     public files that are missing or invalid (wrong format/dimensions).
 *     These fail the command (exit 1) and must be zero before going live.
 *
 *  2. TEMPORARY MOCK UNTIL THE API: whole mock files marked `MOCK_UNTIL_API`.
 *     They are expected until VITE_USE_MOCK=false and do not fail the command.
 *
 * 3. RECOMMENDED: quality issues that do not block publishing (e.g. a portrait
 *    too small to stay sharp at hero size). Listed, never fatal.
 *
 * Hidden sections (settings.sections_visibility) are listed for context.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SCAN = ['src/data', 'src/i18n', 'index.html'];

/** @param {string} path @returns {string[]} */
const walk = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => walk(join(path, name)))
    : [path];

const files = SCAN.map((p) => join(root, p))
  .filter(existsSync)
  .flatMap(walk)
  .filter((file) => !/\.test\./.test(file));

/* ---------------------------------------------------------------- images */

/**
 * Reads format, size and alpha support from an image header (PNG/JPEG only).
 * @param {Buffer} buf
 * @returns {{ format: string, width?: number, height?: number, alpha?: boolean }}
 */
function inspectImage(buf) {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    const colorType = buf[25];
    return {
      format: 'png',
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
      alpha: colorType === 4 || colorType === 6 || buf.includes(Buffer.from('tRNS')),
    };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 9) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      const length = buf.readUInt16BE(offset + 2);
      // SOF0..SOF15 except DHT (C4), JPG (C8), DAC (CC) carry the dimensions.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return {
          format: 'jpeg',
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
          alpha: false,
        };
      }
      offset += 2 + length;
    }
    return { format: 'jpeg', alpha: false };
  }
  return { format: 'unknown' };
}

/**
 * Required public files and what makes each one valid.
 * @type {Array<{ path: string, why: string, check?: (info: ReturnType<typeof inspectImage>) => string | null }>}
 */
const REQUIRED_FILES = [
  { path: 'public/cv/Abdulrahman_abu_eisha_CV.pdf', why: 'CV download' },
  {
    path: 'public/images/profile-cutout.png',
    why: 'hero portrait (transparent cutout)',
    check: (img) =>
      img.format === 'png' && img.alpha
        ? null
        : `must be a PNG with transparency; found ${img.format.toUpperCase()}` +
          (img.width ? ` ${img.width}×${img.height}` : '') +
          (img.alpha ? '' : ', no alpha channel'),
  },
  {
    path: 'public/images/og-cover.jpg',
    why: 'social preview (Open Graph)',
    check: (img) =>
      img.width === 1200 && img.height === 630
        ? null
        : `must be 1200×630; found ${img.format.toUpperCase()} ${img.width ?? '?'}×${img.height ?? '?'}`,
  },
];

/* ------------------------------------------------------------- collect */

const required = [];

for (const file of files) {
  readFileSync(file, 'utf-8')
    .split('\n')
    .forEach((line, i) => {
      const text = line.trim();
      if (text.includes('TODO_REAL_DATA') && !text.startsWith('export const TODO_REAL_DATA')) {
        required.push(`${relative(root, file)}:${i + 1}  ${text}`);
      }
    });
}

for (const { path, why, check } of REQUIRED_FILES) {
  const full = join(root, path);
  if (!existsSync(full)) {
    required.push(`${path}  missing (${why})`);
    continue;
  }
  const problem = check?.(inspectImage(readFileSync(full)));
  if (problem) required.push(`${path}  ${problem} (${why})`);
}

/** Quality notes that do not block publishing. */
const recommended = [];
const factsFile = join(root, 'src/assets/portrait/portrait.json');
if (existsSync(factsFile)) {
  const facts = JSON.parse(readFileSync(factsFile, 'utf-8'));
  const figure = facts.source;
  if (facts.status === 'cutout' && figure && figure.figureHeight < 900) {
    recommended.push(
      `public/images/profile-cutout.png  the figure is only ${figure.figureWidth}×${figure.figureHeight}px after trimming; ` +
        'a cutout ≥ 1400px tall keeps the hero portrait sharp on large and retina screens',
    );
  }
  if (facts.status === 'photo') {
    recommended.push(
      'public/images/profile-cutout.png  opaque photo: the hero uses its cropped fallback (a transparent cutout lets the head break the frame)',
    );
  }
}

const mocks = files
  .filter((file) => readFileSync(file, 'utf-8').includes('MOCK_UNTIL_API:'))
  .map((file) => relative(root, file).split(sep).join('/'));

// Parsed textually: mock modules use Vite-style extensionless imports that
// plain Node cannot resolve.
const settingsSource = readFileSync(join(root, 'src/data/mock/settings.js'), 'utf-8');
const visibilityBlock = settingsSource.match(/sections_visibility:\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const hidden = [...visibilityBlock.matchAll(/(\w+):\s*false/g)].map(([, key]) => key);

/*
 * Visible sections still serving samples block publishing: a sample must
 * never go live on a section people can see (it is fine while hidden).
 */
const SAMPLE_SOURCES = {
  projects: 'src/data/mock/projects.js',
  testimonials: 'src/data/mock/testimonials.js',
};
for (const [section, file] of Object.entries(SAMPLE_SOURCES)) {
  if (hidden.includes(section) || !existsSync(join(root, file))) continue;
  const samples = (
    readFileSync(join(root, file), 'utf-8').match(/^\s+is_sample:\s*true,?\s*$/gm) ?? []
  ).length;
  if (samples > 0) {
    required.push(
      `${file}  section "${section}" is visible but serves ${samples} sample record(s) (is_sample: true); ` +
        'replace them with real content from the API, or hide the section',
    );
  }
}

/*
 * The contact form delivers messages only through the live API. A production
 * build still on the mock adapter runs in RELAY mode by default (the form
 * opens WhatsApp or the mail app with the message pre-filled, and says so):
 * usable, so only recommended. With the relay explicitly disabled
 * (VITE_CONTACT_RELAY=false) a "sent" message would reach nobody: blocking.
 * Read from the env files and the current environment (CI/hosting sets it).
 */
const envFiles = ['.env', '.env.production', '.env.production.local', '.env.local'];
/** @param {string} name */
const envValues = (name) =>
  [
    process.env[name],
    ...envFiles
      .map((file) => join(root, file))
      .filter(existsSync)
      .map(
        (file) =>
          readFileSync(file, 'utf-8').match(
            new RegExp(String.raw`^\s*${name}\s*=\s*(\S+)`, 'm'),
          )?.[1],
      ),
  ].filter((value) => value !== undefined);
const isFalse = (/** @type {unknown} */ value) =>
  ['false', '0', 'no', 'off'].includes(String(value).toLowerCase());
const liveApi = envValues('VITE_USE_MOCK').some(isFalse);
const relayOff = envValues('VITE_CONTACT_RELAY').some(isFalse);
if (!liveApi && !hidden.includes('contact')) {
  if (relayOff) {
    required.push(
      'contact form  pure mock: VITE_USE_MOCK is not "false" and VITE_CONTACT_RELAY=false, so a sent ' +
        'message reaches nobody. Connect the Laravel API (POST /contact) or re-enable the relay',
    );
  } else {
    recommended.push(
      'contact form  relay mode: the API is not connected (VITE_USE_MOCK is not "false"), so in production ' +
        'the form opens WhatsApp (or email) with the message pre-filled. Works, but connect POST /contact (phase 7)',
    );
  }
}

/*
 * The "Write a review" form (testimonials) follows the same rule, and the
 * three states are reported apart, because they mean different things:
 *  - API connected (VITE_USE_MOCK=false): POST /testimonials stores the review
 *    as pending for moderation. Nothing to report.
 *  - Relay (default for production on the mock adapter): the review opens in
 *    WhatsApp (or email) pre-filled; the photo is not sent. Recommended only.
 *  - Pure mock (VITE_REVIEW_RELAY=false without the API): a "sent" review
 *    reaches nobody. Blocking.
 */
const reviewRelayOff = envValues('VITE_REVIEW_RELAY').some(isFalse);
/** @type {'api' | 'relay' | 'mock' | 'hidden'} */
const reviewMode = hidden.includes('testimonials')
  ? 'hidden'
  : liveApi
    ? 'api'
    : reviewRelayOff
      ? 'mock'
      : 'relay';
if (reviewMode === 'mock') {
  required.push(
    'review form  pure mock: VITE_USE_MOCK is not "false" and VITE_REVIEW_RELAY=false, so a submitted ' +
      'review reaches nobody. Connect the Laravel API (POST /testimonials) or re-enable the relay',
  );
} else if (reviewMode === 'relay') {
  recommended.push(
    'review form  relay mode: the API is not connected, so in production "Write a review" opens WhatsApp ' +
      '(or email) with the review pre-filled and the photo is NOT sent. Connect POST /testimonials (phase 7)',
  );
}
const contactMode = hidden.includes('contact')
  ? 'hidden'
  : liveApi
    ? 'api'
    : relayOff
      ? 'mock'
      : 'relay';
const MODE_LABEL = {
  api: 'API connected',
  relay: 'relay (WhatsApp/email)',
  mock: 'pure mock (blocking)',
  hidden: 'section hidden',
};

/* -------------------------------------------------------------- report */

const list = (items) => (items.length ? items.map((item) => `  • ${item}`).join('\n') : '  (none)');

console.log(`\n✗ REQUIRED BEFORE PUBLISHING (${required.length})\n${list(required)}`);
console.log(`\n◇ RECOMMENDED, NOT BLOCKING (${recommended.length})\n${list(recommended)}`);
console.log(`\n◌ TEMPORARY MOCK UNTIL THE API (${mocks.length} files)\n${list(mocks)}`);
console.log(`\nℹ Hidden sections (settings.sections_visibility): ${hidden.join(', ') || 'none'}`);
console.log(
  `ℹ Forms in production: contact → ${MODE_LABEL[contactMode]}; reviews → ${MODE_LABEL[reviewMode]}`,
);
console.log(
  required.length
    ? `\n${required.length} item(s) block publishing.`
    : '\nNothing blocks publishing (mock content still needs the API).',
);
process.exit(required.length > 0 ? 1 : 0);
