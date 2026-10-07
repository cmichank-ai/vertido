// AdMob (plugin comunitario) con consentimiento UMP + ATT. En web: rewarded concede recompensa directa (QA), interstitial no-op.
import { native } from "./native.js";
import { track } from "./analytics.js";
const admob = native.AdMob || null;
// IDs de prueba oficiales de Google. Los reales se inyectan por config remota (ads.ids) en el build de tienda.
const TEST = {
  android: { rewarded: "ca-app-pub-3940256099942544/5224354917", interstitial: "ca-app-pub-3940256099942544/1033173712", banner: "ca-app-pub-3940256099942544/6300978111" },
  ios: { rewarded: "ca-app-pub-3940256099942544/1712485313", interstitial: "ca-app-pub-3940256099942544/4411468910", banner: "ca-app-pub-3940256099942544/2934735716" },
};
let ids = TEST[native.platform] || TEST.android, testing = true, consentDone = false, ready = { rewarded: false, interstitial: false };

export const ads = {
  native: !!admob,
  configure(cfgIds) { if (cfgIds && cfgIds[native.platform]) { ids = cfgIds[native.platform]; testing = false; } },
  async init() {
    if (!admob) return;
    try { await admob.initialize({ initializeForTesting: testing }); } catch {}
    this.preload();
  },
  /** UMP (GDPR) + ATT (iOS). Se llama justo antes del primer anuncio no-rewarded. */
  async consent() {
    if (!admob || consentDone) return true;
    try {
      const info = await admob.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === "REQUIRED") await admob.showConsentForm();
    } catch {}
    try { if (native.platform === "ios") { const t = await admob.trackingAuthorizationStatus(); if (t.status === "notDetermined") await admob.requestTrackingAuthorization(); } } catch {}
    consentDone = true; return true;
  },
  async preload() {
    if (!admob) return;
    if (!ready.rewarded) { try { await admob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting: testing }); ready.rewarded = true; } catch { ready.rewarded = false; } }
    if (!ready.interstitial) { try { await admob.prepareInterstitial({ adId: ids.interstitial, isTesting: testing }); ready.interstitial = true; } catch { ready.interstitial = false; } }
  },
  async showRewarded(placement) {
    if (!admob) return { rewarded: true, placement, web: true };
    try {
      if (!ready.rewarded) await admob.prepareRewardVideoAd({ adId: ids.rewarded, isTesting: testing });
      const r = await admob.showRewardVideoAd(); ready.rewarded = false; this.preload();
      track("ad_impression", { format: "rewarded", placement }); return { rewarded: !!(r && (r.amount != null || r.type)), placement };
    } catch { ready.rewarded = false; this.preload(); return { rewarded: false, placement }; }
  },
  async showInterstitial() {
    if (!admob) return false;
    try {
      await this.consent();
      if (!ready.interstitial) await admob.prepareInterstitial({ adId: ids.interstitial, isTesting: testing });
      await admob.showInterstitial(); ready.interstitial = false; this.preload(); return true;
    } catch { ready.interstitial = false; this.preload(); return false; }
  },
  async showBanner() { if (!admob) return; try { await admob.showBanner({ adId: ids.banner, adSize: "ADAPTIVE_BANNER", position: "BOTTOM_CENTER", margin: 0, isTesting: testing }); } catch {} },
  async hideBanner() { if (!admob) return; try { await admob.hideBanner(); } catch {} },
};
