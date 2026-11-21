import { describe, expect, it } from 'vitest';

import { REEL_ROWS, digitsOf, hasData, reelOffset, sparkPaths, stepSeries } from './metrics';

describe('observability metrics', () => {
  it('treats zero or missing values as "No data", never as a real reading', () => {
    expect(hasData({ key: 'experience', value: 4, label: 'Years' })).toBe(true);
    expect(hasData({ key: 'projects', value: 0, label: 'Projects' })).toBe(false);
    expect(hasData(undefined)).toBe(false);
    expect(hasData({ key: 'x', value: Number.NaN, label: 'x' })).toBe(false);
  });

  it('splits a value into odometer digits', () => {
    expect(digitsOf(4)).toEqual([4]);
    expect(digitsOf(120)).toEqual([1, 2, 0]);
    expect(digitsOf(-3)).toEqual([0]);
  });

  it('lands every reel on its digit after one full turn', () => {
    expect(reelOffset(0)).toBe(-(10 / REEL_ROWS) * 100);
    expect(reelOffset(9)).toBe(-(19 / REEL_ROWS) * 100);
  });

  it('plots one step per unit, capped for large counts', () => {
    expect(stepSeries(4)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(stepSeries(250)).toHaveLength(13);
    expect(stepSeries(0.4)).toEqual([0, 1]);
  });

  it('draws a stepped line with data and a flat baseline without', () => {
    const withData = sparkPaths([0, 0.5, 1], { width: 100, height: 20, pad: 0 });
    expect(withData.line).toBe('M0 20 H50 V10 H100 V0');
    expect(withData.area).toBe('M0 20 H50 V10 H100 V0 V20 H0 Z');

    const empty = sparkPaths(null, { width: 100, height: 20, pad: 2 });
    expect(empty).toEqual({ line: 'M0 18 H100', area: null });
  });
});
