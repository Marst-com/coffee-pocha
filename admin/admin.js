import { CONFIG } from "../js/config.js";
import { openDB } from "../js/db.js";
import { GAMES } from "../js/games/registry.js";
import { esc, fmtTime } from "../js/util.js";
import { xlsxBlob } from "../js/xlsx.js";

const $ = (s) => document.querySelector(s);
const KEY = "gr_admin";
let db = null, all = [];
const f = { game: "all", q: "" };

// ---- PIN ----
$("#gf").onsubmit = (e) => {
  e.preventDefault();
  if ($("#pin").value === String(CONFIG.adminPin)) { sessionStorage.setItem(KEY, "1"); start(); }
  else { $("#gerr").textContent = "PIN이 달라."; $("#pin").value = ""; }
};
if (sessionStorage.getItem(KEY) === "1") start();

async function start() {
  $("#gate").hidden = true;
  $("#dash").hidden = false;
  $("#title").textContent = `${CONFIG.cafeName} 방명록 관리`;
  GAMES.forEach((g) => $("#fg").insertAdjacentHTML("beforeend", `<option value="${esc(g.id)}">${esc(g.name)}</option>`));
  try {
    db = await openDB();
  } catch (e) {
    console.error(e);
    $("#mode").textContent = "서버 연결 실패 — js/config.js의 Firebase 설정을 확인해줘.";
    return;
  }
  $("#mode").textContent = db.mode === "local" ? "데모 모드: 이 브라우저에 저장된 기록만 보여." : "실시간 연결됨";
  db.subscribe((list) => { all = list; render(); });
}

// ---- 목록 ----
function filtered() {
  const q = f.q.trim().toLowerCase();
  return all
    .filter((c) => f.game === "all" || c.gameId === f.game)
    .filter((c) => !q || String(c.name ?? "").toLowerCase().includes(q) || String(c.note ?? "").toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
}

function condText() {
  const g = f.game === "all" ? "모든 게임" : GAMES.find((x) => x.id === f.game)?.name || f.game;
  return `조건: ${g}${f.q.trim() ? ` / 검색 "${f.q.trim()}"` : ""}`;
}

function render() {
  const rows = filtered();
  $("#stats").innerHTML = `
    <div class="stat">전체 기록<b>${all.length}</b></div>
    <div class="stat">현재 조건<b>${rows.length}</b></div>`;
  $("#tb").innerHTML = rows.length
    ? rows.map((c, i) => `
      <tr>
        <td>${rows.length - i}</td>
        <td class="nm">${esc(c.name)}</td>
        <td class="nt">${esc(c.note)}</td>
        <td>${esc(c.game)}</td>
        <td>${c.score}/${c.goal}</td>
        <td>${fmtTime(c.createdAt)}</td>
      </tr>`).join("")
    : `<tr><td colspan="6" class="empty">조건에 맞는 기록이 없어.</td></tr>`;
  $("#pTitle").textContent = `${CONFIG.cafeName} 방명록`;
  $("#pCond").textContent = condText();
  $("#pSum").textContent = `총 ${rows.length}건`;
}

$("#fg").onchange = (e) => { f.game = e.target.value; render(); };
$("#fq").oninput = (e) => { f.q = e.target.value; render(); };

// ---- 내보내기 ----
const say = (t) => { $("#msg").textContent = t; };
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const today = () => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const iso = (ms) => (ms ? new Date(ms).toISOString() : "");

$("#print").onclick = () => { $("#pTime").textContent = `출력: ${new Date().toLocaleString("ko-KR")}`; render(); window.print(); };

$("#xlsx").onclick = () => {
  const rows = filtered();
  const byGame = GAMES.map((g) => [g.name, rows.filter((c) => c.gameId === g.id).length]).filter((r) => r[1] > 0);
  const sheets = [
    {
      name: "방명록", header: true, widths: [7, 14, 44, 16, 9, 9, 18],
      rows: [
        ["번호", "이름", "소감", "게임", "점수", "목표", "시간"],
        ...rows.map((c, i) => [rows.length - i, c.name ?? "", c.note ?? "", c.game, c.score, c.goal, new Date(c.createdAt)]),
      ],
    },
    {
      name: "요약", widths: [18, 10],
      rows: [[CONFIG.cafeName + " 방명록 요약"], [condText()], [], ["총 기록", rows.length], [], ["게임별 기록"], ...byGame],
    },
  ];
  download(xlsxBlob(sheets), `guestbook_${today()}.xlsx`);
  say(`엑셀로 ${rows.length}건 저장했어.`);
};

const toJSON = () => JSON.stringify(
  filtered().map((c) => ({ name: c.name ?? "", note: c.note ?? "", game: c.game, gameId: c.gameId, score: c.score, goal: c.goal, createdAt: iso(c.createdAt) })),
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
    say("복사에 실패했어. 'JSON 저장'을 써줘.");
  }
};

const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // 엑셀 수식 주입 방지
  return `"${s.replace(/"/g, '""')}"`;
};
$("#csv").onclick = () => {
  const head = ["이름", "소감", "게임", "점수", "목표", "시간"];
  const lines = [head, ...filtered().map((c) => [c.name, c.note, c.game, c.score, c.goal, new Date(c.createdAt).toLocaleString("ko-KR")])];
  download(new Blob(["\ufeff" + lines.map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }), `guestbook_${today()}.csv`);
  say(`CSV로 ${filtered().length}건 저장했어.`);
};
