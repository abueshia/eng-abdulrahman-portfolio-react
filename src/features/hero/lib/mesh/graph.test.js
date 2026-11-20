import { describe, expect, it } from 'vitest';

import { STATIONS } from '@/config/journey';
import { HUBS, buildGraph, hopsFrom } from './graph';

const visible = (/** @type {ReturnType<typeof buildGraph>} */ graph) =>
  graph.nodes.filter((node) => node.kind !== 'ingress');

describe('service mesh graph', () => {
  it('has one hub per journey station, in route order', () => {
    expect(HUBS.map((hub) => hub.id)).toEqual(STATIONS.map((station) => station.id));
    const graph = buildGraph();
    expect(graph.route.map((index) => graph.nodes[index].id)).toEqual(HUBS.map((hub) => hub.id));
  });

  it('honours the node budget of each quality profile', () => {
    for (const budget of [28, 52, 72]) {
      expect(visible(buildGraph({ nodes: budget }))).toHaveLength(budget);
    }
  });

  it('gives every station a cluster even on the smallest budget', () => {
    const graph = buildGraph({ nodes: 28 });
    for (const hub of HUBS) {
      expect(graph.nodes.some((node) => node.kind === 'service' && node.station === hub.id)).toBe(
        true,
      );
    }
  });

  it('is deterministic (stable across resizes and quality changes)', () => {
    expect(buildGraph({ nodes: 52 })).toEqual(buildGraph({ nodes: 52 }));
  });

  it('is fully connected, so cascades (outage, reboot) reach every node', () => {
    const graph = buildGraph();
    const hops = hopsFrom(graph, graph.hubs.gateway);
    expect(hops.every(Number.isFinite)).toBe(true);
    expect(hops[graph.hubs.gateway]).toBe(0);
  });

  it('keeps every node on a valid depth layer', () => {
    for (const node of buildGraph().nodes) {
      expect(node.z).toBeGreaterThan(0);
      expect(node.z).toBeLessThanOrEqual(1);
    }
  });
});
