import { native } from "./native.js";
const r = native.InAppReview || null;
/** Pide reseña tras el nivel 15 y cada 25 niveles, máximo 3 veces (lo controla el llamador). */
export const review = { async request() { if (!r) return false; try { await r.requestReview(); return true; } catch { return false; } } };
