import { rand, shuffle } from "../util.js";

function makeQ(level) {
  let a, b, op, ans;
  const r = Math.random();
  if (level < 3 || r < 0.4) { op = "+"; a = rand(10, 20 + level * 10); b = rand(5, 20 + level * 5); ans = a + b; }
  else if (r < 0.7) { op = "−"; a = rand(30, 90); b = rand(5, a - 5); ans = a - b; }
  else { op = "×"; a = rand(3, 9); b = rand(3, 9 + Math.min(level, 3)); ans = a * b; }
  const set = new Set([ans]);
  while (set.size < 4) {
    const d = rand(1, 10) * (Math.random() < 0.5 ? -1 : 1);
    if (ans + d > 0) set.add(ans + d);
  }
  return { text: `${a} ${op} ${b}`, ans, options: shuffle([...set]) };
}

export default {
  id: "math", name: "번개 계산", icon: "🧮", unit: "문제", level: 2,
  desc: "계산식을 보고 정답을 빨리 눌러! 틀리면 점수 없이 다음 문제로 넘어가.", goal: 9, duration: 25,
  mount(el, ctx) {
    let level = 0, cur = null, lock = false;
    el.innerHTML = `<div class="math"><div class="math-q" id="mq"></div><div class="math-opts" id="mo"></div></div>`;
    const qEl = el.querySelector("#mq"), oEl = el.querySelector("#mo");
    const next = () => {
      cur = makeQ(level++);
      qEl.textContent = cur.text + " = ?";
      oEl.innerHTML = "";
      cur.options.forEach((v) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "opt"; b.textContent = v; b.dataset.v = v;
        oEl.appendChild(b);
      });
      lock = false;
    };
    const onClick = (e) => {
      const b = e.target.closest(".opt");
      if (!b || lock || ctx.isOver()) return;
      lock = true;
      if (Number(b.dataset.v) === cur.ans) { b.classList.add("right"); ctx.sfx.good(); ctx.add(1); }
      else { b.classList.add("wrong"); ctx.sfx.bad(); }
      setTimeout(() => { if (!ctx.isOver()) next(); }, 220);
    };
    oEl.addEventListener("click", onClick);
    next();
    return () => oEl.removeEventListener("click", onClick);
  },
};
