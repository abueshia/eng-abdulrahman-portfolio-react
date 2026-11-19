/**
 * Lists every value still waiting for the owner's real data
 * (`TODO_REAL_DATA` markers) plus required files that are missing.
 * Exit code 1 when anything is outstanding, so it can gate a release.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const MARKER = 'TODO_REAL_DATA';
const SCAN = ['src/data', 'src/i18n', 'index.html'];
const REQUIRED_FILES = [
  'public/cv/abdulrahman-abu-eisha-cv.pdf',
  'public/images/og-cover.jpg',
  'public/images/profile-cutout.png',
];

/** @param {string} path @returns {string[]} */
const walk = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path).flatMap((name) => walk(join(path, name)))
    : [path];

const hits = SCAN.map((p) => join(root, p))
  .filter(existsSync)
  .flatMap(walk)
  .filter((file) => !/\.test\./.test(file))
  .flatMap((file) =>
    readFileSync(file, 'utf-8')
      .split('\n')
      .map((line, i) => ({ file: relative(root, file), line: i + 1, text: line.trim() }))
      .filter(
        ({ text }) => text.includes(MARKER) && !text.startsWith('export const TODO_REAL_DATA'),
      ),
  );

const missing = REQUIRED_FILES.filter((file) => !existsSync(join(root, file)));

for (const { file, line, text } of hits) console.log(`${file}:${line}  ${text}`);
for (const file of missing) console.log(`missing file  ${file}`);
console.log(`\n${hits.length} placeholder(s), ${missing.length} missing file(s).`);
process.exit(hits.length + missing.length > 0 ? 1 : 0);
