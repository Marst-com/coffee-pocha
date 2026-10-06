import { rand } from "../util.js";

export default {
  id: "catch", name: "원두 받기", icon: "🧺", unit: "개", level: 2,
  desc: "떨어지는 ☕원두는 받고 🔥불똥은 피해! 손가락/마우스로 바구니를 움직여.", goal: 16, duration: 20,
  mount(el, ctx) {
    const cv = document.createElement("canvas");
    cv.className = "game-canvas";
    el.appendChild(cv);
    const g = cv.getContext("2d");
    let W = 300, H = 400;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const basket = { x: W / 2, w: 84 };
    const items = [];
    let spawnIn = 0.4, last = performance.now(), raf = 0, t0 = last;

    const moveTo = (clientX) => {
      const r = cv.getBoundingClientRect();
      basket.x = Math.max(basket.w / 2, Math.min(W - basket.w / 2, clientX - r.left));
    };
    const onMove = (e) => moveTo(e.clientX);
    const onKey = (e) => {
      if (e.key === "ArrowLeft") basket.x = Math.max(basket.w / 2, basket.x - 30);
      if (e.key === "ArrowRight") basket.x = Math.min(W - basket.w / 2, basket.x + 30);
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);

    function loop(now) {
      if (ctx.isOver()) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - t0) / 1000;
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawnIn = Math.max(0.32, 0.6 - elapsed * 0.012);
        items.push({ x: rand(24, Math.max(25, W - 24)), y: -20, vy: 170 + elapsed * 8 + rand(0, 50), bad: Math.random() < 0.28 });
      }
      g.clearRect(0, 0, W, H);
      const by = H - 44;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;
        if (it.y > by - 16 && it.y < by + 24 && Math.abs(it.x - basket.x) < basket.w / 2 + 10) {
          items.splice(i, 1);
          if (it.bad) { ctx.add(-2); ctx.sfx.bad(); } else { ctx.add(1); ctx.sfx.good(); }
          continue;
        }
        if (it.y > H + 30) { items.splice(i, 1); continue; }
        g.font = "30px serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(it.bad ? "🔥" : "☕", it.x, it.y);
      }
      g.font = "52px serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("🧺", basket.x, by);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", fit);
    };
  },
};
