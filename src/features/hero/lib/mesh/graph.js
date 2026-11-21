/**
 * The service mesh: a deterministic graph of the system the visitor's request
 * travels through. One hub per journey station (see config/journey.js), each
 * with named services, plus anonymous pods (replicas) on three depth layers.
 *
 * World units: 1 = one viewport height. Stations are stacked downwards and
 * meander left/right, so moving the camera from hub to hub reads like
 * travelling deeper into the system. The renderer mirrors x in RTL.
 *
 * Pure and seeded: the same input always yields the same graph (testable, and
 * stable across resizes and quality changes).
 */

/**
 * @typedef {Object} Hub
 * @property {string} id        Matches a journey station id.
 * @property {number} x
 * @property {number} y
 * @property {number} z         Depth 0–1 (1 = nearest).
 * @property {string[]} services
 */

/** @type {ReadonlyArray<Hub>} */
export const HUBS = Object.freeze([
  { id: 'gateway', x: 0, y: 0, z: 1, services: ['edge', 'cdn', 'waf', 'rate-limit', 'tls'] },
  // A sidecar off the main axis: monitoring taps the request, it doesn't route it.
  {
    id: 'observability',
    x: -1.05,
    y: 0.52,
    z: 0.62,
    services: ['metrics', 'traces', 'logs', 'alerts'],
  },
  {
    id: 'auth',
    x: 0.9,
    y: 1.05,
    z: 0.86,
    services: ['sanctum', 'tokens', 'sessions', 'rbac', 'oauth'],
  },
  {
    id: 'services',
    x: -0.8,
    y: 2.15,
    z: 0.8,
    services: ['orders', 'billing', 'search', 'notify', 'mail', 'media'],
  },
  {
    id: 'queue',
    x: 0.85,
    y: 3.25,
    z: 0.76,
    services: ['horizon', 'jobs', 'workers', 'scheduler', 'events'],
  },
  {
    id: 'database',
    x: -0.55,
    y: 4.35,
    z: 0.7,
    services: ['mysql', 'redis', 'replica', 'cache', 'storage'],
  },
  {
    id: 'endpoints',
    x: 0.95,
    y: 5.45,
    z: 0.84,
    services: ['routes', 'webhooks', 'openapi', 'payments', 'throttle'],
  },
  { id: 'review', x: -0.75, y: 6.55, z: 0.78, services: ['approvals', 'checks', 'ci', 'diff'] },
  { id: 'man', x: 0.8, y: 7.65, z: 0.7, services: ['manpage', 'help', 'usage'] },
  {
    id: 'request',
    x: -0.6,
    y: 8.75,
    z: 0.9,
    services: ['form', 'validate', 'honeypot', 'throttle'],
  },
  { id: 'response', x: 0, y: 9.85, z: 1, services: ['json', 'client', 'cdn', 'browser'] },
]);

/** The three depth layers pods are scattered on. */
export const DEPTH_LAYERS = Object.freeze([0.42, 0.7, 1]);

/**
 * @typedef {'hub' | 'service' | 'pod' | 'ingress'} NodeKind
 * @typedef {Object} MeshNode
 * @property {string} id
 * @property {string | null} label
 * @property {NodeKind} kind
 * @property {string} station
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} phase   Random phase for idle breathing.
 *
 * @typedef {{ a: number, b: number, kind: 'route' | 'link' | 'pod' | 'ingress' }} MeshEdge
 *
 * @typedef {Object} MeshGraph
 * @property {MeshNode[]} nodes
 * @property {MeshEdge[]} edges
 * @property {Record<string, number>} hubs  Station id → node index.
 * @property {number[]} route               Hub node indices in journey order.
 */

/** Small, fast, seedable PRNG. @param {number} seed */
export function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (/** @type {number} */ v, /** @type {number} */ lo, /** @type {number} */ hi) =>
  Math.min(hi, Math.max(lo, v));

/**
 * Builds the mesh with `nodes` visible nodes (hubs + services + pods).
 * Services are added round-robin across stations, so a small budget still
 * gives every station a cluster; pods only appear on larger budgets.
 * @param {{ nodes?: number, seed?: number }} [options]
 * @returns {MeshGraph}
 */
export function buildGraph({ nodes: target = 72, seed = 11 } = {}) {
  const random = mulberry32(seed);
  /** @type {MeshNode[]} */
  const nodes = [];
  /** @type {MeshEdge[]} */
  const edges = [];
  /** @type {Record<string, number>} */
  const hubs = {};
  /** @type {Record<string, number[]>} */
  const servicesByHub = {};
  const add = (/** @type {MeshNode} */ node) => nodes.push(node) - 1;

  for (const hub of HUBS) {
    hubs[hub.id] = add({
      id: hub.id,
      label: hub.id.toUpperCase(),
      kind: 'hub',
      station: hub.id,
      x: hub.x,
      y: hub.y,
      z: hub.z,
      phase: random() * Math.PI * 2,
    });
  }
  for (let i = 0; i < HUBS.length - 1; i += 1) {
    edges.push({ a: hubs[HUBS[i].id], b: hubs[HUBS[i + 1].id], kind: 'route' });
  }

  // Services, round-robin so every station gets its share of the budget.
  let budget = Math.max(0, target - HUBS.length);
  /** @type {Array<[Hub, string, number]>} */
  const slots = [];
  const longest = Math.max(...HUBS.map((hub) => hub.services.length));
  for (let k = 0; k < longest; k += 1) {
    for (const hub of HUBS) if (hub.services[k]) slots.push([hub, hub.services[k], k]);
  }
  for (const [hub, name, k] of slots.slice(0, budget)) {
    const angle = (k / hub.services.length) * Math.PI * 2 + hub.y * 1.7 + (random() - 0.5) * 0.6;
    const radius = 0.3 + random() * 0.26;
    const index = add({
      id: `${hub.id}:${name}`,
      label: name,
      kind: 'service',
      station: hub.id,
      x: hub.x + Math.cos(angle) * radius * 1.4,
      y: hub.y + Math.sin(angle) * radius,
      z: clamp(hub.z * (0.74 + random() * 0.4), 0.38, 1),
      phase: random() * Math.PI * 2,
    });
    edges.push({ a: hubs[hub.id], b: index, kind: 'link' });
    (servicesByHub[hub.id] ??= []).push(index);
  }
  budget -= Math.min(budget, slots.length);

  // Pods: anonymous replicas around services, spread over the depth layers.
  const services = Object.values(servicesByHub).flat();
  for (let p = 0; p < budget && services.length > 0; p += 1) {
    const parentIndex = services[Math.floor(random() * services.length)];
    const parent = nodes[parentIndex];
    const angle = random() * Math.PI * 2;
    const radius = 0.07 + random() * 0.17;
    const index = add({
      id: `${parent.id}#${p}`,
      label: null,
      kind: 'pod',
      station: parent.station,
      x: parent.x + Math.cos(angle) * radius * 1.4,
      y: parent.y + Math.sin(angle) * radius,
      z: DEPTH_LAYERS[Math.floor(random() * DEPTH_LAYERS.length)],
      phase: random() * Math.PI * 2,
    });
    edges.push({ a: parentIndex, b: index, kind: 'pod' });
  }

  // Cross links between neighbouring stations: a mesh, not a tree.
  for (let i = 0; i < HUBS.length - 1; i += 1) {
    const from = servicesByHub[HUBS[i].id] ?? [];
    const to = servicesByHub[HUBS[i + 1].id] ?? [];
    for (const a of from) {
      if (to.length === 0 || random() > 0.35) continue;
      let best = to[0];
      let bestDistance = Infinity;
      for (const b of to) {
        const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
        if (d < bestDistance) {
          bestDistance = d;
          best = b;
        }
      }
      edges.push({ a, b: best, kind: 'link' });
    }
  }

  // Ingress: requests arrive from the open internet, beyond the screen edges.
  const gateway = nodes[hubs.gateway];
  const ingress = [
    [-1.9, -0.55],
    [-2.1, 0.4],
    [1.95, -0.7],
    [2.05, 0.5],
  ];
  ingress.forEach(([dx, dy], i) => {
    const index = add({
      id: `ingress:${i}`,
      label: null,
      kind: 'ingress',
      station: 'gateway',
      x: gateway.x + dx,
      y: gateway.y + dy,
      z: 1,
      phase: 0,
    });
    edges.push({ a: index, b: hubs.gateway, kind: 'ingress' });
  });

  return { nodes, edges, hubs, route: HUBS.map((hub) => hubs[hub.id]) };
}

/**
 * Breadth-first distance of every node from `start` (edges are undirected).
 * Drives cascading effects: the outage failure wave and the reboot shockwave.
 * @param {MeshGraph} graph
 * @param {number} start
 * @returns {number[]} Hops per node (Infinity when unreachable).
 */
export function hopsFrom(graph, start) {
  const adjacency = graph.nodes.map(() => /** @type {number[]} */ ([]));
  for (const { a, b } of graph.edges) {
    adjacency[a].push(b);
    adjacency[b].push(a);
  }
  const hops = graph.nodes.map(() => Infinity);
  hops[start] = 0;
  const queue = [start];
  while (queue.length > 0) {
    const current = /** @type {number} */ (queue.shift());
    for (const next of adjacency[current]) {
      if (hops[next] === Infinity) {
        hops[next] = hops[current] + 1;
        queue.push(next);
      }
    }
  }
  return hops;
}
