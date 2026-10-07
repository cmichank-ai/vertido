import { es } from "./es.js"; import { en } from "./en.js";
const dict = { es, en };
export let lang = "es";
export function setLang(l) { lang = dict[l] ? l : "es"; }
export function detectLang() { const l = (navigator.language || "es").slice(0, 2); setLang(l); return lang; }
export function t(k, vars = {}) { let s = dict[lang][k] ?? dict.es[k] ?? k; for (const [a, b] of Object.entries(vars)) s = s.replace("{" + a + "}", b); return s; }
export function applyI18n(root = document) { root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); }); }
