import { shuffle } from "../util.js";

export default {
  id: "memory", name: "짝 맞추기", icon: "🃏", unit: "쌍", level: 1,
  desc: "안주 카드를 뒤집어 같은 그림 6쌍을 모두 찾아봐!", goal: 6, duration: 40,
  mount(el, ctx) {
    const faces = ["☕", "🍢", "🍜", "🥟", "🍡", "🍶"];
    const deck = shuffle([...faces, ...faces]);
    el.innerHTML = `<div class="mem">${deck.map((f, i) => `<button type="button" class="card" data-i="${i}" aria-label="카드"><span class="back">?</span><span class="face">${f}</span></button>`).join("")}</div>`;
    const grid = el.querySelector(".mem");
    let first = null, lock = false;
    const timers = [];
    const onClick = (e) => {
      const c = e.target.closest(".card");
      if (!c || lock || ctx.isOver() || c.classList.contains("open") || c.classList.contains("done")) return;
      c.classList.add("open");
      ctx.sfx.tap();
      if (!first) { first = c; return; }
      const a = first; first = null;
      if (deck[a.dataset.i] === deck[c.dataset.i]) {
        a.classList.add("done"); c.classList.add("done");
        ctx.sfx.good(); ctx.add(1);
      } else {
        lock = true;
        timers.push(setTimeout(() => { a.classList.remove("open"); c.classList.remove("open"); lock = false; }, 650));
      }
    };
    grid.addEventListener("click", onClick);
    return () => { grid.removeEventListener("click", onClick); timers.forEach(clearTimeout); };
  },
};
