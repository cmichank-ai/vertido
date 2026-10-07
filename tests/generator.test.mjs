import { test } from "node:test"; import assert from "node:assert/strict";
import { generate, params } from "../src/core/generator.js";
import { tubeDone } from "../src/core/rules.js";
const N = +(process.env.GEN_LEVELS || 500);
test(`niveles 1–${N}: solubles, deterministas, rápidos`, () => {
  let maxMs = 0, sum = 0;
  for (let n = 1; n <= N; n++) {
    const t0 = Date.now(); const g = generate(n); const ms = Date.now() - t0; sum += ms; maxMs = Math.max(maxMs, ms);
    assert.ok(g.par >= g.params.colors + 1, `nivel ${n} trivial`);
    assert.ok(!g.tubes.some(t => tubeDone(t)), `nivel ${n} nace resuelto`);
    assert.equal(g.tubes.filter(t => !t.length).length, g.params.empties);
    assert.ok(g.params.colors <= 10);
    assert.deepEqual(generate(n).tubes, g.tubes, `nivel ${n} no determinista`);
    assert.ok(ms < 1500, `nivel ${n} tardó ${ms} ms`);
  }
  console.log(`generación: media ${(sum / N).toFixed(1)} ms, máx ${maxMs} ms`);
  assert.ok(sum / N < 50);
});
test("curva", () => { assert.equal(params(1).colors, 3); assert.equal(params(42).empties, 1); assert.equal(params(200).colors, 10); assert.equal(params(80).hidden, 3); });
