import { CONFIG } from "./config.js";
import { openDB } from "./db.js";
import { GAMES } from "./games/registry.js";
import { runGame } from "./play.js";
import { issueCoupon, fmtCode, renderBarcode } from "./coupon.js";
import { unlock, isMuted, setMuted } from "./sound.js";
import { esc, fmtTime, confetti } from "./util.js";

const app = document.getElementById("app");
const banner = document.getElementById("banner");
document.getElementById("cafeName").textContent = CONFIG.cafeName;
document.title = `${CONFIG.cafeName} 게임`;

const muteBtn = document.getElementById("mute");
const paintMute = () => {
  muteBtn.textContent = isMuted() ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-pressed", String(isMuted()));
  muteBtn.setAttribute("aria-label", isMuted() ? "소리 켜기" : "소리 끄기");
};
muteBtn.onclick = () => { setMuted(!isMuted()); paintMute(); };
paintMute();

const MINE = "cp_mine";
const mine = () => { try { return JSON.parse(localStorage.getItem(MINE) || "[]"); } catch { return []; } };
const addMine = (code) => localStorage.setItem(MINE, JSON.stringify([code, ...mine()]));
const opts = (g) => CONFIG.gameOverrides?.[g.id] || {};
const goalOf = (g) => opts(g).goal ?? g.goal;
const durOf = (g) => opts(g).duration ?? g.duration;

let db = null;
let stopGame = null;
const leave = () => { if (stopGame) { stopGame(); stopGame = null; } };

const stars = (n) => `<span class="lv" role="img" aria-label="난이도 ${n}/3">${"★".repeat(n)}<s>${"★".repeat(3 - n)}</s></span>`;

function home() {
  leave();
  app.innerHTML = `
    <section class="board">
      <div class="chalk">
        <h2>오늘의 게임 <small>${GAMES.length}가지</small></h2>
        <ul class="menu">
          ${GAMES.map((g) => `
            <li><button type="button" data-id="${g.id}">
              <span class="ic">${g.icon}</span><span class="nm">${esc(g.name)}</span>${stars(g.level || 1)}
              <span class="dots"></span><span class="pr">${goalOf(g)}${esc(g.unit)}</span>
            </button></li>`).join("")}
        </ul>
        <p class="hint">오른쪽 숫자가 목표야. 넘기면 커피쿠폰 1장!</p>
      </div>
    </section>
    <button type="button" class="link" id="mine">내 쿠폰 (${mine().length})</button>`;
  app.querySelectorAll(".menu button").forEach((b) => (b.onclick = () => intro(GAMES.find((g) => g.id === b.dataset.id))));
  app.querySelector("#mine").onclick = mineScreen;
}

function intro(g) {
  leave();
  app.innerHTML = `
    <section class="panel center">
      <div class="big">${g.icon}</div>
      <h2>${esc(g.name)}</h2>
      <p>${esc(g.desc)}</p>
      <p class="goal">${durOf(g)}초 안에 ${goalOf(g)}${esc(g.unit)} 달성</p>
      <p class="lvline">난이도 ${stars(g.level || 1)}</p>
      <button type="button" class="btn" id="go">시작</button>
      <button type="button" class="link" id="back">뒤로</button>
    </section>`;
  app.querySelector("#go").onclick = () => { unlock(); play(g); };
  app.querySelector("#back").onclick = home;
}

function play(g) {
  leave();
  app.innerHTML = `<section class="play" id="host"></section><button type="button" class="link" id="quit">그만하기</button>`;
  stopGame = runGame(g, app.querySelector("#host"), opts(g), (r) => { stopGame = null; result(g, r); });
  app.querySelector("#quit").onclick = home;
}

function result(g, r) {
  if (!r.win) {
    app.innerHTML = `
      <section class="panel center">
        <div class="big">😢</div>
        <h2>아쉽다!</h2>
        <p>${r.score} / ${r.goal}${esc(g.unit)} — 조금만 더!</p>
        <button type="button" class="btn" id="again">다시 도전</button>
        <button type="button" class="link" id="home">다른 게임</button>
      </section>`;
    app.querySelector("#again").onclick = () => play(g);
    app.querySelector("#home").onclick = home;
    return;
  }
  app.innerHTML = `
    <section class="panel center">
      <div class="big">🎉</div>
      <h2>성공! 커피쿠폰 1장</h2>
      <p>${r.score} / ${r.goal}${esc(g.unit)} 달성</p>
      <form id="f" class="nameform">
        <label for="nm">쿠폰에 적을 이름</label>
        <input id="nm" maxlength="12" autocomplete="off" placeholder="예: 홍길동" required>
        <p class="err" id="err" role="alert"></p>
        <button class="btn" id="sub">쿠폰 받기</button>
      </form>
    </section>`;
  confetti();
  const form = app.querySelector("#f"), err = app.querySelector("#err"), sub = app.querySelector("#sub");
  let busy = false;
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const name = form.nm.value.trim().slice(0, 12);
    if (!name) { err.textContent = "이름을 입력해줘."; return; }
    const max = CONFIG.maxCouponsPerDevice;
    if (max > 0 && mine().length >= max) { err.textContent = `이 기기에서는 쿠폰을 ${max}장까지만 받을 수 있어.`; return; }
    busy = true; sub.disabled = true; err.textContent = "";
    try {
      const c = await issueCoupon(db, { name, game: g.name, gameId: g.id, score: r.score, goal: r.goal });
      addMine(c.code);
      ticket(c);
    } catch (ex) {
      console.error(ex);
      err.textContent = "발급에 실패했어. 네트워크 확인하고 다시 눌러줘.";
      busy = false; sub.disabled = false;
    }
  };
}

function ticket(c) {
  app.innerHTML = `
    <section class="receipt${c.used ? " used" : ""}">
      <h2>${esc(CONFIG.cafeName)} 커피쿠폰</h2>
      <dl>
        <dt>이름</dt><dd>${esc(c.name)}</dd>
        <dt>게임</dt><dd>${esc(c.game)} (${c.score}/${c.goal})</dd>
        <dt>발급</dt><dd>${fmtTime(c.issuedAt)}</dd>
      </dl>
      <svg id="bc" class="barcode" aria-label="쿠폰 바코드"></svg>
      <p class="code">${fmtCode(c.code)}</p>
      <p class="state">${c.used ? "사용 완료" : "직원에게 이 화면을 보여줘"}</p>
      ${c.used ? '<span class="stamp">사용 완료</span>' : ""}
    </section>
    <button type="button" class="btn" id="home">처음으로</button>`;
  if (!renderBarcode(app.querySelector("#bc"), c.code)) app.querySelector("#bc").remove();
  app.querySelector("#home").onclick = home;
}

async function mineScreen() {
  const codes = mine();
  app.innerHTML = `<section class="panel"><h2>내 쿠폰</h2><ul class="mine" id="ml"><li>불러오는 중…</li></ul><button type="button" class="link" id="back">뒤로</button></section>`;
  app.querySelector("#back").onclick = home;
  const list = app.querySelector("#ml");
  try {
    const items = (await Promise.all(codes.map((c) => db.get(c)))).filter(Boolean);
    list.innerHTML = items.length
      ? items.map((c) => `<li><button type="button" data-c="${esc(c.code)}"><span>${esc(c.game)} · ${fmtTime(c.issuedAt)}</span><b>${c.used ? "사용 완료" : "사용 가능"}</b></button></li>`).join("")
      : "<li>아직 받은 쿠폰이 없어.</li>";
    list.querySelectorAll("button").forEach((b) => (b.onclick = () => ticket(items.find((x) => x.code === b.dataset.c))));
  } catch (e) {
    console.error(e);
    list.innerHTML = "<li>쿠폰을 불러오지 못했어.</li>";
  }
}

(async function boot() {
  try {
    db = await openDB();
  } catch (e) {
    console.error(e);
    banner.hidden = false;
    banner.textContent = "서버 연결에 실패했어. Firebase 설정(js/config.js)을 확인해줘.";
    app.innerHTML = "";
    return;
  }
  if (db.mode === "local") {
    banner.hidden = false;
    banner.textContent = "데모 모드: 쿠폰이 이 브라우저에만 저장돼. (js/config.js에 Firebase 설정 필요)";
  }
  home();
})();
