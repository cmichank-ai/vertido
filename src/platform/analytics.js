import { native } from "./native.js";
const fb = native.FirebaseAnalytics || null;
const queue = [];
export function track(event, props = {}) {
  const e = { event, props: { ...props, ts: Date.now() } };
  queue.push(e); if (queue.length > 200) queue.shift();
  if (fb) { try { fb.logEvent({ name: event, params: props }); } catch {} }
  else if (globalThis.__VERTIDO_DEBUG) console.debug("[track]", event, props);
}
export function recentEvents() { return queue.slice(); }
