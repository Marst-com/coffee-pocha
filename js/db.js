import { CONFIG } from "./config.js";

const LS_KEY = "gr_entries_v1";
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function localDB() {
  const read = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; } };
  const subs = new Set();
  const write = (o) => { localStorage.setItem(LS_KEY, JSON.stringify(o)); subs.forEach((f) => f()); };
  return {
    mode: "local",
    async add(e) {
      const all = read();
      const rec = { id: newId(), ...e };
      all[rec.id] = rec;
      write(all);
      return rec;
    },
    subscribe(cb) {
      const emit = () => cb(Object.values(read()));
      subs.add(emit);
      const onStorage = (ev) => { if (ev.key === LS_KEY || ev.key === null) emit(); };
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
  const col = fs.collection(db, "entries");
  return {
    mode: "firebase",
    async add(e) {
      const ref = await fs.addDoc(col, e);
      return { id: ref.id, ...e };
    },
    subscribe(cb) {
      return fs.onSnapshot(col, (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))));
    },
  };
}

// Firebase 설정이 있으면 반드시 Firebase로 (실패 시 에러를 던짐 → 조용히 로컬로 새지 않게)
export async function openDB() {
  return CONFIG.firebase ? firebaseDB(CONFIG.firebase) : localDB();
}
