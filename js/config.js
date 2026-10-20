// ✏️ 여기만 고치면 돼
export const CONFIG = {
  cafeName: "게임방",

  // Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)의 firebaseConfig 객체를 그대로 붙여넣기.
  // null 이면 "데모 모드"(이 브라우저에만 저장)로 동작해.
  firebase: null,
  // firebase: { apiKey:"...", authDomain:"...", projectId:"...", appId:"..." },

  // 관리자 PIN (꼭 바꿔!)
  adminPin: "1234",

  // 게임별 난이도 조절: { tap: { goal: 40, duration: 10 } }
  gameOverrides: {},
};
