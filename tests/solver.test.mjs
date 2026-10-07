import { test } from "node:test"; import assert from "node:assert/strict";
import { solve, heuristicMove } from "../src/core/solver.js";
import { pour, solved } from "../src/core/rules.js";
test("solver resuelve y el camino es válido", () => {
  const t = [[0,1,0,1],[1,0,1,0],[],[]];
  const sol = solve(t); assert.ok(sol);
  let s = t; for (const [i,j] of sol) { s = pour(s, i, j); assert.ok(s, "movimiento inválido en el camino"); }
  assert.ok(solved(s));
});
test("solver detecta imposible", () => { assert.equal(solve([[0,0,0,1],[1,1,1,0]]), null); });
test("solver respeta deadline", () => {
  const t = [[0,1,2,3],[4,5,6,7],[8,9,0,1],[2,3,4,5],[6,7,8,9],[0,1,2,3],[4,5,6,7],[8,9,0,1],[2,3,4,5],[6,7,8,9],[]];
  const r = solve(t, { deadline: (globalThis.performance?.now() ?? Date.now()) - 1 });
  assert.equal(r, null);
});
test("heurística devuelve movimiento válido", () => { const m = heuristicMove([[0,1],[1],[]]); assert.ok(m); assert.ok(pour([[0,1],[1],[]], m[0], m[1])); });
