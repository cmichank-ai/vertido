import { native } from "./native.js";
const ln = native.LocalNotifications || null;
export const notifications = {
  available: !!ln, granted: false,
  async request() { if (!ln) return false; try { const r = await ln.requestPermissions(); this.granted = r.display === "granted"; return this.granted; } catch { return false; } },
  /** Programa UNA notificación (la más relevante); cancela las anteriores. Máximo 1 por día. */
  async schedule({ streak, titleStreak, titleChest }) {
    if (!ln || !this.granted) return;
    try { await ln.cancel({ notifications: [{ id: 1 }, { id: 2 }] }); } catch {}
    const now = new Date(), at = new Date(now);
    let id = 2, body = titleChest; at.setDate(at.getDate() + 1); at.setHours(10, 0, 0, 0);
    if (streak >= 3) { const s = new Date(now); s.setHours(20, 0, 0, 0); if (s > now) { id = 1; body = titleStreak; at.setTime(s.getTime()); } }
    try { await ln.schedule({ notifications: [{ id, title: "Vertido", body, schedule: { at } }] }); } catch {}
  },
};
