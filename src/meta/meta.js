// Capa de meta: misiones diarias, cofre diario, cofres del mapa, colección, pack de inicio. Estado serializable.
export const TUBE_STYLES = [
  { id: "glass", name: "Vidrio", cost: 0 }, { id: "frost", name: "Escarcha", cost: 150 }, { id: "amber", name: "Ámbar", cost: 200 }, { id: "neon", name: "Neón", cost: 300 },
  { id: "rose", name: "Rosa", cost: 300 }, { id: "ink", name: "Tinta", cost: 350 }, { id: "mint", name: "Menta", cost: 400 }, { id: "gold", name: "Oro", cost: 600 },
  { id: "crystal", name: "Cristal", cost: 800 }, { id: "lava", name: "Lava", cost: 900 }, { id: "ocean", name: "Océano", cost: 900 }, { id: "starter", name: "Prisma", cost: null },
];
export const BACKGROUNDS = [
  { id: "indigo", name: "Índigo", cost: 0 }, { id: "plum", name: "Ciruela", cost: 250 }, { id: "forest", name: "Bosque", cost: 250 }, { id: "sunset", name: "Atardecer", cost: 400 },
  { id: "slate", name: "Pizarra", cost: 400 }, { id: "night", name: "Noche", cost: 600 },
];
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };

export function defaultMeta() {
  return { missions: { date: null, items: [] }, daily: { last: null, run: 0 }, mapChests: [], owned: { tubes: ["glass"], bgs: ["indigo"] }, equipped: { tube: "glass", bg: "indigo" }, starter: { shownAt: null, bought: false }, noAds: false, best: {} };
}

/** Misiones del día; se regeneran al cambiar la fecha. Dificultad escala con el nivel. */
export function ensureMissions(meta, level) {
  if (meta.missions.date === today()) return meta.missions.items;
  const k = level < 20 ? 1 : level < 60 ? 2 : 3;
  meta.missions = { date: today(), items: [
    { id: "solve", key: "mSolve", n: 3 + k * 2, p: 0, reward: 40 + k * 20, claimed: false },
    { id: "nohint", key: "mNoHint", n: 2 + k, p: 0, reward: 50 + k * 20, claimed: false },
    { id: "eff", key: "mEff", n: 1 + k, p: 0, reward: 60 + k * 20, claimed: false },
  ] };
  return meta.missions.items;
}
export function onLevelComplete(meta, { hints, eff }) {
  for (const m of meta.missions.items) {
    if (m.id === "solve") m.p++;
    if (m.id === "nohint" && hints === 0) m.p++;
    if (m.id === "eff" && eff) m.p++;
    m.p = Math.min(m.p, m.n);
  }
}
export function claimMission(meta, id) { const m = meta.missions.items.find(x => x.id === id); if (!m || m.claimed || m.p < m.n) return 0; m.claimed = true; return m.reward; }

export function dailyAvailable(meta) { return meta.daily.last !== today(); }
export function openDaily(meta, base, doubled) {
  if (!dailyAvailable(meta)) return 0;
  meta.daily.run = meta.daily.last === yesterday() ? meta.daily.run + 1 : 1; meta.daily.last = today();
  const bonus = meta.daily.run >= 7 ? 50 : 0;
  return (doubled ? base * 2 : base) + bonus;
}

/** Cofre del mapa cada 10 niveles alcanzados (al llegar al nivel 11, 21, …). */
export function mapChestReward(meta, levelReached) {
  if (levelReached % 10 !== 1 || levelReached < 11) return 0;
  const idx = (levelReached - 1) / 10; if (meta.mapChests.includes(idx)) return 0;
  meta.mapChests.push(idx); return 100 + idx * 25;
}

export function buyItem(meta, kind, id, coins) {
  const list = kind === "tube" ? TUBE_STYLES : BACKGROUNDS; const item = list.find(i => i.id === id);
  const bag = kind === "tube" ? meta.owned.tubes : meta.owned.bgs;
  if (!item || item.cost == null || bag.includes(id) || coins < item.cost) return -1;
  bag.push(id); return item.cost;
}
export function equip(meta, kind, id) { const bag = kind === "tube" ? meta.owned.tubes : meta.owned.bgs; if (!bag.includes(id)) return false; meta.equipped[kind === "tube" ? "tube" : "bg"] = id; return true; }

export function starterActive(meta, level, shopFrom) {
  if (meta.starter.bought || level < shopFrom) return false;
  if (!meta.starter.shownAt) meta.starter.shownAt = Date.now();
  return Date.now() - meta.starter.shownAt < 86400_000;
}
