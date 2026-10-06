// ✏️ 여기만 고치면 돼
export const CONFIG = {
  cafeName: "커피포차",

  // Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)의 firebaseConfig 객체를 그대로 붙여넣기.
  // null 이면 "데모 모드"(이 브라우저에만 저장)로 동작해.
  firebase: { apiKey: "AIzaSyA-Xefgem8PH4oL8Z-uZaOzXyOhl3PmS3k",
  authDomain: "coffee-bbba5.firebaseapp.com",
  projectId: "coffee-bbba5",
  storageBucket: "coffee-bbba5.firebasestorage.app",
  messagingSenderId: "372479897704",
  appId: "1:372479897704:web:2830d7a03aaecf96744bdd",
  measurementId: "G-LB95H041RX" },
  // firebase: { apiKey:"...", authDomain:"...", projectId:"...", appId:"..." },

  // 관리자 PIN (꼭 바꿔!)
  adminPin: "1234",

  // 한 기기에서 받을 수 있는 쿠폰 최대 개수 (0 = 무제한)
  maxCouponsPerDevice: 0,

  // 게임별 난이도 조절: { tap: { goal: 40, duration: 10 } }
  gameOverrides: {},
};
