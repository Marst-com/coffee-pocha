import { rand } from "../util.js";

const INVADER = ["00100100", "00011000", "00111100", "01111110", "11011011", "11111111", "10100101", "01000010"];
const SHIP = ["000010000", "000111000", "000111000", "011111110", "111111111", "111111111"];
const PX = 4;

function sprite(map, color) {
  const c = document.createElement("canvas");
  c.width = map[0].length * PX; c.height = map.length * PX;
  const g = c.getContext("2d");
  g.fillStyle = color;
  map.forEach((row, y) => [...row].forEach((v, x) => { if (v === "1") g.fillRect(x * PX, y * PX, PX, PX); }));
  return c;
}

export default {
  id: "space", name: "우주 전쟁", icon: "👾", unit: "마리", level: 2,
  desc: "손가락으로 우주선을 움직여! 총알은 자동으로 나가. 침략자 14마리를 잡아. 부딪히면 목숨이 깎여!", goal: 14, duration: 30,
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
      g.imageSmoothingEnabled = false;
    };
    fit();
    const invA = sprite(INVADER, "#5dff7a"), invB = sprite(INVADER, "#ff8a1f"), shipS = sprite(SHIP, "#19e3ff");
    const ship = { x: W / 2, y: H - 40 };
    const bullets = [], enemies = [], sparks = [];
    let lives = 3, fireIn = 0, spawnIn = 0.4, hurt = 0, t = 0, last = performance.now(), raf = 0;

    const setX = (cx) => { const r = cv.getBoundingClientRect(); ship.x = Math.max(20, Math.min(W - 20, cx - r.left)); };
    const onMove = (e) => setX(e.clientX);
    const onKey = (e) => {
      if (e.key === "ArrowLeft") ship.x = Math.max(20, ship.x - 30);
      if (e.key === "ArrowRight") ship.x = Math.min(W - 20, ship.x + 30);
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);

    function loop(now) {
      if (ctx.isOver()) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt; hurt = Math.max(0, hurt - dt);
      fireIn -= dt; spawnIn -= dt;
      if (fireIn <= 0) { fireIn = 0.26; bullets.push({ x: ship.x, y: ship.y - 16 }); ctx.sfx.shoot(); }
      if (spawnIn <= 0) {
        spawnIn = Math.max(0.45, 0.85 - t * 0.012);
        enemies.push({ x0: rand(30, Math.max(31, W - 30)), y: -20, vy: 70 + t * 3 + rand(0, 30), ph: Math.random() * 6, a: Math.random() < 0.5 });
      }
      for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= 560 * dt; if (bullets[i].y < -10) bullets.splice(i, 1); }
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.vy * dt; e.x = e.x0 + Math.sin(t * 2 + e.ph) * 22;
        let dead = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
          if (Math.abs(bullets[j].x - e.x) < 18 && Math.abs(bullets[j].y - e.y) < 18) {
            bullets.splice(j, 1); dead = true; break;
          }
        }
        if (dead) {
          for (let k = 0; k < 8; k++) sparks.push({ x: e.x, y: e.y, vx: rand(-120, 120), vy: rand(-120, 120), life: 0.35 });
          enemies.splice(i, 1);
          ctx.sfx.good(); ctx.add(1);
          if (ctx.isOver()) return;
          continue;
        }
        if (hurt <= 0 && Math.abs(e.x - ship.x) < 24 && Math.abs(e.y - ship.y) < 20) {
          enemies.splice(i, 1); lives--; hurt = 1; ctx.sfx.bad();
          if (lives <= 0) return ctx.finish();
          continue;
        }
        if (e.y > H + 20) enemies.splice(i, 1);
      }
      for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; if (s.life <= 0) sparks.splice(i, 1); }

      g.clearRect(0, 0, W, H);
      g.fillStyle = "rgba(255,255,255,.7)";
      for (let i = 0; i < 24; i++) g.fillRect((i * 97) % W, ((i * 53 + t * (20 + (i % 3) * 14)) % H), 2, 2); // 별
      enemies.forEach((e) => g.drawImage(e.a ? invA : invB, Math.round(e.x - invA.width / 2), Math.round(e.y - invA.height / 2)));
      g.fillStyle = "#ffe14a";
      bullets.forEach((b) => g.fillRect(Math.round(b.x - 2), Math.round(b.y - 8), 4, 12));
      g.fillStyle = "#ffffff";
      sparks.forEach((s) => g.fillRect(Math.round(s.x), Math.round(s.y), 3, 3));
      if (hurt <= 0 || Math.floor(hurt * 12) % 2) g.drawImage(shipS, Math.round(ship.x - shipS.width / 2), Math.round(ship.y - shipS.height / 2));
      g.fillStyle = "#ff2e97"; g.font = "16px sans-serif"; g.textBaseline = "top"; g.textAlign = "left";
      g.fillText("♥".repeat(Math.max(0, lives)), 10, 10);
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
