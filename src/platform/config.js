// Config remota con valores embebidos. Nunca bloquea el arranque.
export const DEFAULTS = {
  config_version: 1,
  min_version: "0.1.0",
  maintenance: false,
  economy: {
    coins_per_level: 10, efficiency_bonus: 15, free_undos: 3,
    hint_cost: 20, extra_tube_cost: 30, daily_chest: 50, daily_chest_ad: 100,
    streak_chests: { 3: 30, 5: 60, 10: 150 },
  },
  ads: {
    interstitial_from_level: 10, interstitial_every_levels: 3, interstitial_min_seconds: 120,
    banner_from_level: 16, app_open_from_level: 16, app_open_after_hours: 4, app_open_max_per_day: 2,
    rewarded_hints_per_day: 3, first_interstitial_min_play_seconds: 480,
    ids: null, // { android: {rewarded, interstitial, banner}, ios: {...} } — IDs reales solo por config del build de tienda
  },
  iap: { keys: null }, // { ios: "appl_...", android: "goog_..." }
  features: { missions_from_level: 6, shop_from_level: 16, events_from_level: 24, streak_from_level: 3 },
  difficulty: { curve: null }, // null = DEFAULT_CURVE del generador
  events: [],
  experiments: {},
};

const ENDPOINT = "https://config.vertido.app/config"; // Cloudflare Worker
const KEY = "vertido.config";

export async function loadConfig(storage, { version, country, bucket, fetchFn = globalThis.fetch }) {
  let cached = null;
  try { cached = JSON.parse((await storage.get(KEY)) || "null"); } catch {}
  const base = merge(DEFAULTS, cached?.data || {});
  if (cached && Date.now() - cached.at < 3600_000) return base;
  try {
    const u = `${ENDPOINT}?v=${encodeURIComponent(version)}&c=${country || ""}&b=${bucket ?? 0}`;
    const res = await fetchFn(u, { signal: AbortSignal.timeout?.(4000) });
    if (!res.ok) return base;
    const data = await res.json();
    await storage.set(KEY, JSON.stringify({ at: Date.now(), data }));
    return merge(DEFAULTS, data);
  } catch { return base; }
}

export function merge(a, b) {
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || typeof b !== "object" || !a || !b) return b ?? a;
  const out = { ...a };
  for (const k of Object.keys(b)) out[k] = merge(a[k], b[k]);
  return out;
}
