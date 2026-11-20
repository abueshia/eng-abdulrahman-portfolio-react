/**
 * Web Audio synthesiser for interface sound (lazy chunk, see `sfx.js`).
 *
 * Every sound is generated from oscillators and filtered noise: tiny, tunable
 * and with no audio files. Levels are deliberately low; this is texture, not
 * a soundtrack. A faint two-oscillator hum runs while sound is on, so the
 * "system" feels powered.
 *
 * @typedef {{ play: (name: import('./sfx').SoundName) => void, setEnabled: (on: boolean) => void }} SoundEngine
 */

/** @returns {SoundEngine} */
export function createSoundEngine() {
  const AudioCtx = window.AudioContext ?? /** @type {any} */ (window).webkitAudioContext;
  if (!AudioCtx) return { play() {}, setEnabled() {} };

  const ctx = /** @type {AudioContext} */ (new AudioCtx());
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);

  // One second of white noise, reused by every noisy sound.
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const channel = noise.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) channel[i] = Math.random() * 2 - 1;

  /** @type {{ stop: () => void } | null} */
  let hum = null;

  // Browsers keep the context suspended until a user gesture.
  const resume = () => {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  };
  window.addEventListener('pointerdown', resume, { passive: true });
  window.addEventListener('keydown', resume);

  /**
   * @param {OscillatorType} type
   * @param {number} from Start frequency (Hz).
   * @param {number} to   End frequency (Hz).
   * @param {number} duration Seconds.
   * @param {number} level Peak gain.
   * @param {number} [delay=0]
   */
  function tone(type, from, to, duration, level, delay = 0) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + Math.min(0.012, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  /**
   * @param {BiquadFilterType} filterType
   * @param {number} from Filter frequency start.
   * @param {number} to   Filter frequency end.
   * @param {number} duration
   * @param {number} level
   */
  function hiss(filterType, from, to, duration, level) {
    const t = ctx.currentTime;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = noise;
    filter.type = filterType;
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start(t);
    source.stop(t + duration + 0.05);
  }

  function startHum() {
    if (hum) return;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 1.5);
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    a.frequency.value = 55;
    b.frequency.value = 110.6; // detuned octave: a slow, living beat
    a.connect(gain);
    b.connect(gain);
    gain.connect(master);
    a.start();
    b.start();
    hum = {
      stop() {
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        a.stop(ctx.currentTime + 0.7);
        b.stop(ctx.currentTime + 0.7);
      },
    };
  }

  /** @type {Record<import('./sfx').SoundName, () => void>} */
  const sounds = {
    tick: () => hiss('bandpass', 4200, 3800, 0.03, 0.18),
    hover: () => tone('sine', 1400, 1600, 0.05, 0.05),
    blip: () => tone('triangle', 880, 1320, 0.08, 0.12),
    packet: () => tone('sine', 2200, 2900, 0.06, 0.05),
    whoosh: () => hiss('lowpass', 300, 3200, 0.7, 0.22),
    success: () => {
      tone('sine', 660, 660, 0.18, 0.12);
      tone('sine', 990, 990, 0.26, 0.1, 0.08);
    },
    down: () => {
      tone('sawtooth', 220, 48, 1.2, 0.12);
      hiss('lowpass', 2400, 120, 1.1, 0.16);
    },
    up: () => {
      [440, 554, 659, 880].forEach((freq, i) => tone('triangle', freq, freq, 0.16, 0.1, i * 0.07));
    },
  };

  return {
    play(name) {
      resume();
      if (ctx.state !== 'running') return;
      sounds[name]?.();
    },
    setEnabled(on) {
      resume();
      if (on) startHum();
      else {
        hum?.stop();
        hum = null;
      }
    },
  };
}
