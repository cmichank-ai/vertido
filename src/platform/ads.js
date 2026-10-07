// Anuncios: AdMob vía plugin nativo cuando existe; en web concede la recompensa directamente (QA).
let admob = null;
try { admob = globalThis.Capacitor?.Plugins?.AdMob || null; } catch {}
const TEST_IDS = { rewarded: "ca-app-pub-3940256099942544/5224354917", interstitial: "ca-app-pub-3940256099942544/1033173712" };
export const ads = {
  native: !!admob,
  async init() { if (admob) { try { await admob.initialize({ initializeForTesting: true }); } catch {} } },
  async showRewarded(placement) {
    if (!admob) return { rewarded: true, placement, web: true };
    try {
      await admob.prepareRewardVideoAd({ adId: TEST_IDS.rewarded });
      const r = await admob.showRewardVideoAd();
      return { rewarded: !!r, placement };
    } catch { return { rewarded: false, placement }; }
  },
  async showInterstitial() {
    if (!admob) return false;
    try { await admob.prepareInterstitial({ adId: TEST_IDS.interstitial }); await admob.showInterstitial(); return true; } catch { return false; }
  },
};
