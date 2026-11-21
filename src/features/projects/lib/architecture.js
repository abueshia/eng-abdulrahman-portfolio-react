/**
 * Architecture diagram layout: turns a case study's `architecture`
 * (`nodes[]` with a `layer`, `edges[]` with a `kind`) into SVG geometry.
 *
 * The request flows top to bottom through the layers (client → edge → app →
 * worker → data → external), one row per layer that has nodes, each row
 * centred. RTL mirrors x (the row label moves to the right edge) so the
 * diagram reads from the inline start in both languages, without flipping
 * any text.
 *
 * Pure and deterministic: the prerendered SVG and the hydrated one are
 * identical, and the layout is unit-tested.
 */

/** Layer order, top to bottom. Unknown layers are appended in data order. */
export const LAYERS = Object.freeze(['client', 'edge', 'app', 'worker', 'data', 'external']);

export const NODE_W = 184;
export const NODE_H = 62;
const COL_GAP = 26;
const ROW_GAP = 64;
const PAD = 20;
const LABEL_W = 92;

/**
 * @typedef {{ id: string, label: string, layer: string, note?: string | null }} ArchNode
 * @typedef {{ from: string, to: string, kind?: 'sync' | 'async' | 'realtime', label?: string | null }} ArchEdge
 *
 * @typedef {ArchNode & { x: number, y: number, w: number, h: number, row: number }} PlacedNode
 * @typedef {ArchEdge & { id: string, d: string, kind: 'sync' | 'async' | 'realtime', mid: { x: number, y: number } }} PlacedEdge
 *
 * @typedef {Object} ArchLayout
 * @property {number} width
 * @property {number} height
 * @property {PlacedNode[]} nodes
 * @property {PlacedEdge[]} edges
 * @property {Array<{ layer: string, x: number, y: number }>} rows  Row labels.
 */

const round = (/** @type {number} */ n) => Math.round(n * 10) / 10;

/**
 * @param {{ nodes?: ArchNode[], edges?: ArchEdge[] } | null | undefined} architecture
 * @param {{ dir?: 'ltr' | 'rtl' }} [options]
 * @returns {ArchLayout}
 */
export function layoutArchitecture(architecture, { dir = 'ltr' } = {}) {
  const nodes = architecture?.nodes ?? [];
  const edges = architecture?.edges ?? [];
  const order = [...LAYERS];
  nodes.forEach((node) => {
    if (!order.includes(node.layer)) order.push(node.layer);
  });
  const layers = order.filter((layer) => nodes.some((node) => node.layer === layer));
  const perRow = Math.max(1, ...layers.map((l) => nodes.filter((n) => n.layer === l).length));
  const contentW = perRow * NODE_W + (perRow - 1) * COL_GAP;
  const width = PAD * 2 + LABEL_W + contentW;
  const height = PAD * 2 + layers.length * NODE_H + Math.max(0, layers.length - 1) * ROW_GAP;
  const mirror = (/** @type {number} */ x, /** @type {number} */ w) =>
    dir === 'rtl' ? width - x - w : x;

  /** @type {Map<string, PlacedNode>} */
  const placed = new Map();
  layers.forEach((layer, row) => {
    const members = nodes.filter((node) => node.layer === layer);
    const rowW = members.length * NODE_W + (members.length - 1) * COL_GAP;
    const startX = PAD + LABEL_W + (contentW - rowW) / 2;
    const y = PAD + row * (NODE_H + ROW_GAP);
    members.forEach((node, i) => {
      const x = startX + i * (NODE_W + COL_GAP);
      placed.set(node.id, { ...node, x: round(mirror(x, NODE_W)), y, w: NODE_W, h: NODE_H, row });
    });
  });

  /** @type {PlacedEdge[]} */
  const placedEdges = [];
  for (const edge of edges) {
    const a = placed.get(edge.from);
    const b = placed.get(edge.to);
    if (!a || !b) continue;
    let d;
    let mid;
    if (a.row === b.row) {
      // Same layer: side to side, facing each other.
      const forward = b.x > a.x;
      const x1 = forward ? a.x + a.w : a.x;
      const x2 = forward ? b.x : b.x + b.w;
      const y = a.y + a.h / 2;
      d = `M${round(x1)} ${y} L${round(x2)} ${y}`;
      mid = { x: round((x1 + x2) / 2), y };
    } else {
      const down = b.row > a.row;
      const x1 = a.x + a.w / 2;
      const y1 = down ? a.y + a.h : a.y;
      const x2 = b.x + b.w / 2;
      const y2 = down ? b.y : b.y + b.h;
      const bend = (y2 - y1) / 2;
      d = `M${round(x1)} ${y1} C${round(x1)} ${round(y1 + bend)} ${round(x2)} ${round(y2 - bend)} ${round(x2)} ${y2}`;
      mid = { x: round((x1 + x2) / 2), y: round((y1 + y2) / 2) };
    }
    placedEdges.push({
      ...edge,
      kind: edge.kind ?? 'sync',
      id: `${edge.from}->${edge.to}`,
      d,
      mid,
    });
  }

  const rows = layers.map((layer, row) => ({
    layer,
    x: dir === 'rtl' ? width - PAD : PAD,
    y: PAD + row * (NODE_H + ROW_GAP) + NODE_H / 2,
  }));

  return { width, height, nodes: [...placed.values()], edges: placedEdges, rows };
}

/**
 * Edges whose two ends are both in `focus` (the parts of the system a
 * decision is about), so the diagram can light the path between them.
 * @param {PlacedEdge[]} edges
 * @param {ReadonlyArray<string>} focus
 */
export function focusedEdges(edges, focus) {
  const set = new Set(focus);
  return new Set(edges.filter((e) => set.has(e.from) && set.has(e.to)).map((e) => e.id));
}
