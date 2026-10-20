import { shuffle } from "../util.js";

const MAX = 9;

export default {
  id: "baseball", name: "숫자 야구", icon: "⚾", unit: "정답", level: 3, goalLabel: "정답!", goalLine: "9번 안에 숫자 3개 맞히기",
  desc: "컴퓨터가 정한 서로 다른 숫자 3개를 맞혀봐! 숫자와 자리가 모두 맞으면 S, 숫자만 맞으면 B, 하나도 없으면 OUT. 9번 안에 맞히면 성공!",
  goal: 1, duration: 100,
  mount(el, ctx) {
    const secret = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
    let cur = [], tries = 0;
    el.innerHTML = `
      <div class="bb">
        <div class="bb-top"><span>남은 기회 <b id="bt">${MAX}</b>번</span></div>
        <ol class="bb-log" id="bl" aria-live="polite"></ol>
        <div class="bb-cur" id="bc" aria-label="입력한 숫자"></div>
        <div class="bb-pad" id="bp">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="key" data-k="${n}">${n}</button>`).join("")}
          <button type="button" class="key fn" data-k="del">지움</button>
          <button type="button" class="key" data-k="0">0</button>
          <button type="button" class="key fn ok" data-k="ok">확인</button>
        </div>
      </div>`;
    const log = el.querySelector("#bl"), curEl = el.querySelector("#bc"), pad = el.querySelector("#bp"), left = el.querySelector("#bt");

    const render = () => {
      curEl.innerHTML = [0, 1, 2].map((i) => `<span class="slot">${cur[i] ?? "·"}</span>`).join("");
      pad.querySelectorAll(".key").forEach((k) => {
        const d = k.dataset.k;
        if (/^\d$/.test(d)) k.disabled = cur.includes(+d) || cur.length >= 3;
      });
    };
    const judge = (g) => {
      let s = 0, b = 0;
      g.forEach((d, i) => { if (d === secret[i]) s++; else if (secret.includes(d)) b++; });
      return { s, b };
    };
    const submit = () => {
      if (cur.length !== 3 || ctx.isOver()) return;
      const { s, b } = judge(cur);
      tries++;
      left.textContent = MAX - tries;
      const li = document.createElement("li");
      li.innerHTML = `<span class="g">${cur.join(" ")}</span><span class="r${s === 0 && b === 0 ? " out" : ""}">${s === 0 && b === 0 ? "OUT" : `${s}S ${b}B`}</span>`;
      log.appendChild(li);
      log.scrollTop = log.scrollHeight;
      cur = [];
      render();
      if (s === 3) { ctx.sfx.good(); ctx.add(1); }
      else if (tries >= MAX) ctx.finish();
      else ctx.sfx.tap();
    };
    const onClick = (e) => {
      const k = e.target.closest(".key");
      if (!k || k.disabled || ctx.isOver()) return;
      const d = k.dataset.k;
      if (d === "del") cur.pop();
      else if (d === "ok") return submit();
      else if (cur.length < 3 && !cur.includes(+d)) cur.push(+d);
      ctx.sfx.tap();
      render();
    };
    pad.addEventListener("click", onClick);
    render();
    return () => pad.removeEventListener("click", onClick);
  },
};
