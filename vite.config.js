import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const root = fileURLToPath(new URL('.', import.meta.url));

/** Short commit hash for the footer build signature; "dev" outside git. */
function gitCommit() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

/**
 * Runs the image pipeline (scripts/images.js) on dev start and on every
 * client build, and again whenever the source portrait changes during
 * `npm run dev`. Replacing public/images/profile-cutout.png is therefore the
 * whole workflow. Cached by content hash, so it is a no-op when nothing
 * changed. If `sharp` is unavailable the committed outputs are used.
 * @returns {import('vite').Plugin}
 */
function imagePipeline() {
  const run = async (/** @type {boolean} */ verbose) => {
    try {
      const { generateImages } = await import('./scripts/images.js');
      await generateImages({ root, log: verbose ? console.log : () => {} });
    } catch (error) {
      console.warn(`⚠ image pipeline skipped: ${error instanceof Error ? error.message : error}`);
    }
  };
  return {
    name: 'portfolio:image-pipeline',
    async buildStart() {
      if (process.env.VITEST || this.environment?.config?.consumer === 'server') return;
      await run(true);
    },
    configureServer(server) {
      const source = resolve(root, 'public/images/profile-cutout.png');
      server.watcher.add(source);
      server.watcher.on('all', async (_event, file) => {
        if (resolve(file) !== source) return;
        await run(true);
        server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss(), imagePipeline()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify(gitCommit()),
  },
  build: isSsrBuild
    ? // The server bundle (prerendering only) needs no public assets.
      { copyPublicDir: false }
    : // The manifest lets the prerenderer preload each page's chunk; it is
      // removed from dist/ after prerendering.
      { manifest: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    env: { VITE_USE_MOCK: 'true', VITE_MOCK_LATENCY: '0', VITE_FX: 'off' },
    include: ['src/**/*.test.{js,jsx}', 'scripts/**/*.test.js'],
    // Prerender, hydration and form tests render whole pages: 5 s is too
    // tight for them.
    testTimeout: 20_000,
  },
}));
