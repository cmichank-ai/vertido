import { test } from "node:test"; import assert from "node:assert/strict";
import { weekId, rivals, standings, ensureTournament, levelPoints, prizeFor, activeEvents, coinMultiplier } from "../src/meta/liveops.js";
test("semana ISO y rivales deterministas", () => {
  assert.match(weekId(new Date("2026-10-08")), /^2026-W41$/);
  const a = rivals("2026-W41"), b = rivals("2026-W41"); assert.equal(a.length, 49); assert.deepEqual(a.map(x => x.name), b.map(x => x.name));
  assert.notDeepEqual(rivals("2026-W42").map(x => x.name), a.map(x => x.name));
});
test("tabla con el jugador y puntos", () => {
  const meta = {}; const t = ensureTournament(meta); t.points = 300;
  const rows = standings(meta, new Date("2026-10-08T12:00:00")); assert.equal(rows.length, 50); const me = rows.find(r => r.me); assert.ok(me.rank >= 1 && me.rank <= 50);
  assert.ok(rows.every((r, i) => i === 0 || rows[i - 1].points >= r.points));
});
test("puntos por nivel y premios", () => { assert.equal(levelPoints({ level: 25, eff: true, hard: false }), 17); assert.equal(prizeFor(1), 500); assert.equal(prizeFor(7), 30); assert.equal(prizeFor(20), 0); });
test("eventos por calendario", () => {
  const ev = [{ id: "x", type: "double_coins", from: "2026-10-10", to: "2026-10-12T23:59:59" }];
  assert.equal(activeEvents(ev, new Date("2026-10-11")).length, 1); assert.equal(activeEvents(ev, new Date("2026-10-13")).length, 0);
  assert.equal(coinMultiplier(ev, new Date("2026-10-11")), 2); assert.equal(coinMultiplier(ev, new Date("2026-10-09")), 1);
});
