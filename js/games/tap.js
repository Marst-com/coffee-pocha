export default {
  id: "tap", name: "연타 왕", icon: "👆", unit: "번", level: 1,
  desc: "커피잔을 최대한 빠르게 연타해!", goal: 50, duration: 10,
  mount(el, ctx) {
    el.innerHTML = `<div class="tap-wrap"><button class="tap-btn" type="button" aria-label="연타">☕</button></div>`;
    const b = el.querySelector("button");
    const hit = () => {
      ctx.add(1);
      ctx.sfx.tap();
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    };
    const onDown = (e) => { e.preventDefault(); hit(); };
    const onClick = (e) => { if (e.detail === 0) hit(); }; // 키보드(스페이스/엔터)
    b.addEventListener("pointerdown", onDown);
    b.addEventListener("click", onClick);
    return () => { b.removeEventListener("pointerdown", onDown); b.removeEventListener("click", onClick); };
  },
};
