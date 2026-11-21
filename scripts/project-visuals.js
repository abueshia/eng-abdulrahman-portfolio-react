/**
 * Project visuals (`npm run visuals`).
 *
 * Draws the sample case studies' screens as SVG files (dashboards, tables,
 * charts, a point of sale, phone frames) into `public/images/projects/<slug>/`.
 * They are ordinary image files referenced by path from the project data, so
 * swapping in real screenshots later means changing the path only.
 *
 * Deterministic (seeded): re-running produces identical files. Copy is
 * skeleton bars, not invented figures: these are illustrations, not data.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public/images/projects');
const W = 1600;
const H = 1000;

const C = {
  bg: '#090b0f',
  panel: '#10131a',
  raised: '#161a23',
  line: '#232937',
  skel: '#2a3141',
  skelSoft: '#1e2430',
  text: '#c9ced8',
  dim: '#5c6575',
  ember: '#ff5a36',
  ion: '#3ddcff',
  signal: '#7cffb2',
  amber: '#ffc861',
};

/** @param {number} seed */
function rng(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
const rect = (x, y, w, h, fill, rx = 6, extra = '') =>
  `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${rx}" fill="${fill}" ${extra}/>`;
const text = (x, y, value, { size = 14, fill = C.text, weight = 500, anchor = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${value}</text>`;
const skel = (x, y, w, h = 10, fill = C.skel) => rect(x, y, w, h, fill, h / 2);

/** App chrome: window bar, sidebar, title. Returns the content box. */
function chrome({ accent, title, nav = 6, active = 0 }) {
  const parts = [
    rect(0, 0, W, H, C.bg, 0),
    rect(24, 24, W - 48, H - 48, C.panel, 18, `stroke="${C.line}"`),
    // window bar
    `<circle cx="56" cy="56" r="6" fill="#3a4152"/><circle cx="76" cy="56" r="6" fill="#3a4152"/><circle cx="96" cy="56" r="6" fill="#3a4152"/>`,
    rect(W / 2 - 180, 42, 360, 28, C.raised, 14),
    skel(W / 2 - 150, 52, 150, 8, C.skelSoft),
    `<line x1="24" y1="88" x2="${W - 24}" y2="88" stroke="${C.line}"/>`,
    // sidebar
    `<line x1="260" y1="88" x2="260" y2="${H - 24}" stroke="${C.line}"/>`,
    rect(52, 116, 36, 36, accent, 10),
    skel(100, 128, 110, 12),
  ];
  for (let i = 0; i < nav; i += 1) {
    const y = 196 + i * 48;
    if (i === active) parts.push(rect(40, y - 14, 200, 40, `${accent}22`, 10));
    parts.push(rect(56, y - 2, 16, 16, i === active ? accent : C.skel, 4));
    parts.push(skel(84, y + 1, 90 + ((i * 37) % 60), 10, i === active ? C.text : C.skel));
  }
  parts.push(text(296, 140, title, { size: 26, weight: 700, fill: '#eceef2' }));
  parts.push(skel(296, 158, 260, 9, C.skelSoft));
  parts.push(rect(W - 250, 112, 190, 44, accent, 12));
  parts.push(skel(W - 222, 130, 134, 9, '#00000055'));
  return { parts, box: { x: 296, y: 196, w: W - 296 - 60, h: H - 196 - 60 } };
}

function kpis(x, y, w, n, accent, seed) {
  const random = rng(seed);
  const gap = 20;
  const tw = (w - gap * (n - 1)) / n;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const tx = x + i * (tw + gap);
    out.push(rect(tx, y, tw, 132, C.raised, 14, `stroke="${C.line}"`));
    out.push(skel(tx + 22, y + 26, tw * 0.4, 9));
    out.push(skel(tx + 22, y + 56, tw * 0.55, 22, i === 0 ? accent : C.text));
    const points = Array.from({ length: 12 }, (_, k) => {
      const px = tx + 22 + (k / 11) * (tw - 44);
      const py = y + 112 - random() * 22 - k * 0.8;
      return `${r2(px)},${r2(py)}`;
    });
    out.push(
      `<polyline points="${points.join(' ')}" fill="none" stroke="${i === 0 ? accent : C.dim}" stroke-width="2" stroke-linejoin="round"/>`,
    );
  }
  return out.join('');
}

function lineChart(x, y, w, h, accent, seed, { area = true, second = true } = {}) {
  const random = rng(seed);
  const out = [rect(x, y, w, h, C.raised, 14, `stroke="${C.line}"`)];
  out.push(skel(x + 24, y + 24, 160, 11, C.text), skel(x + 24, y + 44, 100, 8, C.skelSoft));
  const cx = x + 24;
  const cy = y + 80;
  const cw = w - 48;
  const ch = h - 110;
  for (let i = 0; i <= 4; i += 1) {
    out.push(
      `<line x1="${cx}" y1="${r2(cy + (ch / 4) * i)}" x2="${cx + cw}" y2="${r2(cy + (ch / 4) * i)}" stroke="${C.line}" stroke-dasharray="4 6"/>`,
    );
  }
  const series = (lift, jitter) => {
    let v = 0.25 + random() * 0.15;
    return Array.from({ length: 24 }, (_, k) => {
      v = Math.min(0.95, Math.max(0.08, v + (random() - 0.42) * jitter + lift));
      return [cx + (k / 23) * cw, cy + ch - v * ch];
    });
  };
  const main = series(0.012, 0.16);
  const path = main.map(([px, py], k) => `${k ? 'L' : 'M'}${r2(px)} ${r2(py)}`).join(' ');
  const grad = `g${seed}`;
  if (area) {
    out.push(
      `<defs><linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0.35"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></linearGradient></defs>`,
      `<path d="${path} L${cx + cw} ${cy + ch} L${cx} ${cy + ch} Z" fill="url(#${grad})"/>`,
    );
  }
  if (second) {
    const other = series(0.004, 0.1)
      .map(([px, py], k) => `${k ? 'L' : 'M'}${r2(px)} ${r2(py)}`)
      .join(' ');
    out.push(
      `<path d="${other}" fill="none" stroke="${C.dim}" stroke-width="2" stroke-dasharray="6 6"/>`,
    );
  }
  out.push(
    `<path d="${path}" fill="none" stroke="${accent}" stroke-width="3" stroke-linejoin="round"/>`,
  );
  const [lx, ly] = main[main.length - 1];
  out.push(
    `<circle cx="${r2(lx)}" cy="${r2(ly)}" r="7" fill="${C.bg}" stroke="${accent}" stroke-width="3"/>`,
  );
  return out.join('');
}

function bars(x, y, w, h, accent, seed, n = 12) {
  const random = rng(seed);
  const out = [rect(x, y, w, h, C.raised, 14, `stroke="${C.line}"`)];
  out.push(skel(x + 24, y + 24, 140, 11, C.text));
  const gap = 12;
  const bw = (w - 48 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) {
    const bh = (0.25 + random() * 0.7) * (h - 100);
    out.push(
      rect(x + 24 + i * (bw + gap), y + h - 28 - bh, bw, bh, i === n - 3 ? accent : C.skel, 6),
    );
  }
  return out.join('');
}

const PILLS = [
  [C.signal, 'paid'],
  [C.amber, 'pending'],
  [C.ion, 'active'],
  [C.ember, 'failed'],
];

function table(x, y, w, rows, accent, seed, { pills = true, cols = 5, avatar = true } = {}) {
  const random = rng(seed);
  const rh = 56;
  const out = [rect(x, y, w, 64 + rows * rh, C.raised, 14, `stroke="${C.line}"`)];
  const cw = (w - 48) / cols;
  for (let c = 0; c < cols; c += 1) out.push(skel(x + 24 + c * cw, y + 28, cw * 0.4, 8, C.dim));
  out.push(`<line x1="${x}" y1="${y + 60}" x2="${x + w}" y2="${y + 60}" stroke="${C.line}"/>`);
  for (let r = 0; r < rows; r += 1) {
    const ry = y + 64 + r * rh;
    if (r % 2 === 1) out.push(rect(x + 1, ry, w - 2, rh, '#ffffff05', 0));
    for (let c = 0; c < cols; c += 1) {
      const cx = x + 24 + c * cw;
      if (c === 0 && avatar) {
        out.push(
          `<circle cx="${cx + 14}" cy="${ry + rh / 2}" r="14" fill="${r % 3 === 0 ? `${accent}55` : C.skel}"/>`,
        );
        out.push(skel(cx + 40, ry + rh / 2 - 5, cw * (0.35 + random() * 0.3)));
      } else if (c === cols - 2 && pills) {
        const [color, label] = PILLS[Math.floor(random() * PILLS.length)];
        out.push(rect(cx, ry + 16, 92, 24, `${color}22`, 12));
        out.push(`<circle cx="${cx + 16}" cy="${ry + 28}" r="4" fill="${color}"/>`);
        out.push(text(cx + 28, ry + 33, label, { size: 13, fill: color }));
      } else if (c === cols - 1) {
        out.push(skel(cx + cw * 0.3, ry + rh / 2 - 5, cw * 0.4, 10, C.text));
      } else {
        out.push(skel(cx, ry + rh / 2 - 5, cw * (0.3 + random() * 0.4)));
      }
    }
  }
  return out.join('');
}

function productGrid(x, y, w, h, accent, seed, cols = 4, rows = 3) {
  const random = rng(seed);
  const gap = 18;
  const tw = (w - gap * (cols - 1)) / cols;
  const th = (h - gap * (rows - 1)) / rows;
  const hues = [accent, C.ion, C.signal, C.amber, '#b48cff'];
  const out = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const tx = x + c * (tw + gap);
      const ty = y + r * (th + gap);
      const hue = hues[Math.floor(random() * hues.length)];
      out.push(
        rect(tx, ty, tw, th, C.raised, 14, `stroke="${r === 0 && c === 1 ? accent : C.line}"`),
      );
      out.push(rect(tx + 14, ty + 14, tw - 28, th * 0.52, `${hue}18`, 10));
      out.push(
        `<circle cx="${r2(tx + tw / 2)}" cy="${r2(ty + 14 + th * 0.26)}" r="${r2(th * 0.13)}" fill="${hue}55"/>`,
      );
      out.push(skel(tx + 16, ty + th * 0.66 + 10, tw * 0.6, 10, C.text));
      out.push(skel(tx + 16, ty + th * 0.66 + 32, tw * 0.3, 10, hue));
    }
  }
  return out.join('');
}

function basket(x, y, w, h, accent) {
  const out = [rect(x, y, w, h, C.raised, 16, `stroke="${C.line}"`)];
  out.push(skel(x + 24, y + 28, 120, 12, C.text));
  for (let i = 0; i < 5; i += 1) {
    const ly = y + 84 + i * 64;
    out.push(rect(x + 24, ly, 44, 44, C.skelSoft, 10));
    out.push(skel(x + 84, ly + 8, w * 0.38, 10, C.text), skel(x + 84, ly + 28, w * 0.2, 8));
    out.push(skel(x + w - 90, ly + 16, 64, 10, C.text));
  }
  const ty = y + h - 190;
  out.push(
    `<line x1="${x + 24}" y1="${ty}" x2="${x + w - 24}" y2="${ty}" stroke="${C.line}" stroke-dasharray="4 6"/>`,
  );
  out.push(skel(x + 24, ty + 26, 90, 9), skel(x + w - 110, ty + 26, 86, 9));
  out.push(skel(x + 24, ty + 56, 120, 14, C.text), skel(x + w - 140, ty + 54, 116, 18, accent));
  out.push(rect(x + 24, y + h - 84, w - 48, 60, accent, 14));
  out.push(skel(x + w / 2 - 50, y + h - 59, 100, 10, '#00000066'));
  return out.join('');
}

function plans(x, y, w, h, accent) {
  const gap = 24;
  const pw = (w - gap * 2) / 3;
  const out = [];
  for (let i = 0; i < 3; i += 1) {
    const px = x + i * (pw + gap);
    const hot = i === 1;
    out.push(
      rect(
        px,
        y + (hot ? 0 : 24),
        pw,
        h - (hot ? 0 : 24),
        hot ? '#1a1410' : C.raised,
        18,
        `stroke="${hot ? accent : C.line}"`,
      ),
    );
    const top = y + (hot ? 32 : 56);
    if (hot)
      out.push(
        rect(px + pw - 120, top - 8, 96, 26, `${accent}33`, 13),
        skel(px + pw - 104, top + 1, 64, 8, accent),
      );
    out.push(skel(px + 28, top + 8, 110, 14, C.text));
    out.push(skel(px + 28, top + 52, 160, 30, hot ? accent : C.text));
    for (let k = 0; k < 6; k += 1) {
      const ly = top + 120 + k * 44;
      out.push(`<circle cx="${px + 36}" cy="${ly}" r="8" fill="${hot ? `${accent}66` : C.skel}"/>`);
      out.push(skel(px + 56, ly - 5, pw * (0.4 + ((k * 13) % 30) / 100), 10));
    }
    out.push(rect(px + 28, y + h - 92, pw - 56, 56, hot ? accent : C.skelSoft, 14));
  }
  return out.join('');
}

function form(x, y, w, accent, fields = 5) {
  const out = [rect(x, y, w, 120 + fields * 92, C.raised, 16, `stroke="${C.line}"`)];
  out.push(skel(x + 28, y + 32, 180, 13, C.text), skel(x + 28, y + 56, 280, 8, C.skelSoft));
  for (let i = 0; i < fields; i += 1) {
    const fy = y + 100 + i * 92;
    out.push(skel(x + 28, fy, 120, 9, C.dim));
    if (i === 2) {
      out.push(
        rect(x + 28, fy + 20, 64, 34, `${accent}`, 17),
        `<circle cx="${x + 74}" cy="${fy + 37}" r="13" fill="#fff"/>`,
      );
      out.push(skel(x + 108, fy + 32, 220, 9));
    } else {
      out.push(
        rect(x + 28, fy + 20, w - 56, 46, C.bg, 10, `stroke="${i === 1 ? accent : C.line}"`),
      );
      out.push(skel(x + 46, fy + 38, (w - 56) * (0.3 + i * 0.08), 9, i === 1 ? C.text : C.skel));
    }
  }
  return out.join('');
}

function map(x, y, w, h, accent, seed) {
  const random = rng(seed);
  const id = `clip${seed}`;
  const out = [
    `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath></defs>`,
    rect(x, y, w, h, '#0d1117', 18),
    `<g clip-path="url(#${id})">`,
  ];
  for (let i = 0; i < 14; i += 1) {
    const lx = x + random() * w;
    out.push(
      `<line x1="${r2(lx)}" y1="${y}" x2="${r2(lx + (random() - 0.5) * 160)}" y2="${y + h}" stroke="#1b2230" stroke-width="${6 + random() * 10}"/>`,
    );
    const ly = y + random() * h;
    out.push(
      `<line x1="${x}" y1="${r2(ly)}" x2="${x + w}" y2="${r2(ly + (random() - 0.5) * 120)}" stroke="#1b2230" stroke-width="${6 + random() * 10}"/>`,
    );
  }
  out.push(rect(x + w * 0.62, y + h * 0.12, w * 0.24, h * 0.18, '#12301f', 12));
  const pts = [
    [0.16, 0.82],
    [0.3, 0.66],
    [0.28, 0.48],
    [0.5, 0.42],
    [0.62, 0.26],
    [0.8, 0.2],
  ].map(([px, py]) => [x + px * w, y + py * h]);
  const d = pts.map(([px, py], k) => `${k ? 'L' : 'M'}${r2(px)} ${r2(py)}`).join(' ');
  out.push(
    `<path d="${d}" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="0.25"/>`,
  );
  out.push(
    `<path d="${d}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  const [sx, sy] = pts[0];
  const [ex, ey] = pts[pts.length - 1];
  const [mx, my] = pts[3];
  out.push(
    `<circle cx="${r2(sx)}" cy="${r2(sy)}" r="10" fill="${C.bg}" stroke="${C.text}" stroke-width="4"/>`,
  );
  out.push(
    `<circle cx="${r2(ex)}" cy="${r2(ey)}" r="12" fill="${accent}"/><circle cx="${r2(ex)}" cy="${r2(ey)}" r="26" fill="${accent}" opacity="0.18"/>`,
  );
  out.push(
    `<circle cx="${r2(mx)}" cy="${r2(my)}" r="9" fill="${C.signal}"/><circle cx="${r2(mx)}" cy="${r2(my)}" r="20" fill="none" stroke="${C.signal}" stroke-width="2" opacity="0.6"/>`,
  );
  out.push('</g>');
  return out.join('');
}

function phone(x, y, accent, seed, kind) {
  const pw = 380;
  const ph = 780;
  const out = [
    rect(x, y, pw, ph, '#05060a', 54, `stroke="#2b3242" stroke-width="3"`),
    rect(x + 14, y + 14, pw - 28, ph - 28, C.panel, 42),
    rect(x + pw / 2 - 60, y + 26, 120, 30, '#05060a', 15),
  ];
  const ix = x + 14;
  const iw = pw - 28;
  if (kind === 'map') {
    out.push(map(ix, y + 14, iw, ph * 0.56, accent, seed));
    out.push(rect(ix + 16, y + ph * 0.52, iw - 32, ph * 0.4, C.raised, 22, `stroke="${C.line}"`));
    out.push(
      skel(ix + 40, y + ph * 0.52 + 34, 140, 13, C.text),
      skel(ix + 40, y + ph * 0.52 + 60, 90, 9),
    );
    for (let i = 0; i < 4; i += 1) {
      const sy = y + ph * 0.52 + 104 + i * 40;
      out.push(`<circle cx="${ix + 48}" cy="${sy}" r="8" fill="${i < 2 ? accent : C.skel}"/>`);
      if (i < 3)
        out.push(
          `<line x1="${ix + 48}" y1="${sy + 9}" x2="${ix + 48}" y2="${sy + 31}" stroke="${i < 1 ? accent : C.skel}" stroke-width="3"/>`,
        );
      out.push(skel(ix + 70, sy - 5, 150 - i * 12, 10, i < 2 ? C.text : C.skel));
    }
  } else {
    out.push(skel(ix + 28, y + 86, 150, 14, C.text), skel(ix + 28, y + 112, 100, 9));
    for (let i = 0; i < 5; i += 1) {
      const cy = y + 150 + i * 116;
      out.push(
        rect(ix + 20, cy, iw - 40, 100, C.raised, 18, `stroke="${i === 0 ? accent : C.line}"`),
      );
      out.push(rect(ix + 36, cy + 18, 64, 64, i === 0 ? `${accent}33` : C.skelSoft, 14));
      out.push(skel(ix + 116, cy + 28, 130, 11, C.text), skel(ix + 116, cy + 52, 90, 8));
      const [color] = PILLS[(i + seed) % PILLS.length];
      out.push(`<circle cx="${ix + iw - 46}" cy="${cy + 50}" r="7" fill="${color}"/>`);
    }
  }
  return out.join('');
}

function kanban(x, y, w, h, accent, seed) {
  const random = rng(seed);
  const cols = 4;
  const gap = 20;
  const cw = (w - gap * (cols - 1)) / cols;
  const colors = [C.dim, C.amber, accent, C.signal];
  const out = [];
  for (let c = 0; c < cols; c += 1) {
    const cx = x + c * (cw + gap);
    out.push(rect(cx, y, cw, h, C.raised, 16, `stroke="${C.line}"`));
    out.push(
      `<circle cx="${cx + 26}" cy="${y + 32}" r="6" fill="${colors[c]}"/>`,
      skel(cx + 42, y + 27, 90, 10, C.text),
    );
    const cards = 2 + Math.floor(random() * 3);
    for (let k = 0; k < cards; k += 1) {
      const ky = y + 64 + k * 132;
      if (ky + 116 > y + h) break;
      out.push(
        rect(
          cx + 14,
          ky,
          cw - 28,
          116,
          C.panel,
          12,
          `stroke="${c === 2 && k === 0 ? accent : C.line}"`,
        ),
      );
      out.push(
        skel(cx + 30, ky + 20, (cw - 60) * 0.7, 10, C.text),
        skel(cx + 30, ky + 42, (cw - 60) * 0.5, 8),
      );
      out.push(
        `<circle cx="${cx + 42}" cy="${ky + 86}" r="12" fill="${C.skel}"/>`,
        skel(cx + 62, ky + 81, 70, 9),
      );
      out.push(rect(cx + cw - 96, ky + 74, 66, 24, `${colors[c]}22`, 12));
    }
  }
  return out.join('');
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>\n`;

const screens = {
  dashboard: (accent, seed, title = 'Overview') => {
    const { parts, box } = chrome({ accent, title });
    parts.push(kpis(box.x, box.y, box.w, 4, accent, seed));
    parts.push(lineChart(box.x, box.y + 156, box.w * 0.64, box.h - 156, accent, seed + 1));
    parts.push(
      bars(
        box.x + box.w * 0.64 + 20,
        box.y + 156,
        box.w * 0.36 - 20,
        box.h - 156,
        accent,
        seed + 2,
        8,
      ),
    );
    return svg(parts.join(''));
  },
  table: (accent, seed, title = 'Records', active = 1) => {
    const { parts, box } = chrome({ accent, title, active });
    parts.push(
      rect(box.x, box.y, 360, 44, C.raised, 12, `stroke="${C.line}"`),
      skel(box.x + 20, box.y + 18, 180, 9),
    );
    for (let i = 0; i < 3; i += 1)
      parts.push(
        rect(box.x + 380 + i * 130, box.y, 118, 44, i === 0 ? `${accent}22` : C.raised, 12),
        skel(box.x + 400 + i * 130, box.y + 18, 70, 9, i === 0 ? accent : C.skel),
      );
    parts.push(table(box.x, box.y + 68, box.w, 10, accent, seed));
    return svg(parts.join(''));
  },
  plans: (accent) => {
    const { parts, box } = chrome({ accent, title: 'Plans', active: 2 });
    parts.push(plans(box.x + 40, box.y + 10, box.w - 80, box.h - 10, accent));
    return svg(parts.join(''));
  },
  settings: (accent, seed) => {
    const { parts, box } = chrome({ accent, title: 'Tenant settings', active: 5 });
    parts.push(form(box.x, box.y, box.w * 0.58, accent, 5));
    parts.push(
      rect(
        box.x + box.w * 0.58 + 24,
        box.y,
        box.w * 0.42 - 24,
        300,
        C.raised,
        16,
        `stroke="${C.line}"`,
      ),
    );
    parts.push(skel(box.x + box.w * 0.58 + 52, box.y + 34, 160, 12, C.text));
    parts.push(
      rect(
        box.x + box.w * 0.58 + 52,
        box.y + 74,
        box.w * 0.42 - 80,
        60,
        C.bg,
        12,
        `stroke="${accent}"`,
      ),
    );
    parts.push(
      text(box.x + box.w * 0.58 + 74, box.y + 110, 'tenant.example.app', {
        size: 18,
        fill: accent,
      }),
    );
    parts.push(
      bars(box.x + box.w * 0.58 + 24, box.y + 324, box.w * 0.42 - 24, box.h - 324, accent, seed, 7),
    );
    return svg(parts.join(''));
  },
  pos: (accent, seed) => {
    const parts = [
      rect(0, 0, W, H, C.bg, 0),
      rect(24, 24, W - 48, H - 48, C.panel, 18, `stroke="${C.line}"`),
    ];
    parts.push(rect(56, 52, 44, 44, accent, 12), skel(116, 66, 140, 12, C.text));
    for (let i = 0; i < 6; i += 1)
      parts.push(
        rect(56 + i * 150, 124, 136, 46, i === 0 ? accent : C.raised, 23),
        skel(84 + i * 150, 143, 80, 9, i === 0 ? '#00000066' : C.skel),
      );
    parts.push(productGrid(56, 196, 1010, 740, accent, seed));
    parts.push(basket(1096, 52, 448, 884, accent));
    return svg(parts.join(''));
  },
  report: (accent, seed) => {
    const { parts, box } = chrome({ accent, title: 'Daily report', active: 3 });
    parts.push(kpis(box.x, box.y, box.w, 3, accent, seed));
    parts.push(bars(box.x, box.y + 156, box.w * 0.5 - 10, box.h - 156, accent, seed + 3, 10));
    parts.push(
      lineChart(
        box.x + box.w * 0.5 + 10,
        box.y + 156,
        box.w * 0.5 - 10,
        box.h - 156,
        accent,
        seed + 4,
        { second: false },
      ),
    );
    return svg(parts.join(''));
  },
  roles: (accent, seed) => {
    const { parts, box } = chrome({ accent, title: 'Roles & permissions', active: 4 });
    const random = rng(seed);
    parts.push(rect(box.x, box.y, box.w, box.h, C.raised, 14, `stroke="${C.line}"`));
    const cols = 5;
    const cw = (box.w - 300) / cols;
    for (let c = 0; c < cols; c += 1)
      parts.push(skel(box.x + 300 + c * cw + cw / 2 - 40, box.y + 30, 80, 9, C.dim));
    for (let r = 0; r < 10; r += 1) {
      const ry = box.y + 74 + r * 64;
      parts.push(
        `<line x1="${box.x}" y1="${ry}" x2="${box.x + box.w}" y2="${ry}" stroke="${C.line}"/>`,
      );
      parts.push(skel(box.x + 28, ry + 27, 140 + ((r * 31) % 90), 10));
      for (let c = 0; c < cols; c += 1) {
        const on = random() > 0.4;
        const cx = box.x + 300 + c * cw + cw / 2;
        parts.push(
          rect(
            cx - 13,
            ry + 19,
            26,
            26,
            on ? `${accent}` : C.bg,
            7,
            on ? '' : `stroke="${C.skel}"`,
          ),
        );
        if (on)
          parts.push(
            `<path d="M${cx - 6} ${ry + 32} l4 5 l9 -10" fill="none" stroke="#0b0d12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
          );
      }
    }
    return svg(parts.join(''));
  },
  phones: (accent, seed) => {
    const parts = [rect(0, 0, W, H, C.bg, 0)];
    parts.push(`<circle cx="${W / 2}" cy="${H / 2}" r="460" fill="${accent}" opacity="0.06"/>`);
    parts.push(phone(330, 110, accent, seed, 'map'));
    parts.push(phone(890, 110, accent, seed + 1, 'list'));
    parts.push(
      text(W / 2, 62, 'customer  ·  courier', { size: 18, fill: C.dim, anchor: 'middle' }),
    );
    return svg(parts.join(''));
  },
  dispatch: (accent, seed) => {
    const { parts, box } = chrome({ accent, title: 'Dispatch', active: 1 });
    parts.push(kanban(box.x, box.y, box.w * 0.66, box.h, accent, seed));
    parts.push(map(box.x + box.w * 0.66 + 20, box.y, box.w * 0.34 - 20, box.h, accent, seed + 5));
    return svg(parts.join(''));
  },
};

/** slug → accent + files (name → [screen, ...args]). */
const PROJECTS = {
  'sample-saas-billing': {
    accent: C.ember,
    files: {
      cover: ['dashboard', 11, 'Overview'],
      preview: ['table', 12, 'Subscriptions', 2],
      '01': ['table', 13, 'Invoices', 1],
      '02': ['plans', 14],
      '03': ['settings', 15],
    },
  },
  'sample-inventory-pos': {
    accent: C.signal,
    files: {
      cover: ['pos', 21],
      preview: ['report', 22],
      '01': ['table', 23, 'Inventory', 2],
      '02': ['report', 24],
      '03': ['roles', 25],
    },
  },
  'sample-delivery-dispatch': {
    accent: C.ion,
    files: {
      cover: ['phones', 31],
      preview: ['dispatch', 32],
      '01': ['dispatch', 33],
      '02': ['table', 34, 'Notifications', 3],
      '03': ['phones', 35],
    },
  },
};

let count = 0;
for (const [slug, { accent, files }] of Object.entries(PROJECTS)) {
  const dir = join(OUT, slug);
  await mkdir(dir, { recursive: true });
  for (const [name, [screen, ...args]] of Object.entries(files)) {
    await writeFile(join(dir, `${name}.svg`), screens[screen](accent, ...args), 'utf-8');
    count += 1;
  }
}
console.log(`✓ wrote ${count} project visuals to public/images/projects/`);

/* ------------------------------------------------------------ blog covers */

const BW = 1600;
const BH = 900;
const cover = (accent, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}">` +
  `<defs><radialGradient id="glow" cx="0.7" cy="0.3" r="0.8"><stop offset="0" stop-color="${accent}" stop-opacity="0.22"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>` +
  `<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.04"/></pattern></defs>` +
  rect(0, 0, BW, BH, C.bg, 0) +
  `<rect width="${BW}" height="${BH}" fill="url(#grid)"/><rect width="${BW}" height="${BH}" fill="url(#glow)"/>` +
  body +
  '</svg>\n';

/** Two identical events (Ember) converge on one stored record. */
function idempotencyCover() {
  const parts = [];
  const record = [1000, 330, 380, 240];
  for (const [i, y] of [
    [0, 230],
    [1, 560],
  ]) {
    parts.push(rect(220, y, 340, 110, C.raised, 18, `stroke="${C.ember}"`));
    parts.push(text(250, y + 46, 'evt_7f3a', { size: 28, fill: C.ember, weight: 700 }));
    parts.push(skel(250, y + 70, 200, 10));
    parts.push(
      `<path d="M560 ${y + 55} C 760 ${y + 55}, 820 450, ${record[0]} 450" fill="none" stroke="${C.ember}" stroke-width="3" stroke-dasharray="${i ? '10 10' : '0'}" opacity="${i ? 0.55 : 1}"/>`,
    );
  }
  parts.push(rect(...record, C.raised, 22, `stroke="${C.signal}" stroke-width="2"`));
  parts.push(text(1030, 395, 'webhook_events', { size: 26, fill: C.text, weight: 700 }));
  parts.push(text(1030, 440, 'UNIQUE(provider_event_id)', { size: 18, fill: C.signal }));
  parts.push(skel(1030, 475, 260, 10), skel(1030, 500, 200, 10, C.skelSoft));
  parts.push(
    `<circle cx="1340" cy="410" r="18" fill="${C.signal}"/><path d="M1331 410l6 7 12-14" fill="none" stroke="${C.bg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  return cover(C.ember, parts.join(''));
}

/** A queue of jobs with one retrying loop. */
function queueCover() {
  const parts = [];
  for (let i = 0; i < 6; i += 1) {
    const x = 220 + i * 190;
    const failed = i === 3;
    parts.push(
      rect(
        x,
        380,
        160,
        140,
        C.raised,
        16,
        `stroke="${failed ? C.amber : i < 3 ? C.signal : C.line}"`,
      ),
    );
    parts.push(skel(x + 24, 418, 90, 12, failed ? C.amber : C.text), skel(x + 24, 446, 110, 9));
    parts.push(rect(x + 24, 478, 60, 20, `${failed ? C.amber : i < 3 ? C.signal : C.dim}33`, 10));
  }
  parts.push(
    `<path d="M940 380 C 940 250, 1180 250, 1180 370" fill="none" stroke="${C.amber}" stroke-width="3" stroke-dasharray="10 9"/>`,
  );
  parts.push(
    `<path d="M1168 356l12 16 12-16" fill="none" stroke="${C.amber}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  );
  parts.push(text(1000, 240, 'retry · backoff', { size: 24, fill: C.amber, weight: 600 }));
  parts.push(`<line x1="200" y1="580" x2="1360" y2="580" stroke="${C.line}" stroke-width="2"/>`);
  parts.push(text(220, 630, 'php artisan queue:work', { size: 26, fill: C.dim }));
  return cover(C.signal, parts.join(''));
}

/** Three gauges: LCP, INP, CLS (no values: an illustration). */
function vitalsCover() {
  const parts = [];
  ['LCP', 'INP', 'CLS'].forEach((label, i) => {
    const cx = 420 + i * 380;
    const cy = 470;
    const r = 130;
    const arc = (from, to, color, width) => {
      const a0 = Math.PI * (1 - from);
      const a1 = Math.PI * (1 - to);
      const p = (a) => `${r2(cx + r * Math.cos(a))} ${r2(cy - r * Math.sin(a))}`;
      return `<path d="M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
    };
    parts.push(arc(0, 1, C.line, 18));
    parts.push(arc(0, 0.55 + i * 0.12, i === 1 ? C.ion : C.signal, 18));
    parts.push(text(cx, cy + 10, label, { size: 44, weight: 700, fill: C.text, anchor: 'middle' }));
    parts.push(skel(cx - 50, cy + 40, 100, 10));
  });
  return cover(C.ion, parts.join(''));
}

const BLOG_OUT = join(root, 'public/images/blog');
await mkdir(BLOG_OUT, { recursive: true });
const BLOG = {
  'sample-idempotent-payment-webhooks': idempotencyCover,
  'sample-laravel-queues-that-recover': queueCover,
  'sample-core-web-vitals-react': vitalsCover,
};
for (const [slug, draw] of Object.entries(BLOG)) {
  await writeFile(join(BLOG_OUT, `${slug}.svg`), draw(), 'utf-8');
}
console.log(`✓ wrote ${Object.keys(BLOG).length} blog covers to public/images/blog/`);
