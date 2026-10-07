// Notificaciones locales (Capacitor LocalNotifications). En web: no-op. Máximo 1 por día: se programa la más relevante.
let ln = null; try { ln = globalThis.Capacitor?.Plugins?.LocalNotifications || null; } catch {}
export const notifications = {
  available: !!ln, granted: false,
  async request() { if (!ln) return false; try { const r = await ln.requestPermissions(); this.granted = r.display === "granted"; return this.granted; } catch { return false; } },
  /** Programa UNA notificación para el próximo disparo; cancela las anteriores. */
  async schedule({ streak, titleStreak, titleChest, titleMissions }) {
    if (!ln || !this.granted) return;
    try { await ln.cancel({ notifications: [{ id: 1 }, { id: 2 }, { id: 3 }] }); } catch {}
    const now = new Date(), at = new Date(now);
    let id = 2, title = titleChest; at.setDate(at.getDate() + 1); at.setHours(10, 0, 0, 0);
    if (streak >= 3) { const s = new Date(now); s.setHours(20, 0, 0, 0); if (s > now) { id = 1; title = titleStreak; at.setTime(s.getTime()); } }
    try { await ln.schedule({ notifications: [{ id, title: "Vertido", body: title, schedule: { at } }] }); } catch {}
  },
};
