import { describe, expect, it } from 'vitest';

import { STATIONS, isStationAnchor, nextForwardStation, stationForSection } from '@/config/journey';
import { resolveJourney } from './journey-store';

describe('journey stations', () => {
  it('follows the request: gateway → (observability tap) → auth → … → response', () => {
    expect(STATIONS.map((station) => `${station.section}:${station.id}`)).toEqual([
      'hero:gateway',
      'stats:observability',
      'about:auth',
      'skills:services',
      'experience:queue',
      'projects:database',
      'contact:response',
    ]);
  });

  it('puts sections between stations "in transit" on the previous station', () => {
    expect(stationForSection('stats')).toBe('observability');
    expect(stationForSection('services')).toBe('database');
    expect(stationForSection('faq')).toBe('database');
    expect(stationForSection('contact')).toBe('response');
    expect(isStationAnchor('stats')).toBe(true);
    expect(isStationAnchor('services')).toBe(false);
    expect(isStationAnchor('about')).toBe(true);
  });
});

describe('nextForwardStation', () => {
  it('skips the observability tap: the gateway forwards to auth', () => {
    const stops = STATIONS.map(({ id }) => ({ id }));
    expect(nextForwardStation(stops, 'gateway')).toBe('auth');
    expect(nextForwardStation(stops, 'auth')).toBe('services');
    expect(nextForwardStation([{ id: 'gateway' }], 'gateway')).toBeUndefined();
  });
});

describe('resolveJourney', () => {
  const stops = [
    { id: 'gateway', at: 0 },
    { id: 'auth', at: 0.2 },
    { id: 'response', at: 0.9 },
  ];

  it('returns no station on pages without a route', () => {
    expect(resolveJourney([], 0.5)).toEqual({ station: null, next: null, index: 0, local: 0 });
  });

  it('finds the active stop and the progress toward the next one', () => {
    expect(resolveJourney(stops, 0)).toMatchObject({ station: 'gateway', next: 'auth', local: 0 });
    const early = resolveJourney(stops, 0.1);
    expect(early.station).toBe('gateway');
    expect(early.local).toBeCloseTo(0.5);
    const middle = resolveJourney(stops, 0.55);
    expect(middle).toMatchObject({ station: 'auth', next: 'response' });
    expect(middle.local).toBeCloseTo(0.5);
    expect(resolveJourney(stops, 1)).toMatchObject({ station: 'response', next: null, local: 0 });
  });

  it('skips stations whose section is hidden (they are simply not measured)', () => {
    expect(resolveJourney(stops, 0.3).next).toBe('response');
  });
});
