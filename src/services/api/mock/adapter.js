import { AxiosError, CanceledError } from 'axios';

import { env } from '@/config/env';
import { DEFAULT_LOCALE, isSupportedLocale } from '@/config/routes';
import { fail } from './response';
import { matchRoute } from './handlers';

/**
 * Waits `ms`, rejecting early if the request is aborted (e.g. TanStack Query
 * cancelling a stale query on language change).
 * @param {number} ms
 * @param {AbortSignal | undefined} signal
 */
function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new CanceledError());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener?.('abort', () => {
      clearTimeout(timer);
      reject(new CanceledError());
    });
  });
}

/**
 * Axios adapter that serves requests from in-memory mock data.
 *
 * Why an adapter (and not `if (useMock)` in every service): the whole HTTP
 * pipeline (interceptors, envelope unwrapping, error normalisation) runs
 * exactly as it will against Laravel, so going live is a config flip.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config
 * @returns {Promise<import('axios').AxiosResponse>}
 */
export async function mockAdapter(config) {
  const url = new URL(config.url ?? '/', 'http://mock.local');
  const query = { ...Object.fromEntries(url.searchParams), ...(config.params ?? {}) };
  const headerLang =
    config.headers?.get?.('Accept-Language') ?? config.headers?.['Accept-Language'];
  const requested = query.lang ?? headerLang;
  const lang = isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;
  const method = (config.method ?? 'get').toLowerCase();
  const body =
    typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data ?? {});

  const match = matchRoute(method, url.pathname.replace(/^\/api\/v\d+/, '') || '/');
  const result = match
    ? match.handler({ lang, query, body, params: match.params })
    : fail(404, `No mock route for ${method.toUpperCase()} ${url.pathname}`);

  await delay(env.mockLatency, config.signal);

  const response = {
    data: result.body,
    status: result.status,
    statusText: String(result.status),
    headers: { 'content-type': 'application/json' },
    config,
    request: { mocked: true },
  };

  if (result.status >= 200 && result.status < 300) return response;

  throw new AxiosError(
    result.body?.message ?? 'Request failed',
    result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    response.request,
    response,
  );
}
