import { describe, expect, it } from 'vitest';

import { NODE_W, focusedEdges, layoutArchitecture } from './architecture';

const ARCH = {
  nodes: [
    { id: 'db', label: 'MySQL', layer: 'data' },
    { id: 'spa', label: 'SPA', layer: 'client' },
    { id: 'api', label: 'API', layer: 'edge' },
    { id: 'jobs', label: 'Jobs', layer: 'worker' },
    { id: 'billing', label: 'Billing', layer: 'app' },
    { id: 'subs', label: 'Subscriptions', layer: 'app' },
  ],
  edges: [
    { from: 'spa', to: 'api', kind: 'sync' },
    { from: 'api', to: 'billing' },
    { from: 'billing', to: 'subs', kind: 'sync' },
    { from: 'jobs', to: 'subs', kind: 'async' },
    { from: 'billing', to: 'ghost' },
  ],
};

describe('layoutArchitecture', () => {
  it('stacks layers top to bottom in request order, whatever the data order', () => {
    const layout = layoutArchitecture(ARCH);
    expect(layout.rows.map((row) => row.layer)).toEqual([
      'client',
      'edge',
      'app',
      'worker',
      'data',
    ]);
    const rowOf = (/** @type {string} */ id) => layout.nodes.find((n) => n.id === id)?.row;
    expect(rowOf('spa')).toBe(0);
    expect(rowOf('db')).toBe(4);
  });

  it('sizes the canvas to the widest layer and keeps nodes inside it', () => {
    const layout = layoutArchitecture(ARCH);
    for (const node of layout.nodes) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x + node.w).toBeLessThanOrEqual(layout.width);
      expect(node.y + node.h).toBeLessThanOrEqual(layout.height);
    }
    expect(layout.width).toBeGreaterThan(2 * NODE_W);
  });

  it('routes edges by direction and drops edges to unknown nodes', () => {
    const layout = layoutArchitecture(ARCH);
    const edge = (/** @type {string} */ id) => layout.edges.find((e) => e.id === id);
    expect(layout.edges).toHaveLength(4);
    expect(edge('spa->api')?.d).toMatch(/^M[\d.]+ [\d.]+ C/); // down: a curve
    expect(edge('billing->subs')?.d).toMatch(/ L/); // same layer: side to side
    expect(edge('jobs->subs')?.kind).toBe('async'); // up: still drawn
    expect(edge('api->billing')?.kind).toBe('sync'); // default kind
  });

  it('mirrors x in RTL without changing the rows', () => {
    const ltr = layoutArchitecture(ARCH);
    const rtl = layoutArchitecture(ARCH, { dir: 'rtl' });
    const billing = (/** @type {typeof ltr} */ l) => l.nodes.find((n) => n.id === 'billing');
    expect(billing(rtl)?.x).toBeCloseTo(ltr.width - (billing(ltr)?.x ?? 0) - NODE_W, 1);
    expect(billing(rtl)?.y).toBe(billing(ltr)?.y);
    expect(rtl.rows[0].x).toBeGreaterThan(ltr.rows[0].x);
  });

  it('is deterministic and survives empty input', () => {
    expect(layoutArchitecture(ARCH)).toEqual(layoutArchitecture(ARCH));
    expect(layoutArchitecture(null).nodes).toEqual([]);
  });
});

describe('focusedEdges', () => {
  it('lights only edges whose both ends a decision is about', () => {
    const { edges } = layoutArchitecture(ARCH);
    expect([...focusedEdges(edges, ['billing', 'subs', 'jobs'])].sort()).toEqual([
      'billing->subs',
      'jobs->subs',
    ]);
    expect(focusedEdges(edges, []).size).toBe(0);
  });
});
