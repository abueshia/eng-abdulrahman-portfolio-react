/**
 * Bundle report (`npm run size`), run after `npm run build`.
 *
 * Measures what a first visit to the home page actually downloads before the
 * page is interactive, gzip-compressed (what the network transfers):
 *
 *  - initial:   the entry script + every <link rel="modulepreload"> in
 *               dist/index.html (parsed by the browser up front).
 *  - home:      initial + the home page chunk and its static imports, i.e.
 *               everything hydration of `/` needs.
 *  - deferred:  every other chunk (loaded on idle, on interaction or by route).
 *
 * Static imports are resolved by reading each chunk's `import … from "./x.js"`
 * statements, so the numbers follow the real module graph, not file names.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
const assets = join(dist, 'assets');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('dist/index.html not found: run `npm run build` first.');
  process.exit(1);
}

const html = readFileSync(join(dist, 'index.html'), 'utf-8');
const jsFiles = readdirSync(assets).filter((file) => file.endsWith('.js'));

/** @param {string} file */
const gz = (file) => gzipSync(readFileSync(join(assets, file))).length;

/**
 * Static (non-dynamic) relative imports of a chunk.
 * @param {string} file
 * @returns {string[]}
 */
function staticImports(file) {
  const code = readFileSync(join(assets, file), 'utf-8');
  const found = new Set();
  // `import{a}from"./x.js"`, `import"./x.js"`, `export{a}from"./x.js"`; never `import(`.
  const pattern =
    /(?:^|[;}\s])(?:import|export)\s*(?:[^'"();]*?\bfrom\s*)?["']\.\/([^"']+\.js)["']/g;
  for (const [, name] of code.matchAll(pattern)) found.add(name);
  return [...found];
}

/**
 * @param {string[]} entries
 * @returns {Set<string>} Entries plus their transitive static imports.
 */
function closure(entries) {
  const seen = new Set();
  const stack = [...entries];
  while (stack.length) {
    const file = /** @type {string} */ (stack.pop());
    if (seen.has(file) || !jsFiles.includes(file)) continue;
    seen.add(file);
    stack.push(...staticImports(file));
  }
  return seen;
}

const fromHtml = [
  ...html.matchAll(/<script[^>]+type="module"[^>]+src="\/assets\/([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/assets\/([^"]+\.js)"/g),
].map(([, file]) => file);

const initial = closure(fromHtml);
const homeChunk = jsFiles.find((file) => /^HomePage-/.test(file));
const home = closure([...initial, ...(homeChunk ? [homeChunk] : [])]);
const deferred = jsFiles.filter((file) => !home.has(file));

/** @param {Iterable<string>} files */
const total = (files) => [...files].reduce((sum, file) => sum + gz(file), 0);
const kb = (/** @type {number} */ bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\/assets\/([^"]+\.css)"/g)]
  .map(([, file]) => file)
  .reduce((sum, file) => sum + gz(file), 0);

const rows = [...home]
  .map((file) => ({ file, size: gz(file), initial: initial.has(file) }))
  .sort((a, b) => b.size - a.size);

console.log('\nHome page JavaScript (gzip)');
for (const { file, size, initial: isInitial } of rows) {
  console.log(`  ${kb(size).padStart(9)}  ${isInitial ? 'initial' : 'home   '}  ${file}`);
}
console.log(`\n  initial JS (entry + modulepreload): ${kb(total(initial))}`);
console.log(`  home JS (initial + page chunk):     ${kb(total(home))}`);
console.log(`  initial CSS:                        ${kb(css)}`);
console.log(`  deferred JS (${deferred.length} chunks, on idle/route): ${kb(total(deferred))}`);
