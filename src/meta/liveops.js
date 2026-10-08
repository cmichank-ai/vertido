// Live ops: torneo semanal y eventos por calendario (config remota). Sin servidor: rivales deterministas por semana
// (práctica estándar en hybrid-casual); cuando exista backend, `rivals` se reemplaza por jugadores reales del grupo.
import { rng } from "../core/generator.js";

export function weekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${String(Math.ceil(((t - y0) / 86400000 + 1) / 7)).padStart(2, "0")}`;
}
export function weekEndsAt(d = new Date()) { const e = new Date(d); const day = e.getDay() || 7; e.setDate(e.getDate() + (7 - day)); e.setHours(23, 59, 59, 0); return e; }

const NAMES = ["Lucía", "Mateo", "Sofía", "Diego", "Valentina", "Santi", "Camila", "Andrés", "Isabella", "Nico", "Renata", "Emilio", "Regina", "Leo", "Ximena", "Bruno", "Dani", "Fer", "Paula", "Iván", "Marta", "Hugo", "Elena", "Pablo", "Noa", "Alex", "Mía", "Max", "Ana", "Jorge", "Luna", "Omar", "Cata", "Tomás", "Vale", "Rafa", "Eva", "Gael", "Zoe", "Iker", "Lola", "Kai", "Nina", "Mario", "Sara", "Teo", "Abril", "Joel", "Ari"];

/** Rivales del grupo semanal: 49 perfiles con ritmo propio; sus puntos crecen con el tiempo de la semana. */
export function rivals(week, seed = 0) {
  const r = rng(hash(week) + seed);
  return Array.from({ length: 49 }, (_, i) => ({ id: "r" + i, name: NAMES[Math.floor(r() * NAMES.length)] + " " + String.fromCharCode(65 + Math.floor(r() * 26)) + ".", pace: 40 + Math.pow(r(), 2) * 900, jitter: r() }));
}
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rivalPoints(rv, week, now = new Date()) {
  const start = new Date(weekEndsAt(now)); start.setDate(start.getDate() - 7); start.setHours(0, 0, 0, 0);
  const frac = Math.min(1, Math.max(0, (now - start) / (7 * 86400000)));
  const curve = Math.pow(frac, 0.8 + rv.jitter * 0.6);
  return Math.round(rv.pace * curve);
}
/** Puntos por nivel resuelto: base + bono de eficiencia + nivel duro. */
export function levelPoints({ level, eff, hard }) { return 10 + Math.floor(level / 10) + (eff ? 5 : 0) + (hard ? 10 : 0); }

export function ensureTournament(meta) {
  const w = weekId();
  if (!meta.tournament || meta.tournament.week !== w) meta.tournament = { week: w, points: 0, claimed: false, prev: meta.tournament?.week ? { week: meta.tournament.week, points: meta.tournament.points, claimed: meta.tournament.claimed } : null };
  return meta.tournament;
}
export function standings(meta, now = new Date()) {
  const t = ensureTournament(meta); const week = t.week;
  const rows = rivals(week).map(rv => ({ id: rv.id, name: rv.name, points: rivalPoints(rv, week, now) }));
  rows.push({ id: "me", name: null, points: t.points, me: true });
  rows.sort((a, b) => b.points - a.points);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
export const PRIZES = [500, 250, 100];
export function prizeFor(rank, prizes = PRIZES) { return rank >= 1 && rank <= prizes.length ? prizes[rank - 1] : rank <= 10 ? 30 : 0; }

/** Eventos activos según calendario de config: [{ id, type, from, to, multiplier }]. */
export function activeEvents(events = [], now = new Date()) {
  return (events || []).filter(e => { const f = e.from ? new Date(e.from) : null, t = e.to ? new Date(e.to) : null; return (!f || now >= f) && (!t || now <= t); });
}
export function coinMultiplier(events, now) { return activeEvents(events, now).filter(e => e.type === "double_coins").reduce((m, e) => Math.max(m, e.multiplier || 2), 1); }
