// Sincronización en nube (Supabase). Se activa solo si config.backend.supabase_url/anon_key existen. Último updated_at gana.
let sb = null, uid = null;
export const cloud = {
  enabled: false,
  async init(backend) {
    if (!backend?.supabase_url || !backend?.anon_key) return;
    try {
      const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm");
      sb = createClient(backend.supabase_url, backend.anon_key);
      let { data } = await sb.auth.getSession();
      if (!data?.session) { const r = await sb.auth.signInAnonymously(); data = r.data; }
      uid = data?.session?.user?.id || null; this.enabled = !!uid;
      if (uid) await sb.from("vertido.players").upsert({ id: uid, platform: navigator.userAgent.includes("Android") ? "android" : /iPhone|iPad/.test(navigator.userAgent) ? "ios" : "web", app_version: backend.app_version || "" }, { onConflict: "id" });
    } catch { this.enabled = false; }
  },
  async pull() { if (!this.enabled) return null; try { const { data } = await sb.from("vertido.progress").select("*").eq("player_id", uid).maybeSingle(); return data; } catch { return null; } },
  async push(p) { if (!this.enabled) return; try { await sb.from("vertido.progress").upsert({ player_id: uid, ...p, updated_at: new Date().toISOString() }); } catch {} },
  async submitScore(week, points) { if (!this.enabled) return; try { await sb.functions.invoke("submit_score", { body: { week, points } }); } catch {} },
  async leaderboard(week) { if (!this.enabled) return null; try { const { data } = await sb.from("vertido.leaderboard_weekly").select("player_id,points").eq("week", week).order("points", { ascending: false }).limit(50); return data; } catch { return null; } },
};
