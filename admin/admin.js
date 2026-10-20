// 관리자 페이지 — ../js/config.js 만 있으면 동작해 (다른 js 파일에 의존하지 않음)
import { CONFIG } from "../js/config.js";
import { xlsxBlob } from "./xlsx.js";

const $ = (s) => document.querySelector(s);
const KEY = "gr_admin";
const LS_NEW = "gr_entries_v1";   // 새 버전 로컬 저장소
const LS_OLD = "cp_coupons_v1";   // 예전 쿠폰 버전 (있으면 같이 보여줌)

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const p2 = (n) => String(n).padStart(2, "0");
const fmtTime = (ms) => { if (!ms) return "-"; const d = new Date(ms); return `${p2(d.getMonth() + 1)}/${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`; };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`; };

// 새/예전 데이터를 같은 모양으로
function norm(d, id, legacy) {
  return {
    key: String(id ?? d.id ?? d.code ?? ""),
    src: legacy ? "coupons" : "entries",
    id: String(d.id ?? id ?? d.code ?? Math.random()),
    name: legacy ? "" : String(d.name ?? ""),
    note: String(d.note ?? (legacy ? d.name : "") ?? ""),
    game: String(d.game ?? ""),
    gameId: String(d.gameId ?? d.game ?? ""),
    score: d.score ?? "",
    goal: d.goal ?? "",
    createdAt: Number(d.createdAt ?? d.issuedAt) || 0,
  };
}

let bySource = { entries: [], legacy: [] };
let all = [];
const f = { game: "all", q: "" };
const PHRASE = "delete the data";
let remove = null; // 모드별(로컬/Firebase) 삭제 함수

const showAlert = (t) => { const a = $("#alert"); a.textContent = t || ""; a.hidden = !t; };
const say = (t) => { $("#msg").textContent = t; };

// ---- PIN ----
$("#gf").onsubmit = (e) => {
  e.preventDefault();
  if ($("#pin").value === String(CONFIG.adminPin)) { sessionStorage.setItem(KEY, "1"); start(); }
  else { $("#gerr").textContent = "PIN이 달라."; $("#pin").value = ""; }
};
if (sessionStorage.getItem(KEY) === "1") start();

function merge() {
  all = [...bySource.entries, ...bySource.legacy];
  // 게임 필터 목록은 데이터에서 만들어
  const games = [...new Map(all.filter((c) => c.game).map((c) => [c.gameId, c.game])).entries()];
  const sel = $("#fg"), cur = sel.value;
  sel.innerHTML = `<option value="all">모든 게임</option>` + games.map(([id, nm]) => `<option value="${esc(id)}">${esc(nm)}</option>`).join("");
  sel.value = games.some(([id]) => id === cur) ? cur : "all";
  f.game = sel.value;
  render();
}

async function start() {
  $("#gate").hidden = true;
  $("#dash").hidden = false;
  $("#title").textContent = `${CONFIG.cafeName || "게임방"} 방명록 관리`;
  render();
  try {
    if (CONFIG.firebase) await startFirebase(CONFIG.firebase);
    else startLocal();
  } catch (e) {
    console.error(e);
    $("#mode").textContent = "서버 연결 실패";
    showAlert(`연결 실패: ${e.message || e}  — js/config.js의 Firebase 설정을 확인해줘.`);
  }
}

function startLocal() {
  $("#mode").textContent = "데모 모드: 이 브라우저에 저장된 기록만 보여.";
  const read = (k) => { try { return Object.entries(JSON.parse(localStorage.getItem(k) || "{}")); } catch { return []; } };
  const load = () => {
    bySource.entries = read(LS_NEW).map(([id, d]) => norm(d, id, false));
    bySource.legacy = read(LS_OLD).map(([id, d]) => norm(d, id, true));
    merge();
  };
  window.addEventListener("storage", load);
  remove = async (items) => {
    for (const [k, src] of [[LS_NEW, "entries"], [LS_OLD, "coupons"]]) {
      let o = {};
      try { o = JSON.parse(localStorage.getItem(k) || "{}"); } catch {}
      items.filter((c) => c.src === src).forEach((c) => { delete o[c.key]; });
      localStorage.setItem(k, JSON.stringify(o));
    }
    load();
  };
  load();
}

async function startFirebase(cfg) {
  const V = "10.12.2";
  const [{ initializeApp }, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const db = fs.getFirestore(initializeApp(cfg));
  $("#mode").textContent = "서버에 연결하는 중…";
  remove = async (items) => {
    for (let i = 0; i < items.length; i += 400) {
      const batch = fs.writeBatch(db);
      items.slice(i, i + 400).forEach((c) => batch.delete(fs.doc(db, c.src, c.key)));
      await batch.commit();
    }
  };
  fs.onSnapshot(
    fs.collection(db, "entries"),
    (s) => {
      bySource.entries = s.docs.map((d) => norm(d.data(), d.id, false));
      $("#mode").textContent = "실시간 연결됨";
      showAlert("");
      merge();
    },
    (err) => {
      console.error(err);
      $("#mode").textContent = "읽기 실패";
      showAlert(`기록을 읽지 못했어 (${err.code || err.message}). Firestore 규칙에 'entries' 컬렉션 read 허용이 있는지 확인해줘.`);
    },
  );
  // 예전 쿠폰 버전 데이터가 있으면 같이 보여줘 (읽기 권한이 없으면 조용히 무시)
  fs.onSnapshot(
    fs.collection(db, "coupons"),
    (s) => { bySource.legacy = s.docs.map((d) => norm(d.data(), d.id, true)); merge(); },
    () => { bySource.legacy = []; },
  );
}

// ---- 목록 ----
function filtered() {
  const q = f.q.trim().toLowerCase();
  return all
    .filter((c) => f.game === "all" || c.gameId === f.game)
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.note.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function condText() {
  const g = f.game === "all" ? "모든 게임" : (all.find((c) => c.gameId === f.game)?.game || f.game);
  return `조건: ${g}${f.q.trim() ? ` / 검색 "${f.q.trim()}"` : ""}`;
}

const scoreText = (c) => (c.score === "" && c.goal === "" ? "-" : `${c.score}/${c.goal}`);

function render() {
  const rows = filtered();
  $("#stats").innerHTML = `
    <div class="stat">전체 기록<b>${all.length}</b></div>
    <div class="stat">현재 조건<b>${rows.length}</b></div>`;
  $("#tb").innerHTML = rows.length
    ? rows.map((c, i) => `
      <tr>
        <td>${rows.length - i}</td>
        <td class="nm">${esc(c.name) || "-"}</td>
        <td class="nt">${esc(c.note)}</td>
        <td>${esc(c.game)}</td>
        <td class="sc">${esc(scoreText(c))}</td>
        <td class="tm">${fmtTime(c.createdAt)}</td>
        <td class="mg noprint"><button type="button" class="danger sm" data-k="${esc(c.src + ":" + c.key)}" aria-label="${esc(c.name || c.note)} 기록 삭제">삭제</button></td>
      </tr>`).join("")
    : `<tr><td colspan="7" class="empty">조건에 맞는 기록이 없어.</td></tr>`;
  $("#delall").disabled = rows.length === 0;
  $("#pTitle").textContent = `${CONFIG.cafeName || "게임방"} 방명록`;
  $("#pCond").textContent = condText();
  $("#pSum").textContent = `총 ${rows.length}건`;
}

$("#fg").onchange = (e) => { f.game = e.target.value; render(); };
$("#fq").oninput = (e) => { f.q = e.target.value; render(); };

// ---- 내보내기 ----
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const iso = (ms) => (ms ? new Date(ms).toISOString() : "");

$("#print").onclick = () => { $("#pTime").textContent = `출력: ${new Date().toLocaleString("ko-KR")}`; render(); window.print(); };

$("#xlsx").onclick = () => {
  try {
    const rows = filtered();
    const names = [...new Set(rows.map((c) => c.game).filter(Boolean))];
    const byGame = names.map((n) => [n, rows.filter((c) => c.game === n).length]);
    const sheets = [
      {
        name: "방명록", header: true, widths: [7, 14, 44, 16, 9, 9, 18],
        rows: [
          ["번호", "이름", "소감", "게임", "점수", "목표", "시간"],
          ...rows.map((c, i) => [rows.length - i, c.name, c.note, c.game, c.score === "" ? null : Number(c.score), c.goal === "" ? null : Number(c.goal), c.createdAt ? new Date(c.createdAt) : null]),
        ],
      },
      { name: "요약", widths: [18, 10], rows: [[(CONFIG.cafeName || "게임방") + " 방명록 요약"], [condText()], [], ["총 기록", rows.length], [], ["게임별 기록"], ...byGame] },
    ];
    download(xlsxBlob(sheets), `guestbook_${today()}.xlsx`);
    say(`엑셀로 ${rows.length}건 저장했어.`);
  } catch (e) { console.error(e); showAlert("엑셀 저장 실패: " + (e.message || e)); }
};

const toJSON = () => JSON.stringify(
  filtered().map((c) => ({ name: c.name, note: c.note, game: c.game, gameId: c.gameId, score: c.score, goal: c.goal, createdAt: iso(c.createdAt) })),
  null, 2,
);

$("#json").onclick = () => {
  download(new Blob([toJSON()], { type: "application/json;charset=utf-8" }), `guestbook_${today()}.json`);
  say(`JSON으로 ${filtered().length}건 저장했어.`);
};

$("#jcopy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(toJSON());
    say(`JSON ${filtered().length}건을 클립보드에 복사했어.`);
  } catch {
    say("복사가 막혀 있어. 'JSON 저장'을 써줘.");
  }
};

const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // 엑셀 수식 주입 방지
  return `"${s.replace(/"/g, '""')}"`;
};
$("#csv").onclick = () => {
  const head = ["이름", "소감", "게임", "점수", "목표", "시간"];
  const lines = [head, ...filtered().map((c) => [c.name, c.note, c.game, c.score, c.goal, c.createdAt ? new Date(c.createdAt).toLocaleString("ko-KR") : ""])];
  download(new Blob(["\ufeff" + lines.map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }), `guestbook_${today()}.csv`);
  say(`CSV로 ${filtered().length}건 저장했어.`);
};

// ---- 삭제 (확인 문구를 정확히 입력해야 삭제) ----
const dlg = $("#dlg"), dIn = $("#dIn"), dOk = $("#dOk");
const typedOk = () => dIn.value.trim() === PHRASE;
dIn.oninput = () => { dOk.disabled = !typedOk(); };
$("#dNo").onclick = () => dlg.close("cancel");
$("#dForm").onsubmit = (e) => { e.preventDefault(); if (typedOk()) dlg.close("ok"); };

function askDelete(text) {
  return new Promise((resolve) => {
    $("#dTxt").textContent = text;
    dIn.value = "";
    dOk.disabled = true;
    dlg.onclose = () => resolve(dlg.returnValue === "ok");
    dlg.returnValue = "";
    dlg.showModal();
    dIn.focus();
  });
}

let deleting = false;
async function doDelete(items, text) {
  if (deleting || !items.length || !remove) return;
  if (!(await askDelete(text))) return;
  deleting = true;
  showAlert("");
  try {
    await remove(items);
    say(`${items.length}건 삭제했어.`);
  } catch (e) {
    console.error(e);
    showAlert(`삭제 실패 (${e.code || e.message || e}). Firestore 규칙에서 해당 컬렉션의 delete 허용이 필요해.`);
  } finally { deleting = false; }
}

$("#tb").onclick = (e) => {
  const b = e.target.closest("button[data-k]");
  if (!b) return;
  const c = all.find((x) => x.src + ":" + x.key === b.dataset.k);
  if (!c) return;
  doDelete([c], `${c.name || "(이름 없음)"} — “${c.note}” 기록 1건을 삭제해.`);
};

$("#delall").onclick = () => {
  const rows = filtered();
  doDelete(rows, `${condText()} — 현재 보이는 ${rows.length}건을 모두 삭제해.`);
};
