// Compras: RevenueCat cuando existe; en web, catálogo simulado para QA.
export const CATALOG = [
  { id: "coins_300", coins: 300, usd: 0.99 }, { id: "coins_1000", coins: 1000, usd: 2.99 },
  { id: "coins_4000", coins: 4000, usd: 9.99 }, { id: "no_ads", usd: 4.99 }, { id: "starter_pack", coins: 800, usd: 1.99 },
];
export const iap = {
  async purchase(id) { return { ok: true, id, simulated: true }; },
  async restore() { return { noAds: false }; },
};
