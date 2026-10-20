import { CONFIG } from "./config.js";

const LS_KEY = "cp_coupons_v1";

function localDB() {
  const read = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } };
  const subs = new Set();
  const write = (o) => { localStorage.setItem(LS_KEY, JSON.stringify(o)); subs.forEach((f) => f()); };
  return {
    mode: "local",
    async get(code) { return read()[code] || null; },
    async add(c) {
      const all = read();
      if (all[c.code]) throw new Error("dup");
      all[c.code] = c;
      write(all);
    },
    async redeem(code) {
      const all = read();
      const c = all[code];
      if (!c) return { ok: false, reason: "notfound" };
      if (c.used) return { ok: false, reason: "used", coupon: c };
      c.used = true;
      c.usedAt = Date.now();
      write(all);
      return { ok: true, coupon: c };
    },
    subscribe(cb) {
      const emit = () => cb(Object.values(read()));
      subs.add(emit);
      const onStorage = (e) => { if (e.key === LS_KEY || e.key === null) emit(); };
      window.addEventListener("storage", onStorage);
      emit();
      return () => { subs.delete(emit); window.removeEventListener("storage", onStorage); };
    },
  };
}

async function firebaseDB(cfg) {
  const V = "10.12.2";
  const [{ initializeApp }, fs] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const db = fs.getFirestore(initializeApp(cfg));
  const col = fs.collection(db, "coupons");
  return {
    mode: "firebase",
    async get(code) {
      const s = await fs.getDoc(fs.doc(col, code));
      return s.exists() ? s.data() : null;
    },
    async add(c) {
      await fs.runTransaction(db, async (tx) => {
        const r = fs.doc(col, c.code);
        if ((await tx.get(r)).exists()) throw new Error("dup");
        tx.set(r, c);
      });
    },
    redeem(code) {
      return fs.runTransaction(db, async (tx) => {
        const r = fs.doc(col, code);
        const s = await tx.get(r);
        if (!s.exists()) return { ok: false, reason: "notfound" };
        const c = s.data();
        if (c.used) return { ok: false, reason: "used", coupon: c };
        const usedAt = Date.now();
        tx.update(r, { used: true, usedAt });
        return { ok: true, coupon: { ...c, used: true, usedAt } };
      });
    },
    subscribe(cb) {
      return fs.onSnapshot(col, (s) => cb(s.docs.map((d) => d.data())));
    },
  };
}

// Firebase 설정이 있으면 반드시 Firebase로 (실패 시 에러를 던짐 → 조용히 로컬로 새지 않게)
export async function openDB() {
  return CONFIG.firebase ? firebaseDB(CONFIG.firebase) : localDB();
}
