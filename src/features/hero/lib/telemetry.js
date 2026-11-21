/**
 * The hero's "access log" shows facts about THIS visit, measured in the
 * browser (navigation timing, fonts, viewport, language…). Nothing is
 * invented and nothing leaves the browser.
 */

/** Performance mark set by `main.jsx` once the app has hydrated. */
export const HYDRATED_MARK = 'portfolio:hydrated';

/**
 * State entries (language, theme, effects tier). Rendered from live React
 * state on every render, never from a snapshot, so they always match the page.
 * @param {{ locale: string, dir: string, theme: string, tier: string }} state
 * @returns {string[]}
 */
export const stateTelemetry = ({ locale, dir, theme, tier }) => [
  `lang=${locale} dir=${dir}`,
  `theme=${theme}`,
  `fx tier=${tier}`,
];

/** Placeholder measurements, identical on the server and in the first client render. */
export const PENDING_MEASUREMENTS = Object.freeze(['prerendered ✓', 'gateway ready']);

/**
 * Measurements of this visit, taken once after hydration has settled.
 * @returns {string[]}
 */
export function measureTelemetry() {
  const entries = [];
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
  return entries;
}
