export default {
  id: "tap", name: "100m 달리기", icon: "🏃", unit: "번", level: 1,
  desc: "버튼을 미친 듯이 연타해서 결승선까지 달려! (10초 안에 50번)", goal: 50, duration: 10,
  mount(el, ctx) {
    el.innerHTML = `
      <div class="run">
        <div class="track" aria-hidden="true"><span class="runner" id="rn">🏃</span><span class="flag">🏁</span></div>
        <button class="run-btn" type="button" aria-label="연타">RUN!</button>
      </div>`;
    const b = el.querySelector(".run-btn"), rn = el.querySelector("#rn");
    let n = 0;
    const hit = () => {
      n++;
      rn.style.left = 2 + Math.min(1, n / ctx.goal) * 78 + "%";
      ctx.add(1);
      ctx.sfx.tap();
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    };
    const onDown = (e) => { e.preventDefault(); hit(); };
    const onClick = (e) => { if (e.detail === 0) hit(); };
    b.addEventListener("pointerdown", onDown);
    b.addEventListener("click", onClick);
    return () => { b.removeEventListener("pointerdown", onDown); b.removeEventListener("click", onClick); };
  },
};
