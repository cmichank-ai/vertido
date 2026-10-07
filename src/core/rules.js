// Reglas puras del sort puzzle. Sin DOM, sin estado global.
export const CAP = 4;

export function topRun(t) {
  if (!t.length) return { c: null, n: 0 };
  const c = t[t.length - 1];
  let n = 0;
  for (let i = t.length - 1; i >= 0 && t[i] === c; i--) n++;
  return { c, n };
}

/** Cuántos segmentos se pueden verter de a → b (0 = movimiento inválido). */
export function canPour(a, b, cap = CAP) {
  if (!a.length || b.length >= cap) return 0;
  const { c, n } = topRun(a);
  if (b.length && b[b.length - 1] !== c) return 0;
  return Math.min(n, cap - b.length);
}

/** Devuelve un nuevo estado con el vertido aplicado; null si inválido. */
export function pour(tubes, i, j, cap = CAP) {
  if (i === j) return null;
  const n = canPour(tubes[i], tubes[j], cap);
  if (!n) return null;
  const ns = tubes.map(t => t.slice());
  const c = ns[i][ns[i].length - 1];
  ns[i].length -= n;
  for (let q = 0; q < n; q++) ns[j].push(c);
  return ns;
}

export function tubeDone(t, cap = CAP) {
  return t.length === cap && t.every(x => x === t[0]);
}

export function solved(tubes, cap = CAP) {
  return tubes.every(t => !t.length || tubeDone(t, cap));
}

/** Clave canónica (independiente del orden de frascos) para memoización. */
export function key(tubes) {
  return tubes.map(t => t.join(",")).sort().join("|");
}

/** Lista de movimientos válidos [i, j, n]. */
export function validMoves(tubes, cap = CAP) {
  const out = [];
  for (let i = 0; i < tubes.length; i++)
    for (let j = 0; j < tubes.length; j++) {
      if (i === j) continue;
      const n = canPour(tubes[i], tubes[j], cap);
      if (n) out.push([i, j, n]);
    }
  return out;
}

/** Sin salida: ningún movimiento válido y no resuelto. */
export function stuck(tubes, cap = CAP) {
  return !solved(tubes, cap) && validMoves(tubes, cap).length === 0;
}
