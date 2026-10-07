// Cloudflare Worker: remote config de Vertido. KV binding: CONFIG.
export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname !== "/config") return new Response("not found", { status: 404 });
    const v = u.searchParams.get("v") || "0";
    const c = (u.searchParams.get("c") || "").toUpperCase();
    const b = Number(u.searchParams.get("b") || 0);
    const base = JSON.parse((await env.CONFIG.get("base")) || "{}");
    const country = c ? JSON.parse((await env.CONFIG.get("country:" + c)) || "{}") : {};
    const exps = JSON.parse((await env.CONFIG.get("experiments")) || "[]");
    const experiments = {};
    for (const e of exps) { if (!e.active) continue; const i = Math.floor((b % 100) / (100 / e.variants.length)); experiments[e.name] = e.variants[Math.min(i, e.variants.length - 1)]; }
    const body = JSON.stringify({ ...base, ...country, experiments, served_for: { v, c, b } });
    return new Response(body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600", "access-control-allow-origin": "*" } });
  },
};
