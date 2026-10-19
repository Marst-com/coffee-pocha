import { CONFIG } from "./config.js";
import { openDB } from "./db.js";
import { GAMES } from "./games/registry.js";
import { runGame } from "./play.js";
import { issueCoupon, fmtCode, renderBarcode } from "./coupon.js";
import { unlock, isMuted, setMuted, sfx } from "./sound.js";
import { esc, fmtTime, confetti } from "./util.js";

const app = document.getElementById("app");
const banner = document.getElementById("banner");
document.getElementById("cafeName").textContent = CONFIG.cafeName;
document.title = CONFIG.cafeName;

const muteBtn = document.getElementById("mute");
const paintMute = () => {
  muteBtn.textContent = isMuted() ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-pressed", String(isMuted()));
  muteBtn.setAttribute("aria-label", isMuted() ? "소리 켜기" : "소리 끄기");
};
muteBtn.onclick = () => { setMuted(!isMuted()); paintMute(); };
paintMute();

const NOTE_MAX = 40;
const MINE = "cp_mine";
const mine = () => { try { return JSON.parse(localStorage.getItem(MINE) || "[]"); } catch { return []; } };
const addMine = (code) => localStorage.setItem(MINE, JSON.stringify([code, ...mine()]));
const opts = (g) => CONFIG.gameOverrides?.[g.id] || {};
const goalOf = (g) => opts(g).goal ?? g.goal;
const durOf = (g) => opts(g).duration ?? g.duration;
const noteOf = (c) => c.note ?? c.name ?? "";

let db = null;
let stopGame = null;
const leave = () => { document.body.classList.remove("playing"); if (stopGame) { stopGame(); stopGame = null; } };
const goalText = (g) => g.goalLabel || `${goalOf(g)}${g.unit}`;

const stars = (n) => `<span class="lv" role="img" aria-label="난이도 ${n}/3">${"★".repeat(n)}<s>${"★".repeat(3 - n)}</s></span>`;

function home() {
  leave();
  app.innerHTML = `
    <p class="insert" aria-hidden="true">INSERT COIN</p>
    <section class="board">
      <h2>SELECT GAME <small>${GAMES.length}종</small></h2>
      <ul class="menu">
        ${GAMES.map((g, i) => `
          <li><button type="button" data-id="${g.id}">
            <span class="no">${String(i + 1).padStart(2, "0")}</span><span class="ic">${g.icon}</span><span class="nm">${esc(g.name)}</span>${stars(g.level || 1)}
            <span class="dots"></span><span class="pr">${esc(goalText(g))}</span>
          </button></li>`).join("")}
      </ul>
      <p class="hint">오른쪽 숫자가 목표야. 넘기면 커피쿠폰 1장!</p>
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
      <p class="goal">${g.goalLine ? esc(g.goalLine) : `${durOf(g)}초 안에 ${goalOf(g)}${esc(g.unit)} 달성`}</p>
      <p class="lvline">난이도 ${stars(g.level || 1)}</p>
      <button type="button" class="btn blink" id="go">▶ START</button>
      <button type="button" class="link" id="back">뒤로</button>
    </section>`;
  app.querySelector("#go").onclick = () => { unlock(); sfx.start(); play(g); };
  app.querySelector("#back").onclick = home;
}

function play(g) {
  leave();
  document.body.classList.add("playing");
  app.innerHTML = `<section class="play" id="host"></section><button type="button" class="link" id="quit">그만하기</button>`;
  stopGame = runGame(g, app.querySelector("#host"), opts(g), (r) => { stopGame = null; document.body.classList.remove("playing"); result(g, r); });
  app.querySelector("#quit").onclick = home;
}

function result(g, r) {
  if (!r.win) {
    app.innerHTML = `
      <section class="panel center">
        <div class="big">😢</div>
        <h2>GAME OVER</h2>
        <p>${r.score} / ${r.goal}${esc(g.unit)} — 조금만 더!</p>
        <button type="button" class="btn" id="again">CONTINUE?</button>
        <button type="button" class="link" id="home">다른 게임</button>
      </section>`;
    app.querySelector("#again").onclick = () => play(g);
    app.querySelector("#home").onclick = home;
    return;
  }
  app.innerHTML = `
    <section class="panel center">
      <div class="big">🏆</div>
      <h2>STAGE CLEAR!</h2>
      <p>${r.score} / ${r.goal}${esc(g.unit)} 달성 — 커피쿠폰 1장!</p>
      <form id="f" class="nameform">
        <label for="nt">쿠폰에 남길 소감 한마디 (최대 ${NOTE_MAX}자)</label>
        <input id="nt" name="nt" maxlength="${NOTE_MAX}" autocomplete="off" placeholder="예: 오랜만에 오락실 감성 최고!" required>
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
    const note = form.nt.value.trim().slice(0, NOTE_MAX);
    if (!note) { err.textContent = "소감을 한 줄만 적어줘."; return; }
    const max = CONFIG.maxCouponsPerDevice;
    if (max > 0 && mine().length >= max) { err.textContent = `이 기기에서는 쿠폰을 ${max}장까지만 받을 수 있어.`; return; }
    busy = true; sub.disabled = true; err.textContent = "";
    try {
      const c = await issueCoupon(db, { note, game: g.name, gameId: g.id, score: r.score, goal: r.goal });
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
      <p class="quote">“${esc(noteOf(c))}”</p>
      <dl>
        <dt>게임</dt><dd>${esc(c.game)} (${c.score}/${c.goal})</dd>
        <dt>발급</dt><dd>${fmtTime(c.issuedAt)}</dd>
      </dl>
      <div class="bcbox"><svg id="bc" class="barcode" aria-label="쿠폰 바코드"></svg></div>
      <p class="code">${fmtCode(c.code)}</p>
      <p class="state">${c.used ? "사용 완료" : "직원에게 이 화면을 보여줘"}</p>
      ${c.used ? '<span class="stamp">사용 완료</span>' : ""}
    </section>
    <button type="button" class="btn" id="home">처음으로</button>`;
  if (!renderBarcode(app.querySelector("#bc"), c.code)) app.querySelector(".bcbox").remove();
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
