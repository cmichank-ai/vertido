// Pantallas de meta: mapa, misiones, colección, tienda, cofre diario. Renderizan en #screen.
import { t } from "../i18n/i18n.js";
import { TUBE_STYLES, BACKGROUNDS, ensureMissions, claimMission, buyItem, equip, dailyAvailable, starterActive } from "../meta/meta.js";
import { CATALOG } from "../platform/iap.js";
import { standings, ensureTournament, weekEndsAt, prizeFor } from "../meta/liveops.js";

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));

export function createScreens(ctx) {
  const root = document.getElementById("screen"); const body = root.querySelector(".sbody"); const title = root.querySelector("h2");
  const show = (name) => { root.classList.add("show"); render(name); };
  const hide = () => root.classList.remove("show");
  root.querySelector(".sclose").onclick = hide;

  function render(name) {
    const { meta, state } = ctx; root.dataset.screen = name;
    if (name === "map") {
      title.textContent = t("map");
      const lv = state.level; const from = Math.max(1, lv - 4), to = lv + 12; let h = "<div class=\"map\">";
      for (let n = to; n >= from; n--) {
        const chest = n % 10 === 1 && n > 1 ? (meta.mapChests.includes((n - 1) / 10) ? "🎁" : "🎁") : "";
        const cls = n < lv ? "past" : n === lv ? "cur" : "fut";
        h += `<div class="node ${cls}"><span>${n}</span>${n % 7 === 0 && n >= 20 ? "<em>★</em>" : ""}${chest ? `<b>${chest}</b>` : ""}</div>`;
      }
      body.innerHTML = h + "</div>";
    }
    if (name === "missions") {
      title.textContent = t("missions"); const items = ensureMissions(meta, state.level);
      body.innerHTML = items.map(m => `<div class="mrow"><div><div>${t(m.key, { n: m.n })}</div><div class="bar"><i style="width:${(m.p / m.n) * 100}%"></i></div><small>${m.p}/${m.n} · +${m.reward}</small></div>
        <button class="btn sm" data-claim="${m.id}" ${m.claimed || m.p < m.n ? "disabled" : ""}>${m.claimed ? t("claimed") : t("claim")}</button></div>`).join("") + `<p class="dim">${t("missionsReset")}</p>`;
      body.querySelectorAll("[data-claim]").forEach(b => b.onclick = () => { const r = claimMission(meta, b.dataset.claim); if (r) { ctx.addCoins(r, "mission"); render("missions"); } });
    }
    if (name === "collection") {
      title.textContent = t("collection");
      const grid = (kind, list, owned, eq) => list.filter(i => i.cost != null || owned.includes(i.id)).map(i => {
        const has = owned.includes(i.id), on = eq === i.id;
        return `<div class="item ${kind} ${i.id} ${on ? "on" : ""}"><div class="swatch ${kind}-${i.id}"></div><div>${esc(i.name)}</div>
          <button class="btn sm" data-k="${kind}" data-id="${i.id}" ${on ? "disabled" : ""}>${on ? t("equipped") : has ? t("equip") : i.cost + " ●"}</button></div>`; }).join("");
      body.innerHTML = `<h3>${t("tubes")}</h3><div class="grid">${grid("tube", TUBE_STYLES, meta.owned.tubes, meta.equipped.tube)}</div><h3>${t("backgrounds")}</h3><div class="grid">${grid("bg", BACKGROUNDS, meta.owned.bgs, meta.equipped.bg)}</div>`;
      body.querySelectorAll("[data-k]").forEach(b => b.onclick = () => {
        const { k, id } = b.dataset; const owned = k === "tube" ? meta.owned.tubes : meta.owned.bgs;
        if (!owned.includes(id)) { const c = buyItem(meta, k, id, state.coins); if (c < 0) return ctx.toast(t("needCoins", { n: (k === "tube" ? TUBE_STYLES : BACKGROUNDS).find(i => i.id === id).cost })); ctx.spendCoins(c, "collection"); }
        equip(meta, k, id); ctx.applySkin(); render("collection");
      });
    }
    if (name === "shop") {
      title.textContent = t("shop");
      const starter = starterActive(meta, state.level, ctx.cfg.features.shop_from_level);
      const left = starter ? Math.max(0, meta.starter.shownAt + 86400_000 - Date.now()) : 0;
      const hh = Math.floor(left / 3600000), mm = Math.floor((left % 3600000) / 60000);
      body.innerHTML = (starter ? `<div class="offer"><b>${t("starter")}</b><div>${t("starterMsg")}</div><small>${hh}h ${mm}m</small><button class="btn sm" data-buy="starter_pack">$1.99</button></div>` : "") +
        CATALOG.filter(p => p.id !== "starter_pack").map(p => `<div class="mrow"><div>${p.id === "no_ads" ? t("noAds") : p.coins + " " + t("coins")}</div><button class="btn sm" data-buy="${p.id}" ${p.id === "no_ads" && meta.noAds ? "disabled" : ""}>${p.id === "no_ads" && meta.noAds ? t("owned") : "$" + p.usd}</button></div>`).join("") +
        `<button class="btn ghost" id="bRestore">${t("restore")}</button>`;
      body.querySelectorAll("[data-buy]").forEach(b => b.onclick = async () => { await ctx.purchase(b.dataset.buy); render("shop"); });
      body.querySelector("#bRestore").onclick = () => ctx.restore();
    }
    if (name === "events") {
      title.textContent = t("tournament"); const tt = ensureTournament(meta);
      const rows = standings(meta); const me = rows.find(r => r.me); const left = weekEndsAt() - Date.now();
      const prev = tt.prev && !tt.prev.claimed ? tt.prev : null;
      const top = rows.slice(0, 10); if (me.rank > 10) top.push(me);
      body.innerHTML = `<p class="dim">${t("endsIn", { d: Math.floor(left / 86400000), h: Math.floor((left % 86400000) / 3600000) })} · ${t("prizes")}</p>
        ${prev ? `<button class="btn" id="bPrize">${t("claimPrize", { r: prev.rank || "?", c: prev.prize || 0 })}</button>` : ""}
        <div class="lb">${top.map(r => `<div class="lrow ${r.me ? "me" : ""}"><b>#${r.rank}</b><span>${r.me ? t("you") : esc(r.name)}</span><i>${r.points}</i></div>`).join("")}</div>
        <p>${t("yourRank", { r: me.rank, p: me.points })}</p>`;
      const bp = body.querySelector("#bPrize"); if (bp) bp.onclick = () => { tt.prev.claimed = true; ctx.addCoins(tt.prev.prize || 0, "tournament"); render("events"); };
    }
    if (name === "daily") {
      title.textContent = t("dailyChest");
      body.innerHTML = `<p>${t("dailyChestMsg", { d: meta.daily.run + 1 })}</p><div class="chest">🎁</div><button class="btn" id="bOpenAd">${t("openAd")}</button><button class="btn ghost" id="bOpen">${t("open")}</button>`;
      body.querySelector("#bOpen").onclick = () => { ctx.openDaily(false); hide(); };
      body.querySelector("#bOpenAd").onclick = () => { ctx.openDaily(true); hide(); };
    }
  }
  return { show, hide, render, isOpen: () => root.classList.contains("show"), dailyAvailable: () => dailyAvailable(ctx.meta) };
}
