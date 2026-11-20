/**
 * The hero's "access log" shows facts about THIS visit, measured in the
 * browser (navigation timing, fonts, viewport, language…). Nothing is
 * invented and nothing leaves the browser.
 */

/** Performance mark set by `main.jsx` once the app has hydrated. */
export const HYDRATED_MARK = 'portfolio:hydrated';

/**
 * Entries known before any browser API runs: identical in the prerendered
 * HTML and the first client render (no hydration mismatch).
 * @param {{ path: string, locale: string, dir: string }} context
 * @returns {string[]}
 */
export const staticTelemetry = ({ path, locale, dir }) => [
  `GET ${path} 200`,
  `lang=${locale} dir=${dir}`,
  'prerendered ✓',
  'gateway ready',
];

/**
 * Live entries, measured after hydration.
 * @param {{ locale: string, dir: string, theme: string, tier: string }} context
 * @returns {string[]}
 */
export function collectTelemetry({ locale, dir, theme, tier }) {
  const entries = [`GET ${window.location.pathname} 200`];
  const nav = /** @type {PerformanceNavigationTiming | undefined} */ (
    performance.getEntriesByType?.('navigation')?.[0]
  );
  if (nav && nav.responseStart > 0) {
    entries.push(`ttfb ${Math.max(1, Math.round(nav.responseStart - nav.requestStart))}ms`);
    if (nav.domContentLoadedEventEnd > 0) {
      entries.push(`dom ready ${Math.round(nav.domContentLoadedEventEnd)}ms`);
    }
  }
  const hydrated = performance.getEntriesByName?.(HYDRATED_MARK)?.[0];
  if (hydrated) entries.push(`hydrated ${Math.round(hydrated.startTime)}ms`);
  if (document.fonts) {
    const loaded = [...document.fonts].filter((face) => face.status === 'loaded').length;
    entries.push(`fonts ${loaded} loaded`);
  }
  entries.push(`lang=${locale} dir=${dir}`, `theme=${theme}`);
  entries.push(
    `viewport ${window.innerWidth}×${window.innerHeight} @${Number(window.devicePixelRatio.toFixed(2))}x`,
  );
  try {
    entries.push(`tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  } catch {
    /* Intl unavailable: skip */
  }
  const connection = /** @type {any} */ (navigator).connection?.effectiveType;
  if (connection) entries.push(`net ${connection}`);
  entries.push(`fx tier=${tier}`);
  return entries;
}
