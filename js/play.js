import { sfx } from "./sound.js";

// game.mount(el, ctx) → cleanup 함수 반환
// ctx: { goal, duration, sfx, add(n), finish(), isOver() }
export function runGame(game, host, opts, onEnd) {
  const goal = opts.goal ?? game.goal;
  const duration = opts.duration ?? game.duration;
  host.innerHTML = `
    <div class="hud">
      <div class="hud-top"><span>${game.icon} ${game.name}</span><span class="hud-time" id="hTime">${duration}</span></div>
      <div class="meter"><i id="hFill"></i></div>
      <div class="hud-score"><b id="hScore">0</b> / ${goal}${game.unit}</div>
    </div>
    <div class="game-area" id="gArea"></div>
    <div class="countdown" id="gCount"></div>`;
  const q = (s) => host.querySelector(s);

  let score = 0, over = false, started = false, cleanup = null, raf = 0, endAt = 0;
  const timers = [];

  const render = () => {
    q("#hScore").textContent = score;
    q("#hFill").style.width = Math.min(100, (score / goal) * 100) + "%";
  };

  function teardown() {
    over = true;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  }

  function finish() {
    if (over) return;
    teardown();
    const win = score >= goal;
    win ? sfx.win() : sfx.lose();
    setTimeout(() => onEnd({ score, goal, win }), 500);
  }

  const ctx = {
    goal, duration, sfx,
    isOver: () => over,
    add(n = 1) {
      if (over || !started) return;
      score = Math.max(0, score + n);
      render();
      if (score >= goal) finish();
    },
    finish,
  };

  function tick() {
    if (over) return;
    const left = Math.max(0, (endAt - performance.now()) / 1000);
    q("#hTime").textContent = Math.ceil(left);
    if (left <= 0) return finish();
    raf = requestAnimationFrame(tick);
  }

  let n = 3;
  (function step() {
    if (over) return;
    if (n === 0) {
      q("#gCount").remove();
      started = true;
      endAt = performance.now() + duration * 1000;
      cleanup = game.mount(q("#gArea"), ctx);
      raf = requestAnimationFrame(tick);
      return;
    }
    q("#gCount").textContent = n;
    sfx.tick();
    n--;
    timers.push(setTimeout(step, 700));
  })();

  return teardown; // 중간에 그만둘 때
}
