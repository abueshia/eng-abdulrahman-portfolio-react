import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { getStation } from '@/config/journey';
import { journeyStore, useJourneyStops, useStation } from '@/features/journey/journey-store';
import { cn } from '@/utils/cn';

/**
 * Route trace: scroll progress drawn as the request's route.
 *
 * Every journey station is a stop at its REAL position in the document
 * (measured, so hidden sections simply vanish from the route). The Ember
 * packet rides the trace with the scroll; at the Response station the
 * request has become the response and the trace turns Ion.
 *
 * Desktop: a vertical rail in the inline-end gutter with stop labels (all
 * visible on hover). Phones and tablets: a hairline across the top with the
 * active stop as a chip. Pages without stations (case studies) show plain
 * reading progress.
 *
 * Scroll updates write one CSS variable (`--progress`); React only renders
 * when the active station changes. Decorative: `aria-hidden`.
 */
export default function RouteTrace() {
  const { t } = useTranslation();
  const stops = useJourneyStops();
  const station = useStation();
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const clockRef = useRef(/** @type {HTMLSpanElement | null} */ (null));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const write = () =>
      root.style.setProperty('--progress', journeyStore.get().progress.toFixed(4));
    write();
    return journeyStore.subscribe(write);
  }, []);

  // Session clock: how long this request has been in flight.
  useEffect(() => {
    const started = performance.now();
    const tick = () => {
      if (!clockRef.current) return;
      const s = Math.floor((performance.now() - started) / 1000);
      clockRef.current.textContent = `t+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeIndex = stops.findIndex((stop) => stop.id === station);
  const active = getStation(station);

  return (
    <div
      ref={rootRef}
      className="trace"
      aria-hidden="true"
      data-mode={stops.length > 0 ? 'journey' : 'page'}
      data-response={station === 'response' ? 'true' : 'false'}
    >
      <div className="trace__rail">
        <div className="trace__fill" />
        {stops.map((stop, i) => {
          const meta = getStation(stop.id);
          return (
            <div
              key={stop.id}
              className={cn(
                'trace__stop',
                i === activeIndex && 'is-active',
                i < activeIndex && 'is-passed',
              )}
              style={{ '--at': stop.at }}
            >
              <span className="trace__tick" />
              <span className="trace__label">
                <b>{meta?.code}</b> {t(`journey.stations.${stop.id}`)}
              </span>
            </div>
          );
        })}
        <div className="trace__packet">
          <span className="trace__core" />
        </div>
      </div>

      {active && (
        <p className="trace__chip">
          <b>{active.code}</b> {t(`journey.stations.${active.id}`)}
          {station === 'response' && <span className="trace__status">201</span>}
        </p>
      )}
      <span ref={clockRef} className="trace__clock" dir="ltr" />
    </div>
  );
}
