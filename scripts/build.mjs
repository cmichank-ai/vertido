// Empaqueta public/ + src/ en dist/ (webDir de Capacitor). Sin bundler.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
rmSync("dist", { recursive: true, force: true }); mkdirSync("dist");
cpSync("public", "dist", { recursive: true });
cpSync("src", "dist/src", { recursive: true });
const html = readFileSync("dist/index.html", "utf8").replace("../src/game/main.js", "./src/game/main.js");
writeFileSync("dist/index.html", html);
console.log("dist/ listo");
