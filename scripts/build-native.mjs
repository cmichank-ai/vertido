// Bundle para Capacitor: esbuild empaqueta src + plugins nativos en dist/.
import { build } from "esbuild";
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
rmSync("dist", { recursive: true, force: true }); mkdirSync("dist");
cpSync("public", "dist", { recursive: true });
await build({ entryPoints: ["src/game/main.js"], bundle: true, format: "esm", outfile: "dist/app.js", minify: true, target: ["es2020"], sourcemap: true });
await build({ entryPoints: ["src/core/worker.js"], bundle: true, format: "esm", outfile: "dist/worker.js", minify: true, target: ["es2020"] });
const html = readFileSync("dist/index.html", "utf8").replace("../src/game/main.js", "./app.js")
  .replace("<head>", "<head><script>globalThis.__VERTIDO_WORKER_URL = './worker.js';</script>");
writeFileSync("dist/index.html", html);
console.log("dist/ nativo listo");
