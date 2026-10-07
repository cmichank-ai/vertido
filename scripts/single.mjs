// Genera dist/vertido.html: un solo archivo (juego + worker inline) para QA y publicación como artefacto.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const strip = f => readFileSync(f, "utf8").split("\n").filter(l => !/^import /.test(l)).join("\n").replace(/^export (async function|const|function|class|let)/gm, "$1");
const core = ["rules", "solver", "generator", "worker"].map(m => strip(`src/core/${m}.js`)).join("\n");
const game = ["core/rules", "game/engine", "game/fx", "platform/storage", "platform/config", "platform/analytics", "platform/ads", "platform/haptics", "platform/audio", "platform/iap", "platform/notifications", "i18n/es", "i18n/en", "i18n/i18n", "meta/meta", "game/screens", "game/main"].map(m => strip(`src/${m}.js`)).join("\n");
const css = readFileSync("public/styles.css", "utf8");
let html = readFileSync("public/index.html", "utf8");
html = html.replace('<link rel="stylesheet" href="./styles.css">', `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap" rel="stylesheet"><style>\n${css}\n</style>`);
html = html.replace('<script type="module" src="../src/game/main.js"></script>',
  `<script type="module">\nglobalThis.__VERTIDO_WORKER_URL = URL.createObjectURL(new Blob([${JSON.stringify(core)}], { type: "text/javascript" }));\n${game}\n</script>`);
mkdirSync("dist", { recursive: true }); writeFileSync("dist/vertido.html", html);
console.log("dist/vertido.html", (html.length / 1024).toFixed(0), "KB");
