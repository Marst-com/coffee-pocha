import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-Xefgem8PH4oL8Z-uZaOzXyOhl3PmS3k",
  authDomain: "coffee-bbba5.firebaseapp.com",
  projectId: "coffee-bbba5",
  storageBucket: "coffee-bbba5.firebasestorage.app",
  messagingSenderId: "372479897704",
  appId: "1:372479897704:web:2830d7a03aaecf96744bdd",
  measurementId: "G-LB95H041RX"
};


const app =
  initializeApp(firebaseConfig);

const db =
  getFirestore(app);


/**
 * 게임 성공 기록
 */
export async function saveGameResult({
  name,
  game,
  score,
  coffee = 1
}) {

  if (!name || !name.trim()) {
    throw new Error("이름을 입력해주세요.");
  }

  await addDoc(
    collection(db, "game_records"),
    {
      name: name.trim(),
      game,
      score,
      coffee,
      createdAt: serverTimestamp()
    }
  );
}


/**
 * 커피 획득 기록
 */
export async function saveCoffee({
  name,
  game,
  amount = 1
}) {

  if (!name || !name.trim()) {
    throw new Error("이름을 입력해주세요.");
  }

  await addDoc(
    collection(db, "coffee_records"),
    {
      name: name.trim(),
      game,
      amount,
      createdAt: serverTimestamp()
    }
  );
}
