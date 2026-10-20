import { CONFIG } from "./config.js";
import { openDB } from "./db.js";
import { GAMES } from "./games/registry.js";
import { runGame } from "./play.js";
import { addEntry, NAME_MAX, NOTE_MAX } from "./entry.js";
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

const opts = (g) => CONFIG.gameOverrides?.[g.id] || {};
const goalOf = (g) => opts(g).goal ?? g.goal;
const durOf = (g) => opts(g).duration ?? g.duration;

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
      <p class="hint">오른쪽 숫자가 목표야. 넘기면 이름과 소감을 남길 수 있어!</p>
    </section>`;
  app.querySelectorAll(".menu button").forEach((b) => (b.onclick = () => intro(GAMES.find((g) => g.id === b.dataset.id))));
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
      <p>${r.score} / ${r.goal}${esc(g.unit)} 달성 — 이름과 소감을 남겨줘!</p>
      <form id="f" class="nameform">
        <label for="nm">이름 (최대 ${NAME_MAX}자)</label>
        <input id="nm" name="nm" maxlength="${NAME_MAX}" autocomplete="off" placeholder="예: 홍길동" required>
        <label for="nt">소감 한마디 (최대 ${NOTE_MAX}자)</label>
        <input id="nt" name="nt" maxlength="${NOTE_MAX}" autocomplete="off" placeholder="예: 오랜만에 오락실 감성 최고!" required>
        <p class="err" id="err" role="alert"></p>
        <button class="btn" id="sub">남기기</button>
      </form>
    </section>`;
  confetti();
  const form = app.querySelector("#f"), err = app.querySelector("#err"), sub = app.querySelector("#sub");
  let busy = false;
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const name = form.nm.value.trim(), note = form.nt.value.trim();
    if (!name) { err.textContent = "이름을 적어줘."; return; }
    if (!note) { err.textContent = "소감을 한 줄만 적어줘."; return; }
    busy = true; sub.disabled = true; err.textContent = "";
    try {
      const rec = await addEntry(db, { name, note, game: g.name, gameId: g.id, score: r.score, goal: r.goal });
      done(rec);
    } catch (ex) {
      console.error(ex);
      err.textContent = "저장에 실패했어. 네트워크 확인하고 다시 눌러줘.";
      busy = false; sub.disabled = false;
    }
  };
}

function done(e) {
  app.innerHTML = `
    <section class="receipt">
      <h2>${esc(CONFIG.cafeName)} 방명록</h2>
      <p class="quote">“${esc(e.note)}”</p>
      <dl>
        <dt>이름</dt><dd>${esc(e.name)}</dd>
        <dt>게임</dt><dd>${esc(e.game)} (${e.score}/${e.goal})</dd>
        <dt>시간</dt><dd>${fmtTime(e.createdAt)}</dd>
      </dl>
      <p class="state">기록 완료!</p>
    </section>
    <button type="button" class="btn" id="home">처음으로</button>`;
  app.querySelector("#home").onclick = home;
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
    banner.textContent = "데모 모드: 기록이 이 브라우저에만 저장돼. (js/config.js에 Firebase 설정 필요)";
  }
  home();
})();
