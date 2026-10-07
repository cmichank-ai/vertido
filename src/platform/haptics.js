let h = null; try { h = globalThis.Capacitor?.Plugins?.Haptics || null; } catch {}
export const haptics = {
  light() { h?.impact({ style: "LIGHT" }).catch?.(() => {}); if (!h) navigator.vibrate?.(8); },
  medium() { h?.impact({ style: "MEDIUM" }).catch?.(() => {}); if (!h) navigator.vibrate?.(15); },
  success() { h?.notification({ type: "SUCCESS" }).catch?.(() => {}); if (!h) navigator.vibrate?.([10, 30, 10]); },
};
