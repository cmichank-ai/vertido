import { CAP, canPour, pour, solved, stuck, tubeDone } from "../core/rules.js";
import { Engine } from "./engine.js";
import { storage } from "../platform/storage.js";
import { loadConfig } from "../platform/config.js";
import { track } from "../platform/analytics.js";
import { ads } from "../platform/ads.js";
import { haptics } from "../platform/haptics.js";

const APP_VERSION = "0.1.0";
const $ = id => document.getElementById(id);
const board = $("board");
const engine = new Engine(new URL("../core/worker.js", import.meta.url));

let cfg, level = 1, coins = 0, streak = 0, playSeconds = 0, lastInterstitialAt = 0, levelsSinceAd = 0, hintAdsToday = 0;
let tubes = [], history = [], sel = -1, undos = 3, extraUsed = false, par = 0, moves = 0, hiddenTubes = [], revealed = new Set(), busy = false;

const S = { async load() {
  level = +(await storage.get("vertido.level")) || 1; coins = +(await storage.get("vertido.coins")) || 0; streak = +(await storage.get("vertido.streak")) || 0;
}, async save() {
  await storage.set("vertido.level", String(level)); await storage.set("vertido.coins", String(coins)); await storage.set("vertido.streak", String(streak));
} };

async function boot() {
  await S.load();
  cfg = await loadConfig(storage, { version: APP_VERSION, country: navigator.language?.split("-")[1], bucket: 0 });
  await ads.init();
  setInterval(() => { if (!document.hidden) playSeconds++; }, 1000);
  await load();
}

async function load() {
  busy = true; board.classList.add("loading");
  const g = await engine.level(level, cfg.difficulty.curve ? { curve: cfg.difficulty.curve } : undefined);
  tubes = g.tubes.map(t => t.slice()); par = g.par; hiddenTubes = g.hiddenTubes || []; revealed = new Set();
  history = []; sel = -1; undos = cfg.economy.free_undos; extraUsed = false; moves = 0; busy = false;
  board.classList.remove("loading");
  render(true); hud();
  track("level_start", { level, colors: g.params.colors, empties: g.params.empties });
}

function hud() {
  $("lvl").textContent = level; $("coins").textContent = coins; $("undoN").textContent = undos;
  $("hintN").textContent = cfg.economy.hint_cost; $("tubeN").textContent = cfg.economy.extra_tube_cost;
  $("streak").textContent = streak >= cfg.features.streak_from_level ? "🔥" + streak : "";
  $("bUndo").disabled = !history.length || !undos; $("bTube").disabled = extraUsed;
}

function isHidden(ti, q) { return hiddenTubes.includes(ti) && !revealed.has(ti + ":" + q) && q < tubes[ti].length - 1; }

function render(full) {
  if (full || board.children.length !== tubes.length) {
    board.innerHTML = "";
    tubes.forEach((t, i) => {
      const d = document.createElement("button"); d.className = "tube"; d.dataset.i = i; d.setAttribute("aria-label", "Frasco " + (i + 1));
      for (let q = 0; q < CAP; q++) { const s = document.createElement("div"); s.className = "seg"; d.appendChild(s); }
      d.onclick = () => tap(i); board.appendChild(d);
    });
  }
  tubes.forEach((t, i) => {
    const d = board.children[i];
    d.classList.toggle("sel", i === sel); d.classList.toggle("done", tubeDone(t));
    for (let q = 0; q < CAP; q++) {
      const s = d.children[q];
      if (q >= t.length) { s.className = "seg"; continue; }
      if (q === t.length - 1) revealed.add(i + ":" + q);
      s.className = "seg on " + (isHidden(i, q) ? "hidden" : "c" + t[q]);
    }
  });
}

function tap(i) {
  if (busy) return;
  if (sel < 0) { if (tubes[i].length) { sel = i; haptics.light(); render(); } return; }
  if (sel === i) { sel = -1; render(); return; }
  const next = pour(tubes, sel, i);
  if (!next) {
    const d = board.children[i]; d.classList.add("shake"); setTimeout(() => d.classList.remove("shake"), 260);
    sel = tubes[i].length ? i : -1; render(); return;
  }
  history.push(tubes); tubes = next; moves++; sel = -1; haptics.medium();
  render(); hud();
  if (solved(tubes)) { haptics.success(); setTimeout(win, 350); }
  else if (stuck(tubes)) { track("level_fail", { level, reason: "stuck" }); $("stuckO").classList.add("show"); }
}

async function win() {
  const eff = moves <= par; const earn = cfg.economy.coins_per_level + (eff ? cfg.economy.efficiency_bonus : 0);
  coins += earn; streak++; levelsSinceAd++;
  const chest = cfg.economy.streak_chests[streak]; if (chest) coins += chest;
  track("level_complete", { level, moves, par, hints: 0, undos: cfg.economy.free_undos - undos, extra_tube: extraUsed, seconds: playSeconds });
  level++; await S.save();
  $("winMsg").textContent = `${moves} movimientos · referencia ${par}` + (eff ? " · bono de eficiencia" : "") + (chest ? ` · cofre de racha +${chest}` : "");
  $("winCoins").textContent = "+" + earn; $("win").classList.add("show");
}

async function maybeInterstitial() {
  const a = cfg.ads;
  if (level < a.interstitial_from_level || playSeconds < a.first_interstitial_min_play_seconds) return;
  if (levelsSinceAd < a.interstitial_every_levels || (Date.now() - lastInterstitialAt) / 1000 < a.interstitial_min_seconds) return;
  if (await ads.showInterstitial()) { lastInterstitialAt = Date.now(); levelsSinceAd = 0; track("ad_impression", { format: "interstitial", placement: "level_end" }); }
}

$("bNext").onclick = async () => { $("win").classList.remove("show"); await maybeInterstitial(); load(); };
$("bDouble").onclick = async () => {
  const r = await ads.showRewarded("double_coins");
  if (r.rewarded) { const base = +$("winCoins").textContent.slice(1); coins += base; await S.save(); hud(); track("ad_reward", { placement: "double_coins" }); toast(`+${base} monedas`); }
  $("win").classList.remove("show"); load();
};
function undo() { if (!history.length || !undos) return; tubes = history.pop(); undos--; moves--; sel = -1; render(); hud(); }
$("bUndo").onclick = undo;
$("bStuckUndo").onclick = () => { $("stuckO").classList.remove("show"); if (!undos) { undos = 1; } undo(); };
function restart() { if (history.length && streak) { streak = 0; track("streak_lost", { level }); } S.save(); $("stuckO").classList.remove("show"); load(); }
$("bRestart").onclick = restart; $("bStuckRestart").onclick = restart;
async function extraTube() {
  if (extraUsed) return;
  if (coins < cfg.economy.extra_tube_cost) { const r = await ads.showRewarded("extra_tube"); if (!r.rewarded) return toast(`Faltan monedas: ${cfg.economy.extra_tube_cost}`); }
  else { coins -= cfg.economy.extra_tube_cost; track("coins_spend", { source: "extra_tube", amount: cfg.economy.extra_tube_cost, balance: coins }); }
  extraUsed = true; tubes = tubes.concat([[]]); history = history.map(h => h.concat([[]])); $("stuckO").classList.remove("show"); await S.save(); render(true); hud();
}
$("bTube").onclick = extraTube; $("bStuckTube").onclick = extraTube;
$("bHint").onclick = async () => {
  if (busy) return;
  let paid = false;
  if (coins >= cfg.economy.hint_cost) { coins -= cfg.economy.hint_cost; paid = true; }
  else if (hintAdsToday < cfg.ads.rewarded_hints_per_day) { const r = await ads.showRewarded("hint"); if (!r.rewarded) return; hintAdsToday++; }
  else return toast(`Faltan monedas: ${cfg.economy.hint_cost}`);
  busy = true; const { move, exact } = await engine.hint(tubes); busy = false;
  if (!move) { if (paid) coins += cfg.economy.hint_cost; return toast("Sin camino desde aquí: reinicia"); }
  await S.save(); hud(); track(paid ? "coins_spend" : "ad_reward", { source: "hint", exact });
  const [a, b] = move; sel = a; render();
  board.children[b].style.outline = "3px solid var(--accent)"; setTimeout(() => board.children[b].style.outline = "", 900);
};
function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1500); }

boot();
