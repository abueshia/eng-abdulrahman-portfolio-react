import i18n from '@/i18n';
import { DEFAULT_LOCALE } from '@/config/routes';

/** @type {Promise<import('axios').AxiosInstance> | undefined} */
let instance;

/**
 * Creates the axios client on first use (separate chunk). Every request
 * carries the active UI language (`?lang=` + `Accept-Language`) so translated
 * fields come back localised.
 * @returns {Promise<import('axios').AxiosInstance>}
 */
function client() {
  instance ??= import('./axios-client').then(({ createApiClient }) =>
    createApiClient({ getLanguage: () => i18n.resolvedLanguage || DEFAULT_LOCALE }),
  );
  return instance;
}

/** @type {Map<string, Promise<import('axios').AxiosResponse>>} */
const buildCache = new Map();

/**
 * Build-time memo of GET requests. The prerender renders 30+ pages that ask
 * for the same lists (projects, FAQs…); the API allows 120 reads per minute
 * per IP and a Vercel build is one IP, so each distinct request is sent once
 * per build. A failure is not memoised (the next page retries it). Only the
 * server bundle reaches this function (see `http.get`).
 * @param {string} url
 * @param {import('axios').AxiosRequestConfig} [config]
 */
function memoGet(url, config) {
  // The language is part of the key even when only the interceptor sets it.
  const params = { lang: i18n.resolvedLanguage || DEFAULT_LOCALE, ...config?.params };
  const key = `${url}?${JSON.stringify(params)}`;
  let pending = buildCache.get(key);
  if (!pending) {
    pending = client().then((c) => c.get(url, config));
    buildCache.set(key, pending);
    pending.catch(() => buildCache.delete(key));
  }
  return pending;
}

/**
 * App-wide HTTP client: the subset of the axios API the services use.
 * Lazy because prerendered pages hydrate from embedded data, so most first
 * visits never send a request and should not download axios.
 */
export const http = {
  /**
   * `import.meta.env.SSR` is a build-time constant: the browser bundle keeps
   * the direct call only (the memo is tree-shaken away).
   * @param {string} url
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  get: (url, config) =>
    import.meta.env.SSR ? memoGet(url, config) : client().then((c) => c.get(url, config)),
  /**
   * @param {string} url
   * @param {unknown} [data]
   * @param {import('axios').AxiosRequestConfig} [config]
   */
  post: (url, data, config) => client().then((c) => c.post(url, data, config)),
};
