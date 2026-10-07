import { CAP, canPour, topRun, solved, key } from "./rules.js";

/**
 * DFS con memo y heurística de orden. Devuelve camino [[i,j],...] o null.
 * La longitud del camino es una COTA SUPERIOR del óptimo real.
 * `limit` acota nodos; `deadline` (ms, performance.now) acota tiempo.
 */
export function solve(tubes, { limit = 60000, deadline = Infinity, cap = CAP } = {}) {
  const seen = new Set();
  let nodes = 0;
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  function rec(s, path) {
    if (solved(s, cap)) return path;
    const k = key(s);
    if (seen.has(k)) return null;
    if (++nodes > limit || (nodes % 256 === 0 && now() > deadline)) return null;
    seen.add(k);
    const moves = [];
    for (let i = 0; i < s.length; i++) {
      if (!s[i].length) continue;
      const { n: run } = topRun(s[i]);
      if (run === s[i].length && s[i].length === cap) continue; // ya resuelto
      for (let j = 0; j < s.length; j++) {
        if (i === j) continue;
        const n = canPour(s[i], s[j], cap);
        if (!n) continue;
        if (!s[j].length && run === s[i].length) continue; // monocolor a vacío: inútil
        if (!s[j].length && n < run) continue;             // parcial a vacío: casi nunca sirve
        const score = n * 2 + (s[j].length ? 3 : 0) + (s[i].length === run ? -1 : 0);
        moves.push([i, j, n, score]);
      }
    }
    moves.sort((a, b) => b[3] - a[3]);
    for (const [i, j, n] of moves) {
      const ns = s.map(t => t.slice());
      const c = ns[i][ns[i].length - 1];
      ns[i].length -= n;
      for (let q = 0; q < n; q++) ns[j].push(c);
      const r = rec(ns, path.concat([[i, j]]));
      if (r) return r;
    }
    return null;
  }
  return rec(tubes, []);
}

/** Pista rápida por heurística cuando el solver no llega a tiempo. */
export function heuristicMove(tubes, cap = CAP) {
  let best = null, bestScore = -Infinity;
  for (let i = 0; i < tubes.length; i++)
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      const n = canPour(tubes[i], tubes[j], cap);
      if (!n) continue;
      const { n: run } = topRun(tubes[i]);
      if (!tubes[j].length && run === tubes[i].length) continue;
      const score = n * 2 + (tubes[j].length ? 3 : 0) + (tubes[j].length + n === cap ? 2 : 0);
      if (score > bestScore) { bestScore = score; best = [i, j]; }
    }
  return best;
}
