import { rand, shuffle } from "../util.js";

const COLORS = [
  { n: "빨강", c: "#ff5a4d" },
  { n: "파랑", c: "#4aa3ff" },
  { n: "초록", c: "#34b58a" },
  { n: "노랑", c: "#ffd23f" },
];

export default {
  id: "stroop", name: "색깔 헷갈려", icon: "🎨", unit: "문제", level: 3,
  desc: "글자 뜻 말고 글자의 '색깔'을 맞혀! 예: 빨강 이라고 쓰인 파란 글씨 → 파랑", goal: 12, duration: 25,
  mount(el, ctx) {
    el.innerHTML = `<div class="stroop"><div class="st-word" id="sw"></div><div class="st-opts" id="so"></div></div>`;
    const word = el.querySelector("#sw"), opts = el.querySelector("#so");
    let ink = null, lock = false;
    opts.innerHTML = shuffle(COLORS).map((c) => `<button type="button" class="opt" data-n="${c.n}">${c.n}</button>`).join("");
    const next = () => {
      ink = COLORS[rand(0, 3)];
      let w; do { w = COLORS[rand(0, 3)]; } while (w === ink);
      word.textContent = w.n;
      word.style.color = ink.c;
      lock = false;
    };
    const onClick = (e) => {
      const b = e.target.closest(".opt");
      if (!b || lock || ctx.isOver()) return;
      lock = true;
      if (b.dataset.n === ink.n) { b.classList.add("right"); ctx.sfx.good(); ctx.add(1); }
      else { b.classList.add("wrong"); ctx.sfx.bad(); }
      setTimeout(() => { b.classList.remove("right", "wrong"); if (!ctx.isOver()) next(); }, 200);
    };
    opts.addEventListener("click", onClick);
    next();
    return () => opts.removeEventListener("click", onClick);
  },
};
