import { useEffect, useRef } from 'react';

import { isScrolling } from '@/lib/scroll-activity';
import { subscribeTheme } from '@/lib/theme';

/**
 * "Ember field": a WebGL fragment shader that replaces the CSS light masses
 * on high-tier devices (lazy chunk, ~3 KB, raw WebGL: no library).
 *
 * Why a shader: large soft gradients band badly on dark backgrounds; the
 * shader dithers them away, warps the light with slow noise so it smoulders
 * instead of sitting still, and adds a faint glow that trails the pointer.
 * It renders at 40% resolution and 20 fps (it is soft by nature), holds its
 * last frame while the page scrolls (the fixed light does not need to move
 * with the content, and the mesh camera has the frame budget then), pauses
 * with the tab, and on context loss hands back to the CSS masses.
 */

const VERTEX = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerA;
uniform vec4 uEmber;
uniform vec4 uIon;
uniform vec3 uEmberCol;
uniform vec3 uIonCol;
uniform vec3 uBg;
uniform float uLight;
uniform float uDay;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + 3.1; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.035;
  vec2 warp = vec2(fbm(p * 1.4 + vec2(t, -t)), fbm(p * 1.4 + vec2(-t, t) + 7.3)) - 0.5;
  vec2 q = p + warp * 0.42;
  float ember = exp(-pow(length(q - vec2(uEmber.x * aspect, uEmber.y)) / uEmber.z, 2.0)) * uEmber.w;
  float ion = exp(-pow(length(q - vec2(uIon.x * aspect, uIon.y)) / uIon.z, 2.0)) * uIon.w;
  float heat = fbm(q * 3.2 + t * 3.0);
  ember *= (0.55 + 0.7 * heat) * (0.75 + 0.35 * uDay);
  ion *= (0.55 + 0.7 * (1.0 - heat)) * (0.75 + 0.35 * (1.0 - uDay));
  float glow = exp(-pow(length(p - vec2(uPointer.x * aspect, uPointer.y)) / 0.3, 2.0)) * uPointerA;
  vec3 dark = uBg + uEmberCol * ember * 0.3 + uIonCol * ion * 0.24 + mix(uEmberCol, uIonCol, 0.5) * glow * 0.06;
  vec3 light = uBg * (1.0 - (1.0 - uEmberCol) * ember * 0.16 - (1.0 - uIonCol) * ion * 0.14 - glow * 0.02);
  vec3 col = mix(dark, light, uLight);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) / 160.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** @param {string} value @returns {[number, number, number]} 0–1 RGB. */
function rgb(value) {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * @param {{
 *   scene: { ember: { x: number, y: number, s: number, a: number }, ion: { x: number, y: number, s: number, a: number } },
 *   onActive: (active: boolean) => void,
 * }} props
 */
export default function AmbientField({ scene, onActive }) {
  const hostRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    // A fresh canvas per run, removed on cleanup. A canvas whose context was
    // lost paints solid WHITE over the page; reusing one after `loseContext()`
    // (React StrictMode re-runs effects on the same element) or keeping one
    // after a real context loss turned the dark theme white.
    const canvas = document.createElement('canvas');
    canvas.className = 'bg-layer__field';
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: 'low-power',
    });
    if (!gl) return undefined;

    const compile = (/** @type {number} */ type, /** @type {string} */ source) => {
      const shader = /** @type {WebGLShader} */ (gl.createShader(type));
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return undefined;
    const program = /** @type {WebGLProgram} */ (gl.createProgram());
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
    gl.useProgram(program);
    host.append(canvas);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    /** @type {Record<string, WebGLUniformLocation | null>} */
    const u = {};
    for (const name of [
      'uRes',
      'uTime',
      'uPointer',
      'uPointerA',
      'uEmber',
      'uIon',
      'uEmberCol',
      'uIonCol',
      'uBg',
      'uLight',
      'uDay',
    ]) {
      u[name] = gl.getUniformLocation(program, name);
    }

    const root = document.documentElement;
    let colors = { ember: rgb('#ff5a36'), ion: rgb('#3ddcff'), bg: rgb('#07080b'), light: 0 };
    const readColors = () => {
      const style = getComputedStyle(root);
      colors = {
        ember: rgb(style.getPropertyValue('--accent')),
        ion: rgb(style.getPropertyValue('--secondary')),
        bg: rgb(style.getPropertyValue('--bg-0')),
        light: root.dataset.theme === 'light' ? 1 : 0,
      };
    };
    readColors();

    const resize = () => {
      const scale = 0.4;
      canvas.width = Math.max(1, Math.round(window.innerWidth * scale));
      canvas.height = Math.max(1, Math.round(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, a: 0, ta: 0 };
    const onMove = (/** @type {PointerEvent} */ event) => {
      pointer.tx = event.clientX / window.innerWidth;
      pointer.ty = event.clientY / window.innerHeight;
      pointer.ta = 1;
    };
    const onLeave = () => (pointer.ta = 0);
    window.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);

    // Current light masses, eased toward the active station's scene.
    const toVec = (/** @type {{ x: number, y: number, s: number, a: number }} */ g) => {
      const x = g.x / 100;
      return [root.dir === 'rtl' ? 1 - x : x, g.y / 100, 0.42 * g.s, g.a];
    };
    let ember = toVec(sceneRef.current.ember);
    let ion = toVec(sceneRef.current.ion);
    const ease = (
      /** @type {number[]} */ from,
      /** @type {number[]} */ to,
      /** @type {number} */ k,
    ) => from.map((v, i) => v + (to[i] - v) * k);

    // Daylight changes every few minutes: read it rarely, not per frame.
    let daylight = 0.5;
    const readDaylight = () => {
      daylight = Number(getComputedStyle(root).getPropertyValue('--daylight')) || 0.5;
    };
    readDaylight();
    const daylightTimer = window.setInterval(readDaylight, 5000);

    let frame = 0;
    let last = 0;
    let lost = false;
    const started = performance.now();
    const render = (/** @type {number} */ now) => {
      last = now;
      ember = ease(ember, toVec(sceneRef.current.ember), 0.035);
      ion = ease(ion, toVec(sceneRef.current.ion), 0.035);
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      pointer.a += (pointer.ta - pointer.a) * 0.05;
      gl.uniform2f(u.uRes, canvas.width, canvas.height);
      gl.uniform1f(u.uTime, (now - started) / 1000);
      gl.uniform2f(u.uPointer, pointer.x, pointer.y);
      gl.uniform1f(u.uPointerA, pointer.a);
      gl.uniform4f(u.uEmber, ember[0], ember[1], ember[2], ember[3]);
      gl.uniform4f(u.uIon, ion[0], ion[1], ion[2], ion[3]);
      gl.uniform3f(u.uEmberCol, ...colors.ember);
      gl.uniform3f(u.uIonCol, ...colors.ion);
      gl.uniform3f(u.uBg, ...colors.bg);
      gl.uniform1f(u.uLight, colors.light);
      gl.uniform1f(u.uDay, daylight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (/** @type {number} */ now) => {
      frame = requestAnimationFrame(loop);
      // ~20 fps is plenty for slow light; scrolling frames go to the content.
      if (now - last >= 50 && !isScrolling()) render(now);
    };
    // Theme switch: new colours and a frame right now, in step with the DOM.
    const offTheme = subscribeTheme(() => {
      readColors();
      if (!lost) render(performance.now());
    });
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !lost) frame = requestAnimationFrame(loop);
    };
    const onLost = (/** @type {Event} */ event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      canvas.remove(); // never leave a dead (white) canvas on screen
      onActive(false);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(loop);
    onActive(true);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(daylightTimer);
      onActive(false);
      offTheme();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onLost);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [onActive]);

  return <div ref={hostRef} className="bg-layer__field-host" />;
}
