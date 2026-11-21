import { describe, expect, it } from 'vitest';

import { encodeProficiency, layoutConstellation, swipeTarget } from './constellation';

const groups = [
  {
    category: 'backend',
    name: 'Backend',
    technologies: [
      { slug: 'php', name: 'PHP', proficiency: 95 },
      { slug: 'pest', name: 'Pest', proficiency: 60 },
    ],
  },
  { category: 'frontend', name: 'Frontend', technologies: [{ slug: 'react', name: 'React' }] },
];

describe('tech constellation', () => {
  it('puts one orbit per category, inner first, every node on its orbit', () => {
    const orbits = layoutConstellation(groups);
    expect(orbits.map((o) => o.category)).toEqual(['backend', 'frontend']);
    expect(orbits[1].r).toBeGreaterThan(orbits[0].r);
    for (const orbit of orbits) {
      for (const node of orbit.nodes) {
        expect(Math.hypot(node.x, node.y)).toBeCloseTo(orbit.r, 0);
      }
    }
  });

  it('encodes proficiency as size and brightness', () => {
    const strong = encodeProficiency(95);
    const modest = encodeProficiency(60);
    expect(strong.size).toBeGreaterThan(modest.size);
    expect(strong.glow).toBeGreaterThan(modest.glow);
    expect(encodeProficiency(undefined)).toEqual(encodeProficiency(0));
  });

  it('is deterministic (prerendered markup equals the client render)', () => {
    expect(layoutConstellation(groups)).toEqual(layoutConstellation(groups));
  });

  it('turns horizontal swipes into tab changes, mirrored in RTL', () => {
    expect(swipeTarget({ dx: -80, dy: 4, index: 0, count: 3, rtl: false })).toBe(1);
    expect(swipeTarget({ dx: 80, dy: 4, index: 0, count: 3, rtl: true })).toBe(1);
    expect(swipeTarget({ dx: 80, dy: 4, index: 0, count: 3, rtl: false })).toBeNull();
    // Mostly vertical: that's a scroll, not a swipe.
    expect(swipeTarget({ dx: -60, dy: 70, index: 0, count: 3, rtl: false })).toBeNull();
  });
});
