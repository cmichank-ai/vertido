// Efectos visuales: vertido animado, partículas, cascada de win. Respeta prefers-reduced-motion.
const reduced = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Anima el frasco `from` inclinándose sobre `to`; resuelve cuando el líquido debe cambiar. */
export function animatePour(from, to, n, board) {
  if (reduced()) return Promise.resolve();
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const right = b.left > a.left;
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2) + (right ? -a.width * 0.55 : a.width * 0.55);
  const dy = (b.top - a.top) - a.height * 0.55;
  from.style.zIndex = 5; from.style.transformOrigin = right ? "100% 100%" : "0% 100%";
  const rot = right ? 48 : -48;
  const go = from.animate([{ transform: "translate(0,0) rotate(0)" }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)` }], { duration: 190, easing: "cubic-bezier(.3,.7,.3,1)", fill: "forwards" });
  return go.finished.then(() => {
    const stream = document.createElement("div"); stream.className = "stream " + (from.dataset.topColor || "");
    const sx = right ? b.left + b.width / 2 - 2 : b.left + b.width / 2 - 2;
    const top = b.top + 6, h = Math.max(20, (b.top + b.height - 8) - top - to.dataset.fill * 1);
    Object.assign(stream.style, { left: sx + "px", top: top + "px", height: h + "px" });
    document.body.appendChild(stream);
    bubbles(to, n);
    return new Promise(r => setTimeout(r, 110 * n)).then(() => {
      stream.remove();
      const back = from.animate([{ transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)` }, { transform: "translate(0,0) rotate(0)" }], { duration: 160, easing: "ease-out", fill: "forwards" });
      return back.finished.then(() => { go.cancel(); back.cancel(); from.style.zIndex = ""; from.style.transformOrigin = ""; });
    });
  });
}

function bubbles(tube, n) {
  const r = tube.getBoundingClientRect();
  for (let i = 0; i < 3 + n; i++) {
    const d = document.createElement("div"); d.className = "bubble";
    Object.assign(d.style, { left: r.left + 8 + Math.random() * (r.width - 16) + "px", top: r.bottom - 12 + "px" });
    document.body.appendChild(d);
    d.animate([{ transform: "translateY(0)", opacity: .9 }, { transform: `translateY(-${30 + Math.random() * 50}px)`, opacity: 0 }], { duration: 500 + Math.random() * 300, easing: "ease-out" }).finished.then(() => d.remove());
  }
}

export function pulse(el) {
  if (reduced()) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: 260 });
  const r = el.getBoundingClientRect(); const flash = document.createElement("div"); flash.className = "flash";
  Object.assign(flash.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
  document.body.appendChild(flash); setTimeout(() => flash.remove(), 220);
  particles(r.left + r.width / 2, r.top, 8, [el.dataset.topColor || "c0"]);
}

export function particles(x, y, count, classes) {
  if (reduced()) return;
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div"); d.className = "spark " + classes[i % classes.length];
    Object.assign(d.style, { left: x + "px", top: y + "px" });
    document.body.appendChild(d);
    const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 70;
    d.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist - 40}px) scale(.3)`, opacity: 0 }], { duration: 500 + Math.random() * 300, easing: "cubic-bezier(.2,.8,.3,1)" }).finished.then(() => d.remove());
  }
}

export function winCascade(board, colorClasses) {
  if (reduced()) return Promise.resolve();
  const tubes = [...board.children];
  tubes.forEach((t, i) => t.animate([{ transform: "translateY(0)" }, { transform: "translateY(-18px)" }, { transform: "translateY(0)" }], { duration: 320, delay: i * 40, easing: "ease-out" }));
  const w = innerWidth;
  for (let i = 0; i < 60; i++) setTimeout(() => particles(Math.random() * w, innerHeight * 0.3, 1, colorClasses), i * 12);
  return new Promise(r => setTimeout(r, 400 + tubes.length * 40));
}

/** Contador que sube de uno en uno. */
export function countUp(el, to, onTick) {
  if (reduced()) { el.textContent = "+" + to; return; }
  let v = 0; const step = Math.max(1, Math.round(to / 20));
  const id = setInterval(() => { v = Math.min(to, v + step); el.textContent = "+" + v; onTick?.(v); if (v >= to) clearInterval(id); }, 35);
}
