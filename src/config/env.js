/**
 * Typed-ish access to Vite environment variables.
 *
 * Centralising env reads means components never touch `import.meta.env`
 * directly, and the mock/live switch lives in exactly one place.
 *
 * @typedef {Object} AppEnv
 * @property {string}  apiUrl       Base URL of the Laravel REST API.
 * @property {boolean} useMock      When true, requests are served by the in-app mock adapter.
 * @property {boolean} contactRelay True when a production build still runs on the mock adapter:
 *                                  the contact form then opens WhatsApp (or email) with the
 *                                  message pre-filled instead of a mock that reaches no one.
 *                                  Override with VITE_CONTACT_RELAY=true|false.
 * @property {boolean} reviewRelay  Same rule for the "Write a review" form: a production build on
 *                                  the mock adapter opens WhatsApp (or email) with the review
 *                                  pre-filled (the photo is not sent). VITE_REVIEW_RELAY=true|false.
 * @property {number}  mockLatency  Simulated network latency (ms) for the mock adapter.
 * @property {string}  siteUrl      Public canonical origin (canonical, hreflang, OG, sitemap).
 * @property {string}  appVersion   Injected at build time from package.json.
 * @property {string}  commit       Short git hash injected at build time.
 * @property {boolean} fx           Client-only visual effects (intro, canvas/WebGL layers,
 *                                  GSAP scenes, custom cursor). Off in tests; content never
 *                                  depends on it.
 */

const raw = import.meta.env;
const useMock = parseBool(raw.VITE_USE_MOCK, true);

/**
 * Parses boolean-like env strings. Anything other than "false"/"0" is truthy,
 * so a missing VITE_USE_MOCK defaults to mock mode (safe for local dev).
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
  apiUrl: raw.VITE_API_URL || 'http://localhost:8000/api/v1',
  useMock,
  contactRelay: useMock && parseBool(raw.VITE_CONTACT_RELAY, Boolean(raw.PROD)),
  reviewRelay: useMock && parseBool(raw.VITE_REVIEW_RELAY, Boolean(raw.PROD)),
  // No artificial latency while prerendering: it would only slow the build.
  mockLatency: raw.SSR ? 0 : Number(raw.VITE_MOCK_LATENCY ?? 350),
  // Canonical URLs must always name the production origin, even in local
  // builds, so the default is the live site rather than localhost.
  siteUrl: (raw.VITE_SITE_URL || 'https://eng-abdulrahman-abu-eisha.vercel.app').replace(/\/$/, ''),
  appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
  commit: typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'dev',
  fx: parseBool(raw.VITE_FX, true),
});
