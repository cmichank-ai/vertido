import { test } from "node:test"; import assert from "node:assert/strict";
import { loadConfig, DEFAULTS, merge } from "../src/platform/config.js";
const mem = () => { const m = new Map(); return { get: async k => m.get(k) ?? null, set: async (k, v) => m.set(k, v) }; };
test("sin red → defaults", async () => { const c = await loadConfig(mem(), { version: "0.1.0", fetchFn: async () => { throw new Error("offline"); } }); assert.deepEqual(c, DEFAULTS); });
test("config corrupta → defaults", async () => { const s = mem(); await s.set("vertido.config", "{{{"); const c = await loadConfig(s, { version: "0.1.0", fetchFn: async () => ({ ok: false }) }); assert.deepEqual(c, DEFAULTS); });
test("config parcial se funde", async () => { const c = await loadConfig(mem(), { version: "0.1.0", fetchFn: async () => ({ ok: true, json: async () => ({ economy: { hint_cost: 25 } }) }) }); assert.equal(c.economy.hint_cost, 25); assert.equal(c.economy.coins_per_level, 10); });
test("merge arrays reemplaza", () => { assert.deepEqual(merge({ a: [1] }, { a: [2, 3] }).a, [2, 3]); });
