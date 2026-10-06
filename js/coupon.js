// 쿠폰 코드 = 24자리 이진수(예: 010001110...) → CODE128 바코드
export function randomBits(n = 24) {
  const a = new Uint8Array(Math.ceil(n / 8));
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(2).padStart(8, "0")).join("").slice(0, n);
}

export const fmtCode = (c) => String(c).replace(/(.{8})/g, "$1 ").trim();
export const normalizeCode = (s) => String(s || "").replace(/[^01]/g, "");

export async function issueCoupon(db, { name, game, gameId, score, goal }) {
  for (let i = 0; i < 10; i++) {
    const code = randomBits();
    const c = { code, name, game, gameId, score, goal, issuedAt: Date.now(), used: false, usedAt: null };
    try {
      await db.add(c);
      return c;
    } catch (e) {
      if (e.message !== "dup") throw e; // 코드 충돌이면 다시 뽑기
    }
  }
  throw new Error("쿠폰 코드를 만들지 못했어. 다시 시도해줘.");
}

export function renderBarcode(svg, code) {
  if (!window.JsBarcode) return false;
  window.JsBarcode(svg, code, { format: "CODE128", width: 1.6, height: 64, displayValue: false, margin: 0 });
  return true;
}
