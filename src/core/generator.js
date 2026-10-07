import { CAP, tubeDone } from "./rules.js";
import { solve } from "./solver.js";

/** RNG determinista xorshift32 en [0,1). */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

export const DEFAULT_CURVE = [
  { max: 2, colors: 3 }, { max: 5, colors: 4 }, { max: 9, colors: 5 }, { max: 15, colors: 6 },
  { max: 23, colors: 7 }, { max: 35, colors: 8 }, { max: 49, colors: 9 }, { max: Infinity, colors: 10 },
];

/** Parámetros por nivel. Tope de 10 colores; dificultad alta por modificadores. */
export function params(n, curve = DEFAULT_CURVE) {
  const tier = curve.find(t => n <= t.max) || curve[curve.length - 1];
  const hard = n >= 20 && n % 7 === 0;
  return {
    colors: Math.min(hard ? 9 : 10, tier.colors),
    empties: hard ? 1 : 2,
    hidden: n >= 50 ? Math.min(3, Math.floor((n - 50) / 15) + 1) : 0,
    hard,
  };
}

/**
 * Genera el nivel n: { level, tubes, par, params, hiddenTubes }. Siempre soluble.
 * Determinista: mismo n y misma curva = mismo puzzle.
 */
export function generate(n, { curve = DEFAULT_CURVE, limit = 40000 } = {}) {
  const p = params(n, curve);
  let r = rng(n * 7919 + 13), tries = 0;
  for (;;) {
    tries++;
    const bag = [];
    for (let c = 0; c < p.colors; c++) for (let q = 0; q < CAP; q++) bag.push(c);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    const tubes = [];
    for (let c = 0; c < p.colors; c++) tubes.push(bag.slice(c * CAP, c * CAP + CAP));
    if (tubes.some(t => tubeDone(t))) continue;
    for (let e = 0; e < p.empties; e++) tubes.push([]);
    const sol = solve(tubes, { limit });
    if (sol && sol.length >= p.colors + 1) {
      return { level: n, tubes, par: sol.length, params: p, hiddenTubes: pickHidden(p.colors, p.hidden, r) };
    }
    if (tries > 60) r = rng(n * 31 + tries);
  }
}

function pickHidden(count, k, r) {
  const idx = Array.from({ length: count }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, k);
}
