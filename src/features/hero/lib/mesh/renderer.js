/**
 * Living Service Mesh: a Canvas2D renderer (no WebGL/three.js; ~10 KB).
 *
 * What it draws, every frame:
 *  - the graph on three depth layers, with parallax from the camera and the
 *    pointer, and labels for named services;
 *  - REST traffic: an Ember packet travels out as a request, the target node
 *    pulses on arrival and an Ion packet travels back as the response;
 *  - the visitor's own request: a brighter packet on the route between
 *    stations. The camera follows it as the page scrolls, so scrolling
 *    literally carries the request deeper into the system; at the Response
 *    station it turns Ion.
 *
 * Interaction: nodes near the pointer light up and nearby links bend toward
 * it; a click/tap fires a burst of requests from the nearest node.
 *
 * Performance: DPR capped, adaptive node/packet budgets, sprites for glows
 * and labels (no shadowBlur), zero allocations per node per frame, paused
 * while the tab is hidden, and an FPS guard that steps quality down (and
 * finally to a static frame) when frames drop.
 */
import { HUBS, buildGraph, hopsFrom } from './graph';

/**
 * @typedef {Object} MeshProfile
 * @property {number} nodes    Visible node budget.
 * @property {number} packets  Concurrent packet budget.
 * @property {number} fps      Frame-rate target (30 on phones saves battery).
 * @property {number} dpr      Device-pixel-ratio cap.
 * @property {'all' | 'services' | 'hubs'} labels
 */

/** @type {Record<'high' | 'mid' | 'mobile', MeshProfile>} */
export const PROFILES = Object.freeze({
  high: { nodes: 72, packets: 40, fps: 60, dpr: 1.5, labels: 'all' },
  mid: { nodes: 52, packets: 26, fps: 60, dpr: 1.5, labels: 'services' },
  mobile: { nodes: 28, packets: 12, fps: 30, dpr: 1.25, labels: 'hubs' },
});

const EDGE_ALPHA = { route: 0.55, link: 0.26, pod: 0.16, ingress: 0.2 };
const FONT = '"JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace';
const OUTAGE_SECONDS = 4.2;

/** @typedef {[number, number, number]} RGB */

/** @param {string} value @returns {RGB | null} */
function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const rgb = value.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
}

const css = (/** @type {RGB} */ c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mix = (/** @type {RGB} */ a, /** @type {RGB} */ b, /** @type {number} */ t) =>
  /** @type {RGB} */ ([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t));
const smoothstep = (
  /** @type {number} */ e0,
  /** @type {number} */ e1,
  /** @type {number} */ x,
) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function readPalette() {
  const style = getComputedStyle(document.documentElement);
  const read = (/** @type {string} */ name, /** @type {RGB} */ fallback) =>
    parseColor(style.getPropertyValue(name).trim()) ?? fallback;
  return {
    dark: document.documentElement.dataset.theme !== 'light',
    ember: read('--accent', [255, 90, 54]),
    ion: read('--secondary', [61, 220, 255]),
    ink: read('--text', [236, 238, 242]),
    muted: read('--text-muted', [154, 163, 178]),
    dim: read('--text-dim', [92, 101, 117]),
    danger: read('--danger', [255, 77, 109]),
  };
}

/** Pre-rendered radial glow (drawn with `lighter`, far cheaper than shadowBlur). */
function glowSprite(/** @type {RGB} */ color, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgba(${color.join(',')},1)`);
  gradient.addColorStop(0.22, `rgba(${color.join(',')},0.5)`);
  gradient.addColorStop(1, `rgba(${color.join(',')},0)`);
  g.fillStyle = gradient;
  g.fillRect(0, 0, size, size);
  return canvas;
}

/**
 * @typedef {Object} MeshInput
 * @property {MeshProfile} profile
 * @property {boolean} animated  False → a single static frame (reduced motion, low tier).
 * @property {() => import('@/features/journey/journey-store').JourneyState} getJourney
 * @property {() => { x: number, y: number, exit: number } | null} getAnchor
 *   Gateway position in viewport px (the portrait) and how far the hero has
 *   scrolled away (0–1). Null when there is no hero.
 * @property {() => 'ltr' | 'rtl'} getDirection
 * @property {(fps: number) => void} [onFps]
 * @property {(level: 'mid' | 'low') => void} [onDegrade]
 *   FPS guard steps: 'mid' first (the caller drops the heaviest layers: WebGL
 *   field, animated grain), then fewer nodes, then 'low' (a still frame).
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @param {MeshInput} input
 */
export function createMeshRenderer(canvas, input) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const { getJourney, getAnchor, getDirection, onFps, onDegrade } = input;
  let animated = input.animated;
  let quality = { ...input.profile };

  /**
   * Palette, glow sprites and label sprites per theme, built on first use and
   * kept: switching themes (even in a burst of clicks) rebuilds nothing.
   * @type {Map<string, { palette: ReturnType<typeof readPalette>, sprites: { ember: HTMLCanvasElement, ion: HTMLCanvasElement }, labels: Map<string, { canvas: HTMLCanvasElement, w: number, h: number }> }>}
   */
  const themes = new Map();
  /** @type {ReturnType<typeof readPalette>} */
  let palette;
  /** @type {{ ember: HTMLCanvasElement, ion: HTMLCanvasElement }} */
  let sprites;
  /** @type {Map<string, { canvas: HTMLCanvasElement, w: number, h: number }>} */
  let labels;
  function selectPalette() {
    const key = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    let entry = themes.get(key);
    if (!entry) {
      const read = readPalette();
      entry = {
        palette: read,
        sprites: { ember: glowSprite(read.ember), ion: glowSprite(read.ion) },
        labels: new Map(),
      };
      themes.set(key, entry);
    }
    ({ palette, sprites, labels } = entry);
  }
  selectPalette();

  /** @type {import('./graph').MeshGraph} */
  let graph;
  /** @type {number[]} */
  let hops = [];
  /** @type {Record<string, number[]>} */
  let edgesByStation = {};
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let ps = new Float32Array(0);
  let pa = new Float32Array(0);
  let light = new Float32Array(0);
  let pulse = new Float32Array(0);

  /**
   * @typedef {{ from: number, to: number, t: number, speed: number, ion: boolean, burst: boolean,
   *   x?: number, y?: number, vx?: number, vy?: number, life?: number }} Packet
   * @type {Packet[]}
   */
  let packets = [];
  /** @type {Array<{ x: number, y: number }>} */
  const trail = [];

  let width = 0;
  let height = 0;
  let dpr = 1;
  let unit = 1;
  const camera = { x: 0, y: 0, zoom: 1, ax: 0, ay: 0 };
  const pointer = { x: -1e4, y: -1e4, sx: -1e4, sy: -1e4, nx: 0, ny: 0 };
  let ionMix = 0;
  let exit = 0;
  let lastStation = /** @type {string | null} */ (null);
  let spawnTimer = 0;
  /** @type {{ t: number, gx: number, gy: number } | null} */
  let outage = null;

  let running = false;
  let frameId = 0;
  let lastDraw = 0;
  let started = 0;
  let fpsFrames = 0;
  let fpsStart = 0;
  let guardStep = 0;
  /** No verdicts right after a deliberate expensive moment (theme switch). */
  let guardPausedUntil = 0;
  let fps = 0;

  function rebuild() {
    graph = buildGraph({ nodes: quality.nodes });
    hops = hopsFrom(graph, graph.hubs.gateway);
    const n = graph.nodes.length;
    px = new Float32Array(n);
    py = new Float32Array(n);
    ps = new Float32Array(n);
    pa = new Float32Array(n);
    light = new Float32Array(n);
    pulse = new Float32Array(n);
    edgesByStation = {};
    graph.edges.forEach((edge, i) => {
      const station = graph.nodes[edge.a].station;
      (edgesByStation[station] ??= []).push(i);
    });
    packets = [];
  }

  function label(/** @type {string} */ text, /** @type {boolean} */ hub) {
    const key = `${hub ? 'h' : 's'}:${text}`;
    const cached = labels.get(key);
    if (cached) return cached;
    const size = hub ? 10 : 9.5;
    const spacing = hub ? 2 : 0.4;
    const font = `${hub ? 600 : 400} ${size}px ${FONT}`;
    const canvasEl = document.createElement('canvas');
    const g = /** @type {CanvasRenderingContext2D} */ (canvasEl.getContext('2d'));
    g.font = font;
    const w = Math.ceil(g.measureText(text).width + spacing * text.length) + 4;
    const h = Math.ceil(size * 1.6);
    const scale = Math.max(1, dpr);
    canvasEl.width = w * scale;
    canvasEl.height = h * scale;
    g.scale(scale, scale);
    g.font = font;
    if ('letterSpacing' in g) /** @type {any} */ (g).letterSpacing = `${spacing}px`;
    g.textBaseline = 'middle';
    g.fillStyle = css(hub ? palette.ink : palette.muted);
    g.fillText(text, 2, h / 2);
    const entry = { canvas: canvasEl, w, h };
    labels.set(key, entry);
    return entry;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, quality.dpr);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // World unit: viewport height, narrowed on tall portrait screens.
    unit = Math.min(height, width * 0.9);
    themes.forEach((entry) => entry.labels.clear());
    if (!running && graph) drawStill();
  }

  const hub = (/** @type {string | null} */ id) =>
    graph.nodes[graph.hubs[id ?? 'gateway'] ?? graph.hubs.gateway];

  /** @param {number} dt */
  function update(dt) {
    const journey = getJourney();
    const sign = getDirection() === 'rtl' ? -1 : 1;
    const anchor = getAnchor();
    exit = anchor ? anchor.exit : 1;

    // Camera: follows the request along the route, with inertia.
    const from = hub(journey.station);
    const to = journey.next ? hub(journey.next) : from;
    const e = smoothstep(0, 1, journey.local);
    const tx = (from.x + (to.x - from.x) * e) * sign;
    const ty = from.y + (to.y - from.y) * e;
    const k = animated ? 1 - Math.pow(0.004, dt) : 1;
    camera.x += (tx - camera.x) * k;
    camera.y += (ty - camera.y) * k;
    camera.zoom += (1 + 0.16 * smoothstep(0.2, 1, exit) - camera.zoom) * k;

    // Anchor: the portrait while in the hero, then a calm spot at the inline end.
    const restX = width * (sign > 0 ? 0.7 : 0.3);
    const restY = height * 0.5;
    const blend = smoothstep(0, 0.8, exit);
    camera.ax = anchor ? anchor.x + (restX - anchor.x) * blend : restX;
    camera.ay = anchor ? anchor.y + (restY - anchor.y) * blend : restY;

    ionMix +=
      ((journey.station === 'response' ? 1 : 0) - ionMix) * (animated ? 1 - Math.pow(0.08, dt) : 1);

    const pk = 1 - Math.pow(0.002, dt);
    pointer.sx += (pointer.x - pointer.sx) * pk;
    pointer.sy += (pointer.y - pointer.sy) * pk;
    pointer.nx += ((pointer.x > -1e3 ? pointer.x / width - 0.5 : 0) - pointer.nx) * pk;
    pointer.ny += ((pointer.y > -1e3 ? pointer.y / height - 0.5 : 0) - pointer.ny) * pk;

    if (journey.station !== lastStation) {
      lastStation = journey.station;
      if (journey.station && graph.hubs[journey.station] !== undefined) {
        pulse[graph.hubs[journey.station]] = 1.4;
      }
    }

    for (let i = 0; i < pulse.length; i += 1) pulse[i] = Math.max(0, pulse[i] - dt * 0.85);

    if (outage) {
      outage.t += dt;
      if (outage.t > OUTAGE_SECONDS) outage = null;
    }

    if (!animated) return;
    const quiet = outage !== null && outage.t < 2.9;
    spawnTimer -= dt;
    if (!quiet && spawnTimer <= 0 && packets.length < quality.packets) {
      spawn(journey.station ?? 'gateway', false);
      spawnTimer = (0.9 / quality.packets) * 6 * (0.5 + Math.random());
    }
    advance(dt);
  }

  /** @param {string} station @param {boolean} burst @param {number} [fromNode] */
  function spawn(station, burst, fromNode) {
    /** @type {number} */
    let edgeIndex;
    if (fromNode !== undefined) {
      const options = graph.edges
        .map((edge, i) => (edge.a === fromNode || edge.b === fromNode ? i : -1))
        .filter((i) => i >= 0);
      if (options.length === 0) return;
      edgeIndex = options[Math.floor(Math.random() * options.length)];
    } else {
      const local = edgesByStation[station] ?? [];
      edgeIndex =
        local.length > 0 && Math.random() < 0.72
          ? local[Math.floor(Math.random() * local.length)]
          : Math.floor(Math.random() * graph.edges.length);
    }
    const edge = graph.edges[edgeIndex];
    const outward = fromNode === undefined || edge.a === fromNode;
    packets.push({
      from: outward ? edge.a : edge.b,
      to: outward ? edge.b : edge.a,
      t: 0,
      speed: (burst ? 0.55 : 0.2) + Math.random() * 0.16,
      ion: false,
      burst,
    });
  }

  /** @param {number} dt */
  function advance(dt) {
    for (let i = packets.length - 1; i >= 0; i -= 1) {
      const p = packets[i];
      if (p.life !== undefined) {
        // Outage: dropped packets fall out of the system.
        p.vy = /** @type {number} */ (p.vy) + 900 * dt;
        p.x = /** @type {number} */ (p.x) + /** @type {number} */ (p.vx) * dt;
        p.y = /** @type {number} */ (p.y) + p.vy * dt;
        p.life -= dt * 0.8;
        if (p.life <= 0) packets.splice(i, 1);
        continue;
      }
      const a = graph.nodes[p.from];
      const b = graph.nodes[p.to];
      p.t += (dt * p.speed) / Math.max(0.05, Math.hypot(a.x - b.x, a.y - b.y));
      if (p.t >= 1) {
        packets.splice(i, 1);
        pulse[p.to] = Math.max(pulse[p.to], p.burst ? 1 : 0.55);
        // The REST cycle: every request that lands sends a response back.
        if (!p.ion)
          packets.push({ ...p, from: p.to, to: p.from, t: 0, ion: true, speed: p.speed * 1.2 });
      }
    }
  }

  function project(/** @type {number} */ now) {
    const sign = getDirection() === 'rtl' ? -1 : 1;
    const parX = animated ? pointer.nx * -22 : 0;
    const parY = animated ? pointer.ny * -14 : 0;
    const breathe = animated ? 1 : 0;
    for (let i = 0; i < graph.nodes.length; i += 1) {
      const node = graph.nodes[i];
      const depth = 0.46 + 0.54 * node.z;
      const wx = node.x * sign - camera.x + Math.sin(now * 0.0005 + node.phase) * 0.008 * breathe;
      const wy = node.y - camera.y + Math.cos(now * 0.0004 + node.phase) * 0.008 * breathe;
      const s = depth * camera.zoom;
      px[i] = camera.ax + wx * s * unit * 0.78 + parX * (node.z - 0.5);
      py[i] = camera.ay + wy * s * unit + parY * (node.z - 0.5);
      ps[i] = s;
      pa[i] = 0.22 + 0.78 * node.z;
      const d = Math.hypot(px[i] - pointer.sx, py[i] - pointer.sy);
      light[i] += ((d < 170 ? 1 - d / 170 : 0) - light[i]) * 0.18;
    }
  }

  /** Outage state of a node: 0 healthy … 1 down. */
  function failure(/** @type {number} */ i) {
    if (!outage) return 0;
    const down = outage.t - (0.12 + Math.min(hops[i], 12) * 0.1);
    if (down <= 0) return 0;
    const reach = (outage.t - 2.55) * 1500;
    if (reach > 0 && Math.hypot(px[i] - outage.gx, py[i] - outage.gy) < reach) return 0;
    return Math.min(1, down * 4);
  }

  /** @param {number} now */
  function draw(now) {
    if (!graph) return;
    project(now);
    const journey = getJourney();
    const station = journey.station ?? 'gateway';
    const accent = mix(palette.ember, palette.ion, ionMix);
    const calm = 1 - 0.5 * smoothstep(0.15, 0.95, exit);
    const offscreen = (/** @type {number} */ i) =>
      px[i] < -80 || px[i] > width + 80 || py[i] < -80 || py[i] > height + 80;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';

    // Links
    for (const edge of graph.edges) {
      const { a, b } = edge;
      if (offscreen(a) && offscreen(b)) continue;
      const local = graph.nodes[a].station === station || graph.nodes[b].station === station;
      const fail = Math.max(failure(a), failure(b));
      let alpha =
        EDGE_ALPHA[edge.kind] *
        Math.min(pa[a], pa[b]) *
        (local ? 1 : 0.5) *
        calm *
        (1 + (light[a] + light[b]) * 0.9);
      if (alpha < 0.01) continue;
      const route = edge.kind === 'route';
      ctx.strokeStyle = css(
        fail > 0.5 ? palette.danger : route ? accent : palette.dark ? palette.muted : palette.dim,
      );
      alpha *= fail > 0.5 ? 0.55 : 1;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.lineWidth = route ? 1.2 : 0.8;
      if (route || fail > 0.5) {
        ctx.setLineDash(route ? [3, 7] : [2, 5]);
        ctx.lineDashOffset = animated ? -now * 0.02 : 0;
      }
      // Links bend slightly toward a nearby pointer.
      const mx = (px[a] + px[b]) / 2;
      const my = (py[a] + py[b]) / 2;
      const d = Math.hypot(mx - pointer.sx, my - pointer.sy);
      const bend = animated && d < 220 ? (1 - d / 220) * 0.22 : 0;
      ctx.beginPath();
      ctx.moveTo(px[a], py[a]);
      ctx.quadraticCurveTo(
        mx + (pointer.sx - mx) * bend,
        my + (pointer.sy - my) * bend,
        px[b],
        py[b],
      );
      ctx.stroke();
      if (route || fail > 0.5) ctx.setLineDash([]);
    }

    // Nodes + pulse rings
    for (let i = 0; i < graph.nodes.length; i += 1) {
      const node = graph.nodes[i];
      if (node.kind === 'ingress' || offscreen(i)) continue;
      const local = node.station === station;
      const fail = failure(i);
      const flicker = fail > 0 && Math.random() < 0.08 ? 0.4 : 1;
      const alpha = Math.min(1, pa[i] * (local ? 1 : 0.55) * calm * (1 + light[i] * 1.2) * flicker);
      const radius =
        (node.kind === 'hub' ? 3.4 : node.kind === 'service' ? 2.2 : 1.3) *
        ps[i] *
        (1 + light[i] * 0.5);
      const color =
        fail > 0.5
          ? palette.danger
          : local || node.kind === 'hub'
            ? accent
            : palette.dark
              ? palette.ink
              : palette.dim;
      ctx.globalAlpha = alpha * (fail > 0.5 ? 0.6 : 1);
      ctx.fillStyle = css(color);
      ctx.beginPath();
      ctx.arc(px[i], py[i], radius, 0, Math.PI * 2);
      ctx.fill();
      if (node.kind === 'hub') {
        ctx.strokeStyle = css(color);
        ctx.lineWidth = 0.8;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(px[i], py[i], 9 * ps[i], 0, Math.PI * 2);
        ctx.stroke();
      }
      if (pulse[i] > 0.01) {
        const p = Math.min(1, pulse[i]);
        ctx.strokeStyle = css(accent);
        ctx.lineWidth = 1;
        ctx.globalAlpha = p * 0.7 * calm;
        ctx.beginPath();
        ctx.arc(px[i], py[i], radius + (1 - p) * 26 * ps[i] + 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Labels (sprites)
    for (let i = 0; i < graph.nodes.length; i += 1) {
      const node = graph.nodes[i];
      if (!node.label || offscreen(i)) continue;
      const isHub = node.kind === 'hub';
      if (quality.labels === 'hubs' && !isHub) continue;
      if (quality.labels === 'services' && !isHub && node.z < 0.62) continue;
      const local = node.station === station;
      const alpha =
        pa[i] * (local ? 0.9 : 0.35) * calm * (1 + light[i] * 1.5) * (1 - failure(i) * 0.8);
      if (alpha < 0.06) continue;
      const sprite = label(node.label, isHub);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(
        sprite.canvas,
        px[i] + 9 * ps[i],
        py[i] - sprite.h / 2 - 7 * ps[i],
        sprite.w,
        sprite.h,
      );
    }

    // Packets
    if (palette.dark) ctx.globalCompositeOperation = 'lighter';
    for (const p of packets) {
      let x;
      let y;
      if (p.life !== undefined) {
        x = /** @type {number} */ (p.x);
        y = /** @type {number} */ (p.y);
      } else {
        x = px[p.from] + (px[p.to] - px[p.from]) * p.t;
        y = py[p.from] + (py[p.to] - py[p.from]) * p.t;
      }
      const s = (ps[p.from] + ps[p.to]) / 2;
      const life = p.life ?? 1;
      const color = p.life !== undefined ? palette.danger : p.ion ? palette.ion : palette.ember;
      drawPacket(
        x,
        y,
        (p.burst ? 20 : 15) * s,
        1.5 * s,
        color,
        p.ion ? sprites.ion : sprites.ember,
        life * calm,
      );
    }

    // The visitor's request
    const sign = getDirection() === 'rtl' ? -1 : 1;
    const from = hub(journey.station);
    const to = journey.next ? hub(journey.next) : from;
    const e = smoothstep(0, 1, journey.local);
    const z = from.z + (to.z - from.z) * e;
    const depth = (0.46 + 0.54 * z) * camera.zoom;
    const jx = camera.ax + ((from.x + (to.x - from.x) * e) * sign - camera.x) * depth * unit * 0.78;
    const jy = camera.ay + (from.y + (to.y - from.y) * e - camera.y) * depth * unit;
    if (animated) {
      trail.push({ x: jx, y: jy });
      if (trail.length > 28) trail.shift();
    }
    const requestColor = mix(palette.ember, palette.ion, ionMix);
    const reveal = smoothstep(0.02, 0.35, exit);
    if (reveal > 0) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = css(requestColor);
      ctx.lineWidth = 1.6;
      for (let i = 1; i < trail.length; i += 1) {
        ctx.globalAlpha = (i / trail.length) * 0.5 * reveal;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      if (palette.dark) ctx.globalCompositeOperation = 'lighter';
      drawPacket(
        jx,
        jy,
        46 * depth,
        2.8 * depth,
        requestColor,
        ionMix > 0.5 ? sprites.ion : sprites.ember,
        reveal,
      );
    }

    // Reboot shockwave (outage)
    if (outage && outage.t > 2.55) {
      const r = (outage.t - 2.55) * 1500;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = css(palette.ion);
      ctx.lineWidth = 2;
      ctx.globalAlpha = Math.max(0, 1 - (outage.t - 2.55) / 1.2) * 0.8;
      ctx.beginPath();
      ctx.arc(outage.gx, outage.gy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /**
   * @param {number} x @param {number} y @param {number} glow @param {number} core
   * @param {RGB} color @param {HTMLCanvasElement} sprite @param {number} alpha
   */
  function drawPacket(x, y, glow, core, color, sprite, alpha) {
    if (palette.dark) {
      ctx.globalAlpha = alpha * 0.9;
      ctx.drawImage(sprite, x - glow / 2, y - glow / 2, glow, glow);
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = css(palette.dark ? mix(color, [255, 255, 255], 0.35) : color);
    ctx.beginPath();
    ctx.arc(x, y, core, 0, Math.PI * 2);
    ctx.fill();
  }

  /** @param {number} now */
  function loop(now) {
    frameId = requestAnimationFrame(loop);
    const minDelta = 1000 / quality.fps - 1.5;
    if (lastDraw && now - lastDraw < minDelta) return;
    const dt = lastDraw ? Math.min(0.05, (now - lastDraw) / 1000) : 1 / quality.fps;
    lastDraw = now;
    update(dt);
    draw(now);
    guard(now);
  }

  /**
   * FPS guard: 2 s windows; skips the first seconds (boot, hydration) and the
   * moments after a theme switch. Steps down in order of measured cost: the
   * caller's heavy layers first ('mid'), then node count, then a still frame
   * ('low'). Interaction feedback (cursor, hovers) is never the caller's to
   * remove.
   */
  function guard(/** @type {number} */ now) {
    fpsFrames += 1;
    if (!fpsStart) fpsStart = now;
    const elapsed = now - fpsStart;
    if (elapsed < 2000) return;
    fps = Math.round((fpsFrames * 1000) / elapsed);
    fpsFrames = 0;
    fpsStart = now;
    onFps?.(fps);
    if (now - started < 4000 || now < guardPausedUntil || fps >= quality.fps * 0.72) return;
    guardStep += 1;
    if (guardStep === 1) {
      onDegrade?.('mid');
      return;
    }
    if (quality.nodes > PROFILES.mobile.nodes) {
      quality = {
        ...quality,
        nodes: Math.max(PROFILES.mobile.nodes, Math.round(quality.nodes * 0.6)),
        packets: Math.max(10, Math.round(quality.packets * 0.6)),
        labels: quality.labels === 'all' ? 'services' : 'hubs',
      };
      rebuild();
    } else {
      animated = false;
      stop();
      drawStill();
      onDegrade?.('low');
    }
  }

  /** One frame with the camera snapped to its target (static mode, hidden tab). */
  function drawStill() {
    update(1);
    draw(performance.now());
  }

  function start() {
    if (running) return;
    if (!animated) {
      drawStill();
      return;
    }
    running = true;
    lastDraw = 0;
    // A paused stretch is not a slow device: restart the guard's window.
    fpsFrames = 0;
    fpsStart = 0;
    started ||= performance.now();
    frameId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  rebuild();
  resize();

  return {
    start,
    stop,
    resize,
    /**
     * Theme changed (or fonts loaded): switch to that theme's cached palette
     * and repaint right now, in the same frame as the DOM.
     * @param {{ fontsChanged?: boolean }} [options]
     */
    refreshPalette({ fontsChanged = false } = {}) {
      if (fontsChanged) themes.forEach((entry) => entry.labels.clear());
      selectPalette();
      fpsFrames = 0;
      fpsStart = 0;
      guardPausedUntil = performance.now() + 2500;
      if (running) draw(performance.now());
      else drawStill();
    },
    /** Redraws a still frame when not animating (journey moved, fonts loaded). */
    redraw() {
      if (!running) drawStill();
    },
    /** @param {number} x @param {number} y Viewport px. */
    setPointer(x, y) {
      pointer.x = x;
      pointer.y = y;
    },
    /**
     * Fires a burst of requests from the node nearest to (x, y).
     * @returns {boolean} Whether a node was close enough.
     */
    burst(/** @type {number} */ x, /** @type {number} */ y) {
      if (!animated) return false;
      let best = -1;
      let bestDistance = 240;
      for (let i = 0; i < graph.nodes.length; i += 1) {
        if (graph.nodes[i].kind === 'ingress') continue;
        const d = Math.hypot(px[i] - x, py[i] - y);
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      }
      if (best < 0) return false;
      pulse[best] = 1.5;
      for (let i = 0; i < 9; i += 1) spawn(graph.nodes[best].station, true, best);
      return true;
    },
    /** `php artisan down`: cascade failure, darkness, then an Ion reboot wave. */
    outage() {
      if (!animated) return;
      const g = graph.hubs.gateway;
      outage = { t: 0, gx: px[g], gy: py[g] };
      for (const p of packets) {
        if (p.life !== undefined) continue;
        p.x = px[p.from] + (px[p.to] - px[p.from]) * p.t;
        p.y = py[p.from] + (py[p.to] - py[p.from]) * p.t;
        p.vx = (Math.random() - 0.5) * 120;
        p.vy = -Math.random() * 120;
        p.life = 1;
      }
    },
    /**
     * Changes the frame-rate target (the caller lowers it once the hero has
     * scrolled away). The FPS guard judges against the new target.
     * @param {number} target
     */
    setFps(target) {
      if (quality.fps === target) return;
      quality = { ...quality, fps: target };
      fpsFrames = 0;
      fpsStart = 0;
    },
    get fps() {
      return fps;
    },
    destroy() {
      stop();
      packets = [];
    },
  };
}

/** Hub ids in route order (exposed for tests and the journey). */
export const ROUTE = HUBS.map((hub) => hub.id);
