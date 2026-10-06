import { rand } from "../util.js";

const TRIES = 8;

export default {
  id: "timing", name: "타이밍 샷", icon: "🎯", unit: "번", level: 3,
  desc: "움직이는 막대가 초록 칸에 있을 때 '멈춰!'를 눌러. 8번 중 5번 성공하면 끝!", goal: 5, duration: 40,
  mount(el, ctx) {
    el.innerHTML = `
      <div class="timing">
        <div class="tries" id="tr"></div>
        <div class="bar"><div class="zone" id="zn"></div><div class="mark" id="mk"></div></div>
        <button type="button" class="stop-btn" id="sb">멈춰!</button>
        <div class="tmsg" id="tm">&nbsp;</div>
      </div>`;
    const zn = el.querySelector("#zn"), mk = el.querySelector("#mk"), tr = el.querySelector("#tr"), tm = el.querySelector("#tm"), sb = el.querySelector("#sb");
    let round = 0, pos = 0, dir = 1, center = 0.5, width = 0.2, last = performance.now(), raf = 0, frozen = false;
    const timers = [];

    const setRound = () => {
      width = Math.max(0.09, 0.22 - round * 0.018);
      center = 0.2 + Math.random() * 0.6;
      zn.style.left = (center - width / 2) * 100 + "%";
      zn.style.width = width * 100 + "%";
      tr.textContent = `남은 기회 ${TRIES - round}번`;
    };
    setRound();

    function loop(now) {
      if (ctx.isOver()) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!frozen) {
        pos += dir * dt * (0.9 + round * 0.18);
        if (pos >= 1) { pos = 1; dir = -1; }
        if (pos <= 0) { pos = 0; dir = 1; }
        mk.style.left = pos * 100 + "%";
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const stop = (e) => {
      if (e) e.preventDefault();
      if (frozen || ctx.isOver()) return;
      frozen = true;
      const hit = Math.abs(pos - center) <= width / 2;
      tm.textContent = hit ? "명중! 👍" : "아깝다!";
      if (hit) { ctx.sfx.good(); ctx.add(1); } else ctx.sfx.bad();
      round++;
      timers.push(setTimeout(() => {
        if (ctx.isOver()) return;
        if (round >= TRIES) return ctx.finish();
        tm.innerHTML = "&nbsp;";
        setRound();
        frozen = false;
      }, 600));
    };
    sb.addEventListener("pointerdown", stop);
    sb.addEventListener("click", (e) => { if (e.detail === 0) stop(); });
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); sb.removeEventListener("pointerdown", stop); };
  },
};
