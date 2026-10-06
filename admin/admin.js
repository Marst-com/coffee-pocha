import { CONFIG } from "../js/config.js";
import { openDB } from "../js/db.js";
import { GAMES } from "../js/games/registry.js";
import { fmtCode, normalizeCode } from "../js/coupon.js";
import { esc, fmtTime } from "../js/util.js";
import { xlsxBlob } from "../js/xlsx.js";

const $ = (s) => document.querySelector(s);
const KEY = "cp_admin";
let db = null, all = [];
const f = { status: "all", game: "all", q: "", view: "ticket" };

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
  $("#title").textContent = `${CONFIG.cafeName} 쿠폰 관리`;
  GAMES.forEach((g) => $("#fg").insertAdjacentHTML("beforeend", `<option value="${esc(g.id)}">${esc(g.name)}</option>`));
  try {
    db = await openDB();
  } catch (e) {
    console.error(e);
    $("#mode").textContent = "서버 연결 실패 — js/config.js의 Firebase 설정을 확인해줘.";
    return;
  }
  $("#mode").textContent = db.mode === "local" ? "데모 모드: 이 브라우저에 저장된 쿠폰만 보여." : "실시간 연결됨";
  db.subscribe((list) => { all = list; render(); });
}

// ---- 목록 ----
function filtered() {
  const q = f.q.trim().toLowerCase();
  const qc = q.replace(/\s/g, "");
  return all
    .filter((c) => (f.status === "all" || (f.status === "used") === !!c.used))
    .filter((c) => f.game === "all" || c.gameId === f.game)
    .filter((c) => !q || String(c.name).toLowerCase().includes(q) || c.code.includes(qc))
    .sort((a, b) => b.issuedAt - a.issuedAt);
}

function condText() {
  const s = { all: "전체", new: "미사용", used: "사용 완료" }[f.status];
  const g = f.game === "all" ? "모든 게임" : GAMES.find((x) => x.id === f.game)?.name || f.game;
  return `조건: ${s} / ${g}${f.q.trim() ? ` / 검색 "${f.q.trim()}"` : ""}`;
}

function ticketHTML(c, no) {
  return `
    <article class="tk${c.used ? " used" : ""}"><div class="tk-in">
      <div class="stub"><span class="no">No.</span><b>${no}</b><span class="st">${c.used ? "사용완료" : "미사용"}</span></div>
      <div class="body">
        <h3>${esc(c.name)}</h3>
        <p class="gm">${esc(c.game)} · ${c.score}/${c.goal}</p>
        <p class="cd">${fmtCode(c.code)}</p>
        <p class="tm">발급 ${fmtTime(c.issuedAt)}${c.used ? ` · 사용 ${fmtTime(c.usedAt)}` : ""}</p>
        ${c.used ? "" : `<div class="act noprint"><button type="button" data-code="${esc(c.code)}">사용 처리</button></div>`}
      </div>
    </div></article>`;
}

function render() {
  const rows = filtered();
  const used = rows.filter((c) => c.used).length;
  const totalUsed = all.filter((c) => c.used).length;
  $("#stats").innerHTML = `
    <div class="stat">총 발급<b>${all.length}</b></div>
    <div class="stat">사용 완료<b>${totalUsed}</b></div>
    <div class="stat">미사용<b>${all.length - totalUsed}</b></div>`;
  const empty = `<div class="empty">조건에 맞는 쿠폰이 없어.</div>`;
  $("#tickets").innerHTML = rows.length ? rows.map((c, i) => ticketHTML(c, rows.length - i)).join("") : empty;
  $("#tb").innerHTML = rows.length
    ? rows.map((c, i) => `
      <tr>
        <td>${rows.length - i}</td>
        <td>${esc(c.name)}</td>
        <td>${esc(c.game)}</td>
        <td>${c.score}/${c.goal}</td>
        <td class="code">${fmtCode(c.code)}</td>
        <td>${fmtTime(c.issuedAt)}</td>
        <td>${c.used ? `<span class="tag used">사용 ${fmtTime(c.usedAt)}</span>` : `<span class="tag new">미사용</span>`}</td>
        <td class="noprint">${c.used ? "" : `<button type="button" data-code="${esc(c.code)}">사용 처리</button>`}</td>
      </tr>`).join("")
    : `<tr><td colspan="8" class="empty">조건에 맞는 쿠폰이 없어.</td></tr>`;
  $("#tickets").hidden = f.view !== "ticket";
  $("#tablebox").hidden = f.view !== "list";
  $("#vt").setAttribute("aria-pressed", String(f.view === "ticket"));
  $("#vl").setAttribute("aria-pressed", String(f.view === "list"));
  $("#pTitle").textContent = `${CONFIG.cafeName} 쿠폰 발급 내역`;
  $("#pCond").textContent = condText();
  $("#pSum").textContent = `총 ${rows.length}건 (사용 ${used} / 미사용 ${rows.length - used})`;
}

$("#vt").onclick = () => { f.view = "ticket"; render(); };
$("#vl").onclick = () => { f.view = "list"; render(); };

$("#fs").onchange = (e) => { f.status = e.target.value; render(); };
$("#fg").onchange = (e) => { f.game = e.target.value; render(); };
$("#fq").oninput = (e) => { f.q = e.target.value; render(); };

// ---- 사용 처리 ----
async function redeem(code) {
  const msg = $("#rmsg");
  msg.className = "msg";
  try {
    const r = await db.redeem(code);
    if (r.ok) { msg.classList.add("ok"); msg.textContent = `✔ 사용 처리됨 — ${r.coupon.name} / ${r.coupon.game}`; }
    else if (r.reason === "used") { msg.classList.add("bad"); msg.textContent = `✖ 이미 사용된 쿠폰이야 (${fmtTime(r.coupon.usedAt)}, ${r.coupon.name})`; }
    else { msg.classList.add("bad"); msg.textContent = "✖ 없는 쿠폰 코드야."; }
  } catch (e) {
    console.error(e);
    msg.classList.add("bad"); msg.textContent = "✖ 처리 중 오류가 났어. 다시 시도해줘.";
  }
}
$("#rf").onsubmit = async (e) => {
  e.preventDefault();
  const code = normalizeCode($("#rcode").value);
  if (!code) { $("#rmsg").className = "msg bad"; $("#rmsg").textContent = "코드를 입력해줘."; return; }
  await redeem(code);
  $("#rcode").value = "";
  $("#rcode").focus();
};
const onAct = async (e) => {
  const b = e.target.closest("button[data-code]");
  if (!b) return;
  const c = all.find((x) => x.code === b.dataset.code);
  if (!c || !confirm(`${c.name}님 쿠폰을 사용 처리할까?`)) return;
  await redeem(c.code);
};
$("#tb").onclick = onAct;
$("#tickets").onclick = onAct;

// ---- 인쇄 / CSV ----
$("#print").onclick = () => { $("#pTime").textContent = `출력: ${new Date().toLocaleString("ko-KR")}`; render(); window.print(); };

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const today = () => { const d = new Date(), p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

$("#xlsx").onclick = () => {
  const rows = filtered();
  const byGame = GAMES.map((g) => [g.name, rows.filter((c) => c.gameId === g.id).length]).filter((r) => r[1] > 0);
  const used = rows.filter((c) => c.used).length;
  const sheets = [
    {
      name: "쿠폰", header: true, widths: [7, 16, 14, 9, 9, 30, 18, 10, 18],
      rows: [
        ["번호", "이름", "게임", "점수", "목표", "쿠폰코드", "발급시간", "사용여부", "사용시간"],
        ...rows.map((c, i) => [rows.length - i, c.name, c.game, c.score, c.goal, fmtCode(c.code), new Date(c.issuedAt), c.used ? "사용" : "미사용", c.usedAt ? new Date(c.usedAt) : null]),
      ],
    },
    {
      name: "요약", widths: [18, 10],
      rows: [[CONFIG.cafeName + " 쿠폰 요약"], [condText()], [], ["총 발급", rows.length], ["사용 완료", used], ["미사용", rows.length - used], [], ["게임별 발급"], ...byGame],
    },
  ];
  download(xlsxBlob(sheets), `coupons_${today()}.xlsx`);
};

const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // 엑셀 수식 주입 방지
  return `"${s.replace(/"/g, '""')}"`;
};
$("#csv").onclick = () => {
  const head = ["이름", "게임", "점수", "목표", "쿠폰코드", "발급시간", "사용여부", "사용시간"];
  const fmt = (ms) => (ms ? new Date(ms).toLocaleString("ko-KR") : "");
  const lines = [head, ...filtered().map((c) => [c.name, c.game, c.score, c.goal, fmtCode(c.code), fmt(c.issuedAt), c.used ? "사용" : "미사용", fmt(c.usedAt)])];
  download(new Blob(["\ufeff" + lines.map((r) => r.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }), `coupons_${today()}.csv`);
};
