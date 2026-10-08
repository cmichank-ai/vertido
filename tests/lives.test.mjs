import { test } from "node:test"; import assert from "node:assert/strict";
import { livesState, nextLifeIn, loseLife, addLives, moveLimit } from "../src/meta/lives.js";
const cfg = { max: 5, regen_minutes: 30 };
test("vidas: perder, regenerar, tope", () => {
  const m = {}; const t0 = 1_000_000;
  assert.equal(livesState(m, cfg, t0).n, 5); assert.ok(loseLife(m, cfg, t0)); assert.ok(loseLife(m, cfg, t0)); assert.equal(m.lives.n, 3);
  assert.equal(nextLifeIn(m, cfg, t0), 30 * 60000);
  assert.equal(livesState(m, cfg, t0 + 61 * 60000).n, 5, "dos vidas tras 61 min, tope 5");
  for (let i = 0; i < 5; i++) loseLife(m, cfg, t0 + 61 * 60000); assert.equal(m.lives.n, 0); assert.ok(!loseLife(m, cfg, t0 + 61 * 60000));
  assert.equal(addLives(m, cfg, 9, t0 + 61 * 60000), 5);
});
test("límite de movimientos", () => { const m = { slack_early: 6, slack_mid: 3, slack_late: 1 }; assert.equal(moveLimit(10, 1, m), 16); assert.equal(moveLimit(20, 20, m), 23); assert.equal(moveLimit(30, 50, m), 31); });
