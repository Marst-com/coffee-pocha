import { rand } from "../util.js";

export default {
  id: "whack", name: "두더지 잡기", icon: "🐹", unit: "마리", level: 2,
  desc: "튀어나오는 🐹를 콕! 🍶소주병은 건드리면 감점이야.", goal: 15, duration: 20,
  mount(el, ctx) {
    el.innerHTML = `<div class="whack">${Array.from({ length: 9 }, (_, i) => `<button type="button" class="hole" data-i="${i}" aria-label="구멍"><span class="pop"></span></button>`).join("")}</div>`;
    const holes = [...el.querySelectorAll(".hole")];
    const state = holes.map(() => ({ type: null, t: 0 }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
    const t0 = performance.now();

    const hide = (i) => {
      state[i].type = null;
      holes[i].classList.remove("up");
      holes[i].querySelector(".pop").textContent = "";
    };
    const spawn = () => {
      if (ctx.isOver()) return;
      const el_s = (performance.now() - t0) / 1000;
      const free = state.map((s, i) => (s.type ? -1 : i)).filter((i) => i >= 0);
      if (free.length) {
        const i = free[rand(0, free.length - 1)];
        const type = Math.random() < 0.8 ? "mole" : "bottle";
        state[i].type = type;
        holes[i].querySelector(".pop").textContent = type === "mole" ? "🐹" : "🍶";
        holes[i].classList.add("up");
        const token = ++state[i].t;
        later(() => { if (state[i].t === token) hide(i); }, Math.max(560, 950 - el_s * 20));
      }
      later(spawn, Math.max(380, 680 - el_s * 14));
    };
    const onClick = (e) => {
      const h = e.target.closest(".hole");
      if (!h || ctx.isOver()) return;
      const i = +h.dataset.i, s = state[i];
      if (!s.type) return;
      if (s.type === "mole") { ctx.sfx.good(); ctx.add(1); } else { ctx.sfx.bad(); ctx.add(-2); }
      s.t++; hide(i);
    };
    el.addEventListener("pointerdown", onClick);
    later(spawn, 300);
    return () => { el.removeEventListener("pointerdown", onClick); timers.forEach(clearTimeout); };
  },
};
