export default {
  id: "reaction", name: "번개 반응", icon: "⚡", unit: "번", level: 2,
  desc: "화면이 초록색으로 바뀌는 순간 눌러! 0.45초 안에 눌러야 성공, 일찍 누르면 실패야. 5번 중 4번!", goal: 4, duration: 45,
  mount(el, ctx) {
    const LIMIT = 450, ROUNDS = 5;
    el.innerHTML = `<button type="button" class="react wait" id="rb"><span class="r-big" id="rt">준비…</span><span class="r-sub" id="rs"></span></button>`;
    const b = el.querySelector("#rb"), big = el.querySelector("#rt"), sub = el.querySelector("#rs");
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
    let phase = "idle", round = 0, goAt = 0;

    const setView = (cls, t, s = "") => { b.className = "react " + cls; big.textContent = t; sub.textContent = s; };
    const next = () => {
      if (ctx.isOver()) return;
      if (round >= ROUNDS) return ctx.finish();
      phase = "wait";
      setView("wait", "기다려…", `${round + 1} / ${ROUNDS}`);
      later(() => {
        phase = "go"; goAt = performance.now();
        setView("go", "지금!", `${round + 1} / ${ROUNDS}`);
      }, 1000 + Math.random() * 2200);
    };
    const settle = (ok, t, s) => {
      phase = "result"; round++;
      setView(ok ? "ok" : "no", t, s);
      ok ? ctx.sfx.good() : ctx.sfx.bad();
      if (ok) ctx.add(1);
      later(next, 1000);
    };
    const onDown = (e) => {
      e.preventDefault();
      if (ctx.isOver()) return;
      if (phase === "wait") {
        timers.forEach(clearTimeout); timers.clear();
        settle(false, "너무 빨라!", "초록색이 된 다음에 눌러");
      } else if (phase === "go") {
        const ms = Math.round(performance.now() - goAt);
        settle(ms <= LIMIT, ms <= LIMIT ? `${ms}ms 성공!` : `${ms}ms 느려!`, ms <= LIMIT ? "" : `${LIMIT}ms 안에 눌러야 해`);
      }
    };
    b.addEventListener("pointerdown", onDown);
    b.addEventListener("click", (e) => { if (e.detail === 0) onDown(e); });
    later(next, 400);
    return () => { b.removeEventListener("pointerdown", onDown); timers.forEach(clearTimeout); };
  },
};
