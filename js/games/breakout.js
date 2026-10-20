export default {
  id: "breakout", name: "벽돌깨기", icon: "🧱", unit: "개", level: 2,
  desc: "바를 움직여 공을 튕겨서 벽돌을 깨! 공을 3번 놓치면 끝나.", goal: 20, duration: 45,
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

    const COLS = 7, ROWS = 4, GAP = 4, TOP = 40, SIDE = 10, BH = 20, R = 6;
    const ROWCOL = ["#ff2e97", "#ff8a1f", "#ffe14a", "#5dff7a"];
    const paddle = { x: W / 2, y: H - 34, w: 88, h: 12 };
    const ball = { x: W / 2, y: paddle.y - R - 1, vx: 0, vy: 0 };
    let bricks = [], lives = 3, serve = 0.9, broken = 0, last = performance.now(), raf = 0;

    const build = () => {
      const bw = (W - SIDE * 2 - GAP * (COLS - 1)) / COLS;
      bricks = [];
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          bricks.push({ x: SIDE + c * (bw + GAP), y: TOP + r * (BH + GAP), w: bw, h: BH, color: ROWCOL[r] });
    };
    build();
    const speed = () => Math.min(540, 300 + broken * 6);
    const place = () => { ball.x = paddle.x; ball.y = paddle.y - R - 1; ball.vx = 0; ball.vy = 0; serve = 0.9; };
    const launch = () => {
      const a = (Math.random() * 40 - 20) * Math.PI / 180, s = speed();
      ball.vx = s * Math.sin(a); ball.vy = -s * Math.cos(a);
    };

    const setX = (cx) => {
      const r = cv.getBoundingClientRect();
      paddle.x = Math.max(paddle.w / 2, Math.min(W - paddle.w / 2, cx - r.left));
    };
    const onMove = (e) => setX(e.clientX);
    const onKey = (e) => {
      if (e.key === "ArrowLeft") paddle.x = Math.max(paddle.w / 2, paddle.x - 34);
      if (e.key === "ArrowRight") paddle.x = Math.min(W - paddle.w / 2, paddle.x + 34);
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", fit);
    place();

    function loop(now) {
      if (ctx.isOver()) return;
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (serve > 0) {
        serve -= dt;
        ball.x = paddle.x; ball.y = paddle.y - R - 1;
        if (serve <= 0) launch();
      } else {
        // 빠른 공이 벽돌을 뚫지 않게 잘게 나눠서 이동
        const steps = Math.ceil((Math.hypot(ball.vx, ball.vy) * dt) / 4) || 1;
        for (let i = 0; i < steps && !ctx.isOver(); i++) {
          ball.x += (ball.vx * dt) / steps;
          ball.y += (ball.vy * dt) / steps;
          if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
          if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
          if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); }
          if (ball.vy > 0 && ball.y + R >= paddle.y && ball.y + R <= paddle.y + paddle.h + 8 && Math.abs(ball.x - paddle.x) <= paddle.w / 2 + R) {
            const rel = Math.max(-1, Math.min(1, (ball.x - paddle.x) / (paddle.w / 2)));
            const a = rel * 60 * Math.PI / 180, s = speed();
            ball.vx = s * Math.sin(a); ball.vy = -s * Math.cos(a);
            ball.y = paddle.y - R;
            ctx.sfx.tap();
          }
          for (const b of bricks) {
            if (!b.alive && b.alive !== undefined) continue;
            const cx = Math.max(b.x, Math.min(ball.x, b.x + b.w)), cy = Math.max(b.y, Math.min(ball.y, b.y + b.h));
            const dx = ball.x - cx, dy = ball.y - cy;
            if (dx * dx + dy * dy < R * R) {
              b.alive = false;
              if (Math.abs(dx) > Math.abs(dy)) ball.vx = dx > 0 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
              else ball.vy = dy > 0 ? Math.abs(ball.vy) : -Math.abs(ball.vy);
              broken++;
              ctx.sfx.good();
              ctx.add(1);
              break;
            }
          }
          bricks = bricks.filter((b) => b.alive !== false);
          if (!bricks.length) build();
        }
        if (ball.y > H + R) {
          lives--;
          ctx.sfx.bad();
          if (lives <= 0) return ctx.finish();
          place();
        }
      }
      g.clearRect(0, 0, W, H);
      for (const b of bricks) { g.fillStyle = b.color; g.fillRect(b.x, b.y, b.w, b.h); g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(b.x, b.y, b.w, 3); }
      g.fillStyle = "#19e3ff"; g.fillRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h);
      g.fillStyle = "#ffffff"; g.fillRect(ball.x - R, ball.y - R, R * 2, R * 2);
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
