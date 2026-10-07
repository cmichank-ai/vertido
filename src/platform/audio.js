// Sonidos sintetizados con Web Audio: cero archivos, cero latencia de carga.
let ctx = null, enabled = true;
const ac = () => { if (!ctx) { try { ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); } catch {} } if (ctx?.state === "suspended") ctx.resume(); return ctx; };
function tone(freq, { type = "sine", dur = 0.12, gain = 0.18, at = 0, slide = 0 } = {}) {
  const c = ac(); if (!c || !enabled) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
export const audio = {
  setEnabled(v) { enabled = v; },
  unlock() { ac(); },
  select(h = 0) { tone(600 + h * 60, { type: "triangle", dur: 0.06, gain: 0.12 }); },
  pour(n = 1) { for (let i = 0; i < n; i++) tone(180 + i * 25, { type: "sine", dur: 0.11, gain: 0.14, at: i * 0.09, slide: 90 }); },
  invalid() { tone(140, { type: "square", dur: 0.08, gain: 0.08, slide: -40 }); },
  tubeDone(color = 0) { const f = PENTA[color % PENTA.length]; tone(f, { type: "sine", dur: 0.35, gain: 0.16 }); tone(f * 2, { type: "sine", dur: 0.25, gain: 0.06, at: 0.02 }); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: "triangle", dur: 0.28, gain: 0.14, at: i * 0.09 })); },
  coin(i = 0) { tone(1400 + (i % 3) * 120, { type: "square", dur: 0.05, gain: 0.05, at: i * 0.04 }); },
  chest() { [880, 1175, 1480].forEach((f, i) => tone(f, { type: "sine", dur: 0.3, gain: 0.1, at: i * 0.06 })); },
};
