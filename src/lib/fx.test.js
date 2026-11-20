import { describe, expect, it } from 'vitest';

import { BOOT_TASKS, bootProgress, readinessOf } from '@/features/intro/boot-store';
import { resolvePortrait } from '@/features/hero/lib/portrait';
import { classifyDevice } from './device';

describe('device tier', () => {
  it('drops to low on data saver, 2G or very weak hardware', () => {
    expect(classifyDevice({ saveData: true, cores: 16, memory: 16, pointerFine: true })).toBe(
      'low',
    );
    expect(classifyDevice({ effectiveType: '2g' })).toBe('low');
    expect(classifyDevice({ cores: 2 })).toBe('low');
    expect(classifyDevice({ memory: 2 })).toBe('low');
  });

  it('reserves high for capable desktops with a precise pointer', () => {
    expect(classifyDevice({ cores: 8, memory: 8, pointerFine: true, width: 1440 })).toBe('high');
    expect(classifyDevice({ cores: 8, memory: 8, pointerFine: false, width: 1440 })).toBe('mid');
    expect(classifyDevice({ cores: 8, memory: 8, pointerFine: true, width: 800 })).toBe('mid');
  });

  it('treats missing signals as neutral (Safari exposes neither memory nor connection)', () => {
    expect(classifyDevice({ pointerFine: true, width: 1440 })).toBe('high');
    expect(classifyDevice({})).toBe('mid');
  });
});

describe('boot intro progress', () => {
  it('weights real readiness tasks to exactly 1', () => {
    const all = Object.fromEntries(Object.keys(BOOT_TASKS).map((task) => [task, 1]));
    expect(readinessOf(all)).toBe(1);
    expect(readinessOf({})).toBe(0);
    expect(readinessOf({ fonts: 1 })).toBe(BOOT_TASKS.fonts);
  });

  it('never runs ahead of readiness nor of the minimum duration', () => {
    expect(bootProgress({ elapsed: 500, readiness: 1, min: 2500, max: 4000 })).toBeCloseTo(0.2);
    expect(bootProgress({ elapsed: 3000, readiness: 0.4, min: 2500, max: 4000 })).toBe(0.4);
    expect(bootProgress({ elapsed: 3000, readiness: 1, min: 2500, max: 4000 })).toBe(1);
  });

  it('completes at the maximum duration even if something is still loading', () => {
    expect(bootProgress({ elapsed: 4000, readiness: 0.3, min: 2500, max: 4000 })).toBe(1);
  });
});

describe('portrait staging', () => {
  const urls = {
    '/src/assets/portrait/portrait-360.webp': '/assets/p-360.webp',
    '/src/assets/portrait/portrait-360.avif': '/assets/p-360.avif',
  };
  const base = {
    widths: [360],
    width: 360,
    height: 810,
    head: { x: 0.34, chin: 0.23 },
    version: 1,
  };

  it('stages a transparent cutout with responsive sources', () => {
    const portrait = resolvePortrait(
      /** @type {any} */ ({ ...base, status: 'cutout', source: { figureHeight: 1200 } }),
      urls,
    );
    expect(portrait).toMatchObject({
      status: 'cutout',
      avif: '/assets/p-360.avif 360w',
      src: '/assets/p-360.webp',
      lowRes: false,
    });
  });

  it('flags a source too small for crisp rendering', () => {
    const portrait = resolvePortrait(
      /** @type {any} */ ({ ...base, status: 'cutout', source: { figureHeight: 408 } }),
      urls,
    );
    expect(portrait.lowRes).toBe(true);
  });

  it('falls back to the monogram when the file is missing', () => {
    expect(resolvePortrait(/** @type {any} */ ({ status: 'missing', version: 1 }), {}).status).toBe(
      'missing',
    );
  });
});
