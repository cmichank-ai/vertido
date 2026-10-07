import { native } from "./native.js";
const h = native.Haptics || null, I = native.ImpactStyle || {}, N = native.NotificationType || {};
const safe = p => { try { p?.catch?.(() => {}); } catch {} };
export const haptics = {
  light() { if (h) safe(h.impact({ style: I.Light || "LIGHT" })); else navigator.vibrate?.(8); },
  medium() { if (h) safe(h.impact({ style: I.Medium || "MEDIUM" })); else navigator.vibrate?.(15); },
  success() { if (h) safe(h.notification({ type: N.Success || "SUCCESS" })); else navigator.vibrate?.([10, 30, 10]); },
};
