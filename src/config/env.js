/**
 * Typed-ish access to Vite environment variables.
 *
 * Centralising env reads means components never touch `import.meta.env`
 * directly. The API settings (base URL, live resources, form relays) live in
 * `config/api.js`: only lazy code needs them, so they stay out of the
 * initial bundle.
 *
 * @typedef {Object} AppEnv
 * @property {number}  mockLatency  Simulated network latency (ms) for the mock adapter.
 * @property {string}  siteUrl      Public canonical origin (canonical, hreflang, OG, sitemap).
 * @property {string}  appVersion   Injected at build time from package.json.
 * @property {string}  commit       Short git hash injected at build time.
 * @property {boolean} fx           Client-only visual effects (intro, canvas/WebGL layers,
 *                                  GSAP scenes). Off in tests; content never
 *                                  depends on it.
 */

/**
 * Parses boolean-like env strings. Anything other than "false"/"0" is truthy.
 * @param {string | undefined} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
export function parseBool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return !['false', '0', 'no', 'off'].includes(String(value).toLowerCase());
}

/** @type {AppEnv} */
export const env = Object.freeze({
  // No artificial latency while prerendering: it would only slow the build.
  // Each variable is read by name (never `import.meta.env` as a whole), so
  // Vite inlines just that value instead of the full env object.
  mockLatency: import.meta.env.SSR ? 0 : Number(import.meta.env.VITE_MOCK_LATENCY ?? 350),
  // Canonical URLs must always name the production origin, even in local
  // builds, so the default is the live site rather than localhost.
  siteUrl: (
    import.meta.env.VITE_SITE_URL || 'https://eng-abdulrahman-abu-eisha.vercel.app'
  ).replace(/\/$/, ''),
  appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
  commit: typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'dev',
  fx: parseBool(import.meta.env.VITE_FX, true),
});
