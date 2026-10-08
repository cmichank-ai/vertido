// Vidas estilo Candy Crush: máximo N, se regenera 1 cada `regen_minutes`, se pierde al fallar un nivel.
export function livesState(meta, cfg, now = Date.now()) {
  const L = meta.lives || (meta.lives = { n: cfg.max, at: now });
  if (L.n < cfg.max) {
    const gained = Math.floor((now - L.at) / (cfg.regen_minutes * 60000));
    if (gained > 0) { L.n = Math.min(cfg.max, L.n + gained); L.at = L.n >= cfg.max ? now : L.at + gained * cfg.regen_minutes * 60000; }
  } else L.at = now;
  return L;
}
export function nextLifeIn(meta, cfg, now = Date.now()) { const L = livesState(meta, cfg, now); return L.n >= cfg.max ? 0 : Math.max(0, L.at + cfg.regen_minutes * 60000 - now); }
export function loseLife(meta, cfg, now = Date.now()) { const L = livesState(meta, cfg, now); if (L.n <= 0) return false; if (L.n === cfg.max) L.at = now; L.n--; return true; }
export function addLives(meta, cfg, k, now = Date.now()) { const L = livesState(meta, cfg, now); L.n = Math.min(cfg.max, L.n + k); if (L.n >= cfg.max) L.at = now; return L.n; }
/** Límite de movimientos: par del solver + holgura decreciente con el nivel. */
export function moveLimit(par, level, m) { const slack = level <= 5 ? m.slack_early : level <= 30 ? m.slack_mid : m.slack_late; return par + slack; }
