// Compras: RevenueCat. En web, compra simulada para QA.
import { native } from "./native.js";
import { track } from "./analytics.js";
const rc = native.Purchases || null;
const KEYS = { ios: "appl_REPLACE", android: "goog_REPLACE" }; // se sobreescriben por config remota (iap.keys)
export const CATALOG = [
  { id: "coins_300", coins: 300, usd: 0.99 }, { id: "coins_1000", coins: 1000, usd: 2.99 },
  { id: "coins_4000", coins: 4000, usd: 9.99 }, { id: "no_ads", usd: 4.99 }, { id: "starter_pack", coins: 800, usd: 1.99 },
];
let products = new Map();
export const iap = {
  native: !!rc,
  async init(keys) {
    if (!rc) return;
    const k = (keys || KEYS)[native.platform]; if (!k || k.includes("REPLACE")) return;
    try {
      await rc.configure({ apiKey: k });
      const { current } = await rc.getOfferings();
      for (const p of current?.availablePackages || []) products.set(p.product.identifier, p);
    } catch {}
  },
  prices() { const out = {}; for (const [id, p] of products) out[id] = p.product.priceString; return out; },
  async purchase(id) {
    if (!rc) return { ok: true, id, simulated: true };
    const pkg = products.get(id); if (!pkg) return { ok: false, id, error: "no_product" };
    try { const { customerInfo } = await rc.purchasePackage({ aPackage: pkg }); track("iap_purchase", { product: id }); return { ok: true, id, noAds: !!customerInfo.entitlements.active.no_ads }; }
    catch (e) { return { ok: false, id, error: e?.code || "cancelled" }; }
  },
  async restore() {
    if (!rc) return { noAds: false };
    try { const { customerInfo } = await rc.restorePurchases(); return { noAds: !!customerInfo.entitlements.active.no_ads }; } catch { return { noAds: false }; }
  },
};
