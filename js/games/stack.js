export default {
  id: "stack", name: "탑 쌓기", icon: "🏗️", unit: "층", level: 3,
  desc: "움직이는 블록을 타이밍 맞춰 눌러서 쌓아! 어긋난 만큼 잘려 나가고, 완전히 빗나가면 끝나.", goal: 10, duration: 40,
  mount(el, ctx) {
    const cv = document.createElement("canvas");
    cv.className = "game-canvas";
    el.appendChild(cv);
    const g = cv.getContext("2d");
    let W = 300, H = 400;
    const BH = 26;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const baseW = Math.min(190, W * 0.6);
    const stack = [{ x: (W - baseW) / 2, w: baseW }];
    const mv = { x: 0, w: baseW, dir: 1 };
    let last = performance.now(), raf = 0, dead = false;
    const color = (i) => `hsl(${28 + i * 16}, 85%, ${58 - Math.min(i, 8)}%)`;
    const speed = () => 150 + stack.length * 20;

    function drop(e) {
      if (e) e.preventDefault();
      if (ctx.isOver() || dead) return;
      const top = stack[stack.length - 1];
      const l = Math.max(top.x, mv.x), r = Math.min(top.x + top.w, mv.x + mv.w);
      const overlap = r - l;
      if (overlap <= 4) { dead = true; ctx.sfx.bad(); ctx.finish(); return; }
      const perfect = Math.abs(mv.x - top.x) < 5;
      stack.push(perfect ? { x: top.x, w: top.w } : { x: l, w: overlap });
      mv.w = stack[stack.length - 1].w;
      mv.x = mv.dir > 0 ? 0 : W - mv.w;
      ctx.add(1);
      ctx.sfx.tap();
    }
    const onKey = (e) => { if (e.key === " " || e.key === "Enter") drop(e); };
    cv.addEventListener("pointerdown", drop);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);

    function loop(now) {
      if (ctx.isOver()) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      mv.x += mv.dir * speed() * dt;
      if (mv.x <= 0) { mv.x = 0; mv.dir = 1; }
      if (mv.x + mv.w >= W) { mv.x = W - mv.w; mv.dir = -1; }
      g.clearRect(0, 0, W, H);
      const y0 = H * 0.28, n = stack.length;
      stack.forEach((b, k) => {
        g.fillStyle = color(k);
        g.fillRect(b.x, y0 + BH * (n - k), b.w, BH - 2);
      });
      g.fillStyle = color(n);
      g.fillRect(mv.x, y0, mv.w, BH - 2);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", drop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", fit);
    };
  },
};
