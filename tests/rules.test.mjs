import { test } from "node:test"; import assert from "node:assert/strict";
import { canPour, pour, solved, stuck, key, validMoves } from "../src/core/rules.js";
test("canPour básicos", () => {
  assert.equal(canPour([0,0,1], []), 1);
  assert.equal(canPour([0,1,1], [1]), 2);
  assert.equal(canPour([0,1,1], [1,1,1]), 1);
  assert.equal(canPour([0,1,1], [1,1,1,1]), 0);
  assert.equal(canPour([0,1], [2]), 0);
  assert.equal(canPour([], [1]), 0);
});
test("pour no muta y aplica", () => {
  const t = [[0,1,1],[1]]; const n = pour(t, 0, 1);
  assert.deepEqual(n, [[0],[1,1,1]]); assert.deepEqual(t, [[0,1,1],[1]]);
  assert.equal(pour(t, 0, 0), null); assert.deepEqual(pour(t, 1, 0), [[0,1,1,1],[]]); assert.equal(pour([[0,1,1],[2]], 1, 0), null);
});
test("solved / stuck / key", () => {
  assert.ok(solved([[0,0,0,0],[],[1,1,1,1]]));
  assert.ok(!solved([[0,0,0,1],[1,1,1,0]]));
  assert.ok(stuck([[0,0,0,1],[1,1,1,0]]));
  assert.ok(!stuck([[0,0,0,1],[1,1,1,0],[]]));
  assert.equal(key([[1],[0,0]]), key([[0,0],[1]]));
  assert.equal(validMoves([[0,1],[1],[]]).length, 4);
});
