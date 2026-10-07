// Almacén: Capacitor Preferences cuando existe (principal), localStorage como caché/fallback.
let prefs = null;
try { prefs = globalThis.Capacitor?.Plugins?.Preferences || null; } catch {}

export const storage = {
  async get(k) {
    if (prefs) { try { const { value } = await prefs.get({ key: k }); if (value != null) return value; } catch {} }
    try { return localStorage.getItem(k); } catch { return null; }
  },
  async set(k, v) {
    try { localStorage.setItem(k, v); } catch {}
    if (prefs) { try { await prefs.set({ key: k, value: v }); } catch {} }
  },
  async remove(k) {
    try { localStorage.removeItem(k); } catch {}
    if (prefs) { try { await prefs.remove({ key: k }); } catch {} }
  },
};
