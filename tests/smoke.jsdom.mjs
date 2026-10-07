// Smoke test del bundle en jsdom con Worker simulado. No corre en CI por defecto (npm run smoke).
setTimeout(() => { console.log("TIMEOUT"); process.exit(2); }, 60000);
import { JSDOM } from "jsdom"; import { readFileSync } from "node:fs";
const html = readFileSync("dist/vertido.html", "utf8");
const core = JSON.parse(html.match(/new Blob\(\[(".*?")\], \{ type/s)[1]);
const game = html.match(/<script type="module">\nglobalThis.__VERTIDO_WORKER_URL.*\n([\s\S]*)<\/script>/)[1];
const dom = new JSDOM(html.replace(/<script type="module">[\s\S]*<\/script>/, ""), { pretendToBeVisual: true, runScripts: "outside-only", url: "https://vertido.app/" });
const w = dom.window; dom.virtualConsole?.removeAllListeners?.();
class FakeWorker { constructor() { this.self = { postMessage: m => setTimeout(() => this.onmessage?.({ data: m }), 0) }; const s = this.self; new Function("self", "performance", core)(s, w.performance); }
  postMessage(m) { this.self.onmessage({ data: m }); } }
Object.assign(w, { Worker: FakeWorker, __VERTIDO_WORKER_URL: "blob:x" });
w.HTMLElement.prototype.animate = () => ({ finished: Promise.resolve(), cancel() {} });
w.fetch = async () => { throw new Error("offline"); };
w.matchMedia = () => ({ matches: false });
w.AudioContext = undefined;
w.localStorage.setItem("vertido.coins", "1000"); // pistas con monedas para recorrer el nivel
const errors = []; w.addEventListener("error", e => errors.push(e.error || e.message));
w.eval(game.replace(/^import .*$/gm, "").replace("new URL(\"../core/worker.js\", import.meta.url)", "\"\""));
const sleep = ms => new Promise(r => setTimeout(r, ms));
await sleep(300);
const $ = id => w.document.getElementById(id);
console.log("nivel", $("lvl").textContent, "frascos", $("board").children.length, "nav oculto", $("nav").hidden);
// jugar nivel 1 con pistas gratis (coins=0 → rewarded web concede)
for (let k = 0; k < 40 && !$("win").classList.contains("show"); k++) { $("bHint").click(); await sleep(120); const tgt = w.document.querySelector(".tube.hintTarget"); if (tgt) { tgt.click(); await sleep(700); } }
await sleep(800);
console.log("win visible", $("win").classList.contains("show"), "msg:", $("winMsg").textContent, "coins:", $("winCoins").textContent);
$("bNext").click(); await sleep(400);
console.log("nivel", $("lvl").textContent, "coins hud", $("coins").textContent, "errores", errors.length ? errors : "ninguno");
if (!$("win").classList.contains("show") && $("lvl").textContent === "1") { console.log("FALLO: no se resolvió el nivel 1"); process.exit(1); }

// Segunda sesión: nivel 7 → nav visible, cofre diario, misiones, colección, tienda
w.localStorage.setItem("vertido.level", "7"); w.localStorage.setItem("vertido.coins", "500"); w.localStorage.removeItem("vertido.meta");
w.eval(game.replace(/^import .*$/gm, "").replace('new URL("../core/worker.js", import.meta.url)', '""'));
await sleep(400);
console.log("nav visible", !$("nav").hidden, "daily abierto", $("screen").classList.contains("show") && $("screen").dataset.screen === "daily");
$("bOpen").click(); await sleep(50); console.log("coins tras cofre", $("coins").textContent);
w.document.querySelector("[data-nav=missions]").click(); await sleep(50); console.log("misiones:", $("screen").querySelectorAll(".mrow").length);
w.document.querySelector("[data-nav=collection]").click(); await sleep(50);
const frost = $("screen").querySelector("[data-id=frost]"); frost.click(); await sleep(50);
console.log("skin frost puesto:", w.document.body.dataset.tube, "coins", $("coins").textContent);
w.document.querySelector("[data-nav=map]").click(); await sleep(50); console.log("mapa nodos:", $("screen").querySelectorAll(".node").length, "actual:", $("screen").querySelector(".node.cur")?.textContent);
process.exit(errors.length ? 1 : 0);
