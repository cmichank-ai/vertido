import { test } from "node:test"; import assert from "node:assert/strict";
import { defaultMeta, ensureMissions, onLevelComplete, claimMission, dailyAvailable, openDaily, mapChestReward, buyItem, equip } from "../src/meta/meta.js";
test("misiones: progreso y reclamo", () => {
  const m = defaultMeta(); const items = ensureMissions(m, 1); assert.equal(items.length, 3);
  for (let i = 0; i < 10; i++) onLevelComplete(m, { hints: 0, eff: true });
  assert.ok(items.every(x => x.p === x.n)); assert.ok(claimMission(m, "solve") > 0); assert.equal(claimMission(m, "solve"), 0);
  assert.deepEqual(ensureMissions(m, 1), items, "mismo día no regenera");
});
test("cofre diario una vez por día y racha", () => {
  const m = defaultMeta(); assert.ok(dailyAvailable(m)); assert.equal(openDaily(m, 50, false), 50); assert.ok(!dailyAvailable(m)); assert.equal(openDaily(m, 50, true), 0); assert.equal(m.daily.run, 1);
});
test("cofres del mapa cada 10 niveles, una vez", () => {
  const m = defaultMeta(); assert.equal(mapChestReward(m, 5), 0); assert.equal(mapChestReward(m, 11), 125); assert.equal(mapChestReward(m, 11), 0); assert.equal(mapChestReward(m, 21), 150);
});
test("colección: comprar y poner", () => {
  const m = defaultMeta(); assert.equal(buyItem(m, "tube", "frost", 100), -1); assert.equal(buyItem(m, "tube", "frost", 200), 150); assert.equal(buyItem(m, "tube", "frost", 999), -1);
  assert.ok(equip(m, "tube", "frost")); assert.ok(!equip(m, "tube", "gold")); assert.equal(m.equipped.tube, "frost");
});
