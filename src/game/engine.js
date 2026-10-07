// Puente al Web Worker con promesas y precarga de niveles.
export class Engine {
  constructor(workerUrl) {
    this.w = new Worker(workerUrl, { type: "module" });
    this.pending = new Map(); this.id = 0; this.cache = new Map();
    this.w.onmessage = e => { const p = this.pending.get(e.data.id); if (!p) return; this.pending.delete(e.data.id); e.data.ok ? p.res(e.data.result) : p.rej(new Error(e.data.error)); };
  }
  call(type, payload) { const id = ++this.id; return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.w.postMessage({ id, type, payload }); }); }
  level(n, opts) {
    if (!this.cache.has(n)) this.cache.set(n, this.call("generate", { level: n, opts }));
    for (let k = 1; k <= 3; k++) if (!this.cache.has(n + k)) this.cache.set(n + k, this.call("generate", { level: n + k, opts }));
    return this.cache.get(n);
  }
  hint(tubes, budgetMs = 150) { return this.call("hint", { tubes, budgetMs }); }
}
