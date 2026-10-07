// Web Worker: generación, validación y pistas fuera del hilo de UI.
import { generate } from "./generator.js";
import { solve, heuristicMove } from "./solver.js";

self.onmessage = e => {
  const { id, type, payload } = e.data;
  try {
    if (type === "generate") {
      self.postMessage({ id, ok: true, result: generate(payload.level, payload.opts) });
    } else if (type === "hint") {
      const deadline = performance.now() + (payload.budgetMs ?? 150);
      const sol = solve(payload.tubes, { limit: 80000, deadline });
      const move = sol ? sol[0] : heuristicMove(payload.tubes);
      self.postMessage({ id, ok: true, result: { move, exact: !!sol } });
    } else {
      self.postMessage({ id, ok: false, error: "unknown type " + type });
    }
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err) });
  }
};
