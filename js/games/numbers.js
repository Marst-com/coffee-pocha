import { shuffle } from "../util.js";

export default {
  id: "numbers", name: "숫자 순서대로", icon: "🔢", unit: "개", level: 2,
  desc: "1부터 16까지 순서대로 최대한 빨리 눌러!", goal: 16, duration: 28,
  mount(el, ctx) {
    const nums = shuffle(Array.from({ length: 16 }, (_, i) => i + 1));
    el.innerHTML = `<div class="nums">${nums.map((n) => `<button type="button" class="num" data-n="${n}">${n}</button>`).join("")}</div>`;
    const grid = el.querySelector(".nums");
    let want = 1;
    const onDown = (e) => {
      const b = e.target.closest(".num");
      if (!b || ctx.isOver() || b.classList.contains("done")) return;
      if (+b.dataset.n === want) { want++; b.classList.add("done"); ctx.sfx.tap(); ctx.add(1); }
      else { b.classList.add("wrong"); ctx.sfx.bad(); setTimeout(() => b.classList.remove("wrong"), 200); }
    };
    grid.addEventListener("pointerdown", onDown);
    return () => grid.removeEventListener("pointerdown", onDown);
  },
};
