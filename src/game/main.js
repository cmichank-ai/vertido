import { CAP, canPour, pour, solved, stuck, tubeDone } from "../core/rules.js";
import { Engine } from "./engine.js";
import { animatePour, pulse, winCascade, countUp, particles } from "./fx.js";
import { storage } from "../platform/storage.js";
import { loadConfig } from "../platform/config.js";
import { track } from "../platform/analytics.js";
import { ads } from "../platform/ads.js";
import { haptics } from "../platform/haptics.js";
import { audio } from "../platform/audio.js";
import { iap } from "../platform/iap.js";
import { notifications } from "../platform/notifications.js";
import { t, detectLang, applyI18n } from "../i18n/i18n.js";
import { defaultMeta, ensureMissions, onLevelComplete, openDaily, mapChestReward } from "../meta/meta.js";
import { createScreens } from "./screens.js";
import { review } from "../platform/review.js";
import { cloud } from "../platform/cloud.js";
import { ensureTournament, standings, levelPoints, prizeFor, coinMultiplier, weekId } from "../meta/liveops.js";

const APP_VERSION = "0.5.0";
const SYM = ["●", "▲", "■", "◆", "★", "✚", "▼", "⬟", "✖", "◐"];
const $ = id => document.getElementById(id);
const board = $("board");
const engine = new Engine(globalThis.__VERTIDO_WORKER_URL || new URL("../core/worker.js", import.meta.url));

let cfg, level = 1, coins = 0, streak = 0, playSeconds = 0, lastInterstitialAt = 0, levelsSinceAd = 0, hintAdsToday = 0, hintsUsed = 0;
let tubes = [], history = [], sel = -1, undos = 3, extraUsed = false, par = 0, moves = 0, hiddenTubes = [], revealed = new Set(), busy = false;
const settings = { sound: true, haptic: true, cb: false };
let meta = defaultMeta(); let screens; let onboarding = false;
const hap = { light: () => settings.haptic && haptics.light(), medium: () => settings.haptic && haptics.medium(), success: () => settings.haptic && haptics.success() };

const S = {
  async load() {
    level = +(await storage.get("vertido.level")) || 1; coins = +(await storage.get("vertido.coins")) || 0; streak = +(await storage.get("vertido.streak")) || 0;
    try { Object.assign(settings, JSON.parse((await storage.get("vertido.settings")) || "{}")); } catch {}
    try { meta = { ...defaultMeta(), ...JSON.parse((await storage.get("vertido.meta")) || "{}") }; } catch {}
  },
  async save() {
    await storage.set("vertido.level", String(level)); await storage.set("vertido.coins", String(coins)); await storage.set("vertido.streak", String(streak));
    await storage.set("vertido.settings", JSON.stringify(settings)); await storage.set("vertido.meta", JSON.stringify(meta));
  },
};

async function boot() {
  detectLang(); applyI18n();
  await S.load(); applySettings(); applySkin();
  cfg = await loadConfig(storage, { version: APP_VERSION, country: navigator.language?.split("-")[1], bucket: 0 });
  ads.configure(cfg.ads.ids); await ads.init(); await iap.init(cfg.iap?.keys);
  const r0 = await iap.restore(); if (r0.noAds) meta.noAds = true;
  await cloud.init({ ...cfg.backend, app_version: APP_VERSION });
  const remote = await cloud.pull(); if (remote && remote.level > level) { level = remote.level; coins = Math.max(coins, remote.coins); streak = remote.streak; await S.save(); }
  closeTournamentWeek();
  setInterval(() => { if (!document.hidden) playSeconds++; }, 1000);
  document.addEventListener("pointerdown", () => audio.unlock(), { once: true });
  screens = createScreens({ get meta() { return meta; }, get state() { return { level, coins }; }, get cfg() { return cfg; }, addCoins, spendCoins, toast, applySkin, purchase, restore, openDaily: openDailyChest });
  document.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => { const n = b.dataset.nav; if (n === "play") screens.hide(); else screens.show(n); document.querySelectorAll("[data-nav]").forEach(x => x.classList.toggle("on", x === b)); });
  await load();
  if (level >= cfg.features.missions_from_level && screens.dailyAvailable()) screens.show("daily");
}

function closeTournamentWeek() {
  const before = meta.tournament?.week; const tt = ensureTournament(meta);
  if (tt.prev && !tt.prev.claimed && tt.prev.rank == null) { // la semana cerró: calcular lugar final con los rivales de esa semana
    const rows = standings({ tournament: { week: tt.prev.week, points: tt.prev.points } }, new Date()); const me = rows.find(r => r.me);
    tt.prev.rank = me.rank; tt.prev.prize = prizeFor(me.rank, cfg.tournament.prizes);
  }
  if (before !== tt.week) $("dotE").hidden = !(tt.prev && !tt.prev.claimed && tt.prev.prize > 0);
}
function updateNav() {
  const nav = $("nav"); nav.hidden = level < cfg.features.missions_from_level; $("navShop").hidden = level < cfg.features.shop_from_level;
  $("navEvents").hidden = level < cfg.features.events_from_level;
  if (!nav.hidden) { const items = ensureMissions(meta, level); $("dotM").hidden = !items.some(m => !m.claimed && m.p >= m.n); }
}
function applySkin() { document.body.dataset.tube = meta.equipped.tube; document.body.dataset.bg = meta.equipped.bg; }
async function addCoins(n, source) { coins += n; track("coins_earn", { source, amount: n, balance: coins }); audio.chest(); await S.save(); hud(); }
async function spendCoins(n, source) { coins -= n; track("coins_spend", { source, amount: n, balance: coins }); await S.save(); hud(); }
async function openDailyChest(withAd) {
  let doubled = false;
  if (withAd) { const r = await ads.showRewarded("daily_chest"); doubled = !!r.rewarded; if (doubled) track("ad_reward", { placement: "daily_chest" }); }
  const got = openDaily(meta, cfg.economy.daily_chest, doubled); if (got) { track("chest_open", { kind: "daily", amount: got }); await addCoins(got, "daily_chest"); toast(t("coinsPlus", { n: got })); }
}
async function purchase(id) {
  const r = await iap.purchase(id); if (!r.ok) return;
  track("iap_purchase", { product: id });
  if (id === "no_ads" || r.noAds) { meta.noAds = true; ads.hideBanner(); }
  if (id === "starter_pack") { meta.starter.bought = true; meta.owned.tubes.push("starter"); meta.equipped.tube = "starter"; applySkin(); await addCoins(800, "starter_pack"); }
  if (id.startsWith("coins_")) await addCoins(+id.split("_")[1], "iap");
  await S.save(); hud();
}
async function restore() { const r = await iap.restore(); if (r.noAds) { meta.noAds = true; ads.hideBanner(); } await S.save(); toast(t("done")); }
async function showOnboardingHand() {
  if (level !== 1 || moves > 0) return;
  onboarding = true; const { move } = await engine.hint(tubes); if (!move || !onboarding) return;
  const hand = $("hand"); hand.hidden = false; toast(t("onboarding"));
  const place = i => { const r = board.children[i].getBoundingClientRect(); hand.style.left = r.left + r.width / 2 - 10 + "px"; hand.style.top = r.top + r.height / 2 + "px"; };
  let k = 0; place(move[0]); hand._timer = setInterval(() => { k++; place(move[k % 2]); }, 900);
}
function hideHand() { onboarding = false; const h = $("hand"); if (!h.hidden) { clearInterval(h._timer); h.hidden = true; } }

async function load() {
  busy = true;
  const g = await engine.level(level, cfg.difficulty.curve ? { curve: cfg.difficulty.curve } : undefined);
  tubes = g.tubes.map(t => t.slice()); par = g.par; hiddenTubes = g.hiddenTubes || []; revealed = new Set();
  history = []; sel = -1; undos = cfg.economy.free_undos; extraUsed = false; moves = 0; hintsUsed = 0; busy = false;
  render(true); hud(); updateNav();
  track("level_start", { level, colors: g.params.colors, empties: g.params.empties });
  showOnboardingHand();
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
    d.dataset.topColor = t.length ? "c" + t[t.length - 1] : ""; d.dataset.fill = t.length;
    for (let q = 0; q < CAP; q++) {
      const s = d.children[q];
      if (q >= t.length) { s.className = "seg"; s.removeAttribute("data-sym"); continue; }
      if (q === t.length - 1) revealed.add(i + ":" + q);
      const hid = isHidden(i, q);
      s.className = "seg on " + (hid ? "hidden" : "c" + t[q]);
      if (hid) s.removeAttribute("data-sym"); else s.dataset.sym = SYM[t[q] % SYM.length];
    }
  });
}

async function tap(i) {
  if (busy) return; hideHand();
  if (sel < 0) { if (tubes[i].length) { sel = i; hap.light(); audio.select(tubes[i].length); render(); } return; }
  if (sel === i) { sel = -1; render(); return; }
  const n = canPour(tubes[sel], tubes[i]);
  if (!n) {
    const d = board.children[i]; d.classList.add("shake"); setTimeout(() => d.classList.remove("shake"), 260);
    audio.invalid(); sel = tubes[i].length ? i : -1; render(); return;
  }
  const from = sel; busy = true;
  const next = pour(tubes, from, i);
  board.children[from].classList.remove("sel");
  audio.pour(n); hap.medium();
  await animatePour(board.children[from], board.children[i], n, board);
  history.push(tubes); tubes = next; moves++; sel = -1;
  render(); hud(); busy = false;
  if (tubeDone(tubes[i])) { audio.tubeDone(tubes[i][0]); hap.success(); pulse(board.children[i]); }
  if (solved(tubes)) setTimeout(win, 300);
  else if (stuck(tubes)) { track("level_fail", { level, reason: "stuck" }); $("stuckO").classList.add("show"); }
}

async function win() {
  const eff = moves <= par; const mult = coinMultiplier(cfg.events); const earn = (cfg.economy.coins_per_level + (eff ? cfg.economy.efficiency_bonus : 0)) * mult;
  const chest = cfg.economy.streak_chests[streak + 1] || 0;
  audio.win();
  await winCascade(board, [...new Set(tubes.flat())].map(c => "c" + c));
  coins += earn + chest; streak++; levelsSinceAd++;
  track("level_complete", { level, moves, par, hints: hintsUsed, undos: cfg.economy.free_undos - undos, extra_tube: extraUsed, seconds: playSeconds });
  ensureMissions(meta, level); onLevelComplete(meta, { hints: hintsUsed, eff });
  let tpts = 0; if (level >= cfg.features.events_from_level) { const tt = ensureTournament(meta); tpts = levelPoints({ level, eff, hard: level >= 20 && level % 7 === 0 }); tt.points += tpts; cloud.submitScore(tt.week, tt.points); }
  level++; const mapChest = mapChestReward(meta, level); coins += mapChest; await S.save();
  cloud.push({ level, coins, streak, unlocked_items: meta.owned });
  if (level === 8 && !notifications.granted) notifications.request();
  if ((level === 15 || (level > 15 && (level - 15) % 25 === 0)) && (meta.reviews || 0) < 3) { meta.reviews = (meta.reviews || 0) + 1; review.request(); }
  if (!meta.noAds && level >= cfg.ads.banner_from_level) ads.showBanner();
  notifications.schedule({ streak, titleStreak: t("notifStreak", { n: streak }), titleChest: t("notifChest"), titleMissions: t("notifMissions") });
  $("winMsg").textContent = t("moves", { m: moves, p: par }) + (eff ? " · " + t("effBonus") : "") + (chest ? " · " + t("streakChest", { c: chest }) : "") + (mapChest ? " · " + t("levelChest", { c: mapChest }) : "") + (tpts ? " · " + t("tournamentPts", { p: tpts }) : "") + (mult > 1 ? " · " + t("doubleCoins", { m: mult }) : "");
  $("win").classList.add("show"); $("winCoins").dataset.earn = earn;
  countUp($("winCoins"), earn, v => { if (v % 5 === 0) audio.coin(v); });
  if (chest) setTimeout(() => audio.chest(), 700);
}

async function maybeInterstitial() {
  const a = cfg.ads;
  if (meta.noAds || level < a.interstitial_from_level || playSeconds < a.first_interstitial_min_play_seconds) return;
  if (levelsSinceAd < a.interstitial_every_levels || (Date.now() - lastInterstitialAt) / 1000 < a.interstitial_min_seconds) return;
  await ads.consent();
  if (await ads.showInterstitial()) { lastInterstitialAt = Date.now(); levelsSinceAd = 0; track("ad_impression", { format: "interstitial", placement: "level_end" }); }
}

$("bNext").onclick = async () => { $("win").classList.remove("show"); await maybeInterstitial(); hud(); load(); };
$("bDouble").onclick = async () => {
  const r = await ads.showRewarded("double_coins");
  if (r.rewarded) { const base = +$("winCoins").dataset.earn; coins += base; await S.save(); track("ad_reward", { placement: "double_coins" }); toast(t("coinsPlus", { n: base })); audio.chest(); }
  $("win").classList.remove("show"); hud(); load();
};
function undo() { if (!history.length || !undos) return; tubes = history.pop(); undos--; moves--; sel = -1; hap.light(); render(); hud(); }
$("bUndo").onclick = undo;
$("bStuckUndo").onclick = () => { $("stuckO").classList.remove("show"); if (!undos) undos = 1; undo(); };
function restart() { if (history.length && streak) { streak = 0; track("streak_lost", { level }); } S.save(); $("stuckO").classList.remove("show"); load(); }
$("bRestart").onclick = restart; $("bStuckRestart").onclick = restart;
async function extraTube() {
  if (extraUsed || busy) return;
  if (coins < cfg.economy.extra_tube_cost) { const r = await ads.showRewarded("extra_tube"); if (!r.rewarded) return toast(t("needCoins", { n: cfg.economy.extra_tube_cost })); track("ad_reward", { placement: "extra_tube" }); }
  else { coins -= cfg.economy.extra_tube_cost; track("coins_spend", { source: "extra_tube", amount: cfg.economy.extra_tube_cost, balance: coins }); }
  extraUsed = true; tubes = tubes.concat([[]]); history = history.map(h => h.concat([[]])); $("stuckO").classList.remove("show"); await S.save(); render(true); hud();
}
$("bTube").onclick = extraTube; $("bStuckTube").onclick = extraTube;
$("bHint").onclick = async () => {
  if (busy) return;
  let paid = false;
  if (coins >= cfg.economy.hint_cost) { coins -= cfg.economy.hint_cost; paid = true; }
  else if (hintAdsToday < cfg.ads.rewarded_hints_per_day) { const r = await ads.showRewarded("hint"); if (!r.rewarded) return; hintAdsToday++; }
  else return toast(t("needCoins", { n: cfg.economy.hint_cost }));
  busy = true; const { move, exact } = await engine.hint(tubes); busy = false;
  if (!move) { if (paid) coins += cfg.economy.hint_cost; return toast(t("noPath")); }
  hintsUsed++; await S.save(); hud(); track(paid ? "coins_spend" : "ad_reward", { source: "hint", exact });
  const [a, b] = move; sel = a; render(); audio.select(2);
  board.children[b].classList.add("hintTarget"); setTimeout(() => board.children[b]?.classList.remove("hintTarget"), 900);
};

// Ajustes
function applySettings() {
  audio.setEnabled(settings.sound); document.body.classList.toggle("cb", settings.cb);
  $("swSound").classList.toggle("on", settings.sound); $("swHaptic").classList.toggle("on", settings.haptic); $("swCB").classList.toggle("on", settings.cb);
}
$("bGear").onclick = () => $("settings").classList.add("show");
$("bSetClose").onclick = () => { $("settings").classList.remove("show"); S.save(); };
for (const [id, k] of [["swSound", "sound"], ["swHaptic", "haptic"], ["swCB", "cb"]])
  $(id).onclick = () => { settings[k] = !settings[k]; applySettings(); track("settings_change", { key: k, value: settings[k] }); if (k === "sound" && settings.sound) audio.select(3); };

function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 1500); }

boot();
