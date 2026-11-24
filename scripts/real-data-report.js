/**
 * Real-data report (`npm run data:todo`).
 *
 * Two very different kinds of "not real yet":
 *
 *  1. REQUIRED BEFORE PUBLISHING: values marked `TODO_REAL_DATA` and required
 *     public files that are missing or invalid (wrong format/dimensions).
 *     These fail the command (exit 1) and must be zero before going live.
 *
 *  2. TEMPORARY MOCK UNTIL THE API: whole mock files marked `MOCK_UNTIL_API`
 *     (resources the Laravel API does not serve yet). Expected; never fatal.
 *     A visible section whose resource is neither live (VITE_API_RESOURCES)
 *     nor mocked has no data at all: that one is REQUIRED.
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
 * Env values from the current environment (CI/hosting sets them) and the
 * env files, in that order.
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
            new RegExp(String.raw`^\s*${name}\s*=\s*(\S*)`, 'm'),
          )?.[1],
      ),
  ].filter((value) => value !== undefined);
const isFalse = (/** @type {unknown} */ value) =>
  ['false', '0', 'no', 'off'].includes(String(value).toLowerCase());

/*
 * Live API resources (VITE_API_RESOURCES, same parsing as src/config/api.js):
 * unset means all five; anything listed is fetched from VITE_API_URL at
 * build time and in the browser.
 */
const API_RESOURCES = ['projects', 'experiences', 'testimonials', 'faqs', 'contact'];
const resourcesValue = envValues('VITE_API_RESOURCES')[0];
const live =
  resourcesValue === undefined
    ? API_RESOURCES
    : API_RESOURCES.filter((name) =>
        resourcesValue
          .split(',')
          .map((part) => part.trim().toLowerCase())
          .includes(name),
      );
const apiUrl =
  envValues('VITE_API_URL')[0] ?? 'https://eng-abdelrahman.dr-krok.com/api/v1 (default)';

/*
 * Projects, experiences, testimonials and FAQs have no mock data any more:
 * a visible section whose resource is not live has nothing to show (and the
 * build would prerender it empty). Blocking.
 */
const SECTION_OF = {
  projects: 'projects',
  experiences: 'experience',
  testimonials: 'testimonials',
  faqs: 'faq',
};
for (const [resource, section] of Object.entries(SECTION_OF)) {
  if (hidden.includes(section) || live.includes(resource)) continue;
  required.push(
    `VITE_API_RESOURCES  section "${section}" is visible but "${resource}" is not a live resource, ` +
      'and it has no mock data: add it to VITE_API_RESOURCES or hide the section',
  );
}
if (live.length > 0 && /localhost|127\.0\.0\.1|^http:/.test(apiUrl)) {
  recommended.push(
    `VITE_API_URL  "${apiUrl}" is not a public https origin: production builds must use the live API`,
  );
}

/*
 * The forms deliver only through the live API. When a form's resource is
 * not live, production runs in RELAY mode by default (WhatsApp or the mail
 * app, pre-filled, and the form says so): usable, so only recommended. With
 * the relay disabled a "sent" message would reach nobody: blocking.
 */
const relayOff = envValues('VITE_CONTACT_RELAY').some(isFalse);
const reviewRelayOff = envValues('VITE_REVIEW_RELAY').some(isFalse);
/**
 * @param {string} section
 * @param {string} resource
 * @param {boolean} off
 * @returns {'api' | 'relay' | 'mock' | 'hidden'}
 */
const formMode = (section, resource, off) =>
  hidden.includes(section) ? 'hidden' : live.includes(resource) ? 'api' : off ? 'mock' : 'relay';
const contactMode = formMode('contact', 'contact', relayOff);
const reviewMode = formMode('testimonials', 'testimonials', reviewRelayOff);
if (contactMode === 'mock') {
  required.push(
    'contact form  pure mock: "contact" is not in VITE_API_RESOURCES and VITE_CONTACT_RELAY=false, ' +
      'so a sent message reaches nobody. Add "contact" to VITE_API_RESOURCES or re-enable the relay',
  );
} else if (contactMode === 'relay') {
  recommended.push(
    'contact form  relay mode: "contact" is not a live resource, so in production the form opens ' +
      'WhatsApp (or email) pre-filled. Add "contact" to VITE_API_RESOURCES',
  );
}
if (reviewMode === 'mock') {
  required.push(
    'review form  pure mock: "testimonials" is not in VITE_API_RESOURCES and VITE_REVIEW_RELAY=false, ' +
      'so a submitted review reaches nobody. Add "testimonials" to VITE_API_RESOURCES or re-enable the relay',
  );
} else if (reviewMode === 'relay') {
  recommended.push(
    'review form  relay mode: "testimonials" is not a live resource, so in production "Write a review" ' +
      'opens WhatsApp (or email) pre-filled and the photo is NOT sent. Add "testimonials" to VITE_API_RESOURCES',
  );
}
const MODE_LABEL = {
  api: 'live API',
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
console.log(`ℹ Live API resources: ${live.join(', ') || 'none'} · API: ${apiUrl}`);
console.log(
  `ℹ Forms in production: contact → ${MODE_LABEL[contactMode]}; reviews → ${MODE_LABEL[reviewMode]}`,
);
console.log(
  required.length
    ? `\n${required.length} item(s) block publishing.`
    : '\nNothing blocks publishing (mock content still needs the API).',
);
process.exit(required.length > 0 ? 1 : 0);
