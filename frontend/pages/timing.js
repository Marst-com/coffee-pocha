import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const target = document.querySelector("#target");
const status = document.querySelector("#status");
const scoreText = document.querySelector("#score");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

let waiting = false;
let ready = false;
let startTime = 0;
let timeoutId = null;
let score = 0;

target.style.width = "min(280px, 90%)";
target.style.height = "130px";
target.style.marginTop = "25px";
target.style.display = "grid";
target.style.placeItems = "center";
target.style.borderRadius = "24px";
target.style.background = "#eadff1";
target.style.fontSize = "28px";
target.style.fontWeight = "900";
target.style.cursor = "pointer";
target.textContent = "READY";

function startGame() {
  clearTimeout(timeoutId);

  waiting = true;
  ready = false;

  startButton.hidden = true;
  nameArea.hidden = true;
  completeArea.hidden = true;

  scoreText.textContent = "-";
  status.textContent = "초록색으로 바뀔 때까지 기다리세요!";
  target.textContent = "WAIT...";
  target.style.background = "#e8bfc0";

  const delay = 1200 + Math.random() * 2800;

  timeoutId = setTimeout(() => {
    waiting = false;
    ready = true;
    startTime = performance.now();

    target.textContent = "CLICK!";
    target.style.background = "#b9e5c0";
    status.textContent = "지금 클릭!";
  }, delay);
}

target.addEventListener("click", () => {
  if (waiting) {
    clearTimeout(timeoutId);

    waiting = false;
    target.textContent = "TOO SOON!";
    target.style.background = "#e8bfc0";
    status.textContent = "너무 빨랐어요!";

    startButton.hidden = false;
    startButton.textContent = "다시 도전";
    return;
  }

  if (!ready) return;

  ready = false;

  score = Math.round(performance.now() - startTime);
  scoreText.textContent = String(score);

  target.textContent = `${score} ms`;
  target.style.background = "#d9c4e8";
  status.textContent = "측정 완료!";

  nameArea.hidden = false;
  nameInput.focus();
});

startButton.addEventListener("click", startGame);

receiveButton.addEventListener("click", async () => {
  const name = nameInput.value.trim();

  if (!name) {
    alert("이름을 입력해주세요!");
    nameInput.focus();
    return;
  }

  receiveButton.disabled = true;
  receiveButton.textContent = "저장 중...";

  try {
    await saveGameResult({
      name,
      game: "timing",
      score,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "timing",
      amount: 1
    });

    nameArea.hidden = true;
    completeArea.hidden = false;

    completeText.textContent =
      `${name}님, 커피 1잔을 획득했습니다!`;
  } catch (error) {
    console.error(error);
    alert("커피 기록 저장에 실패했습니다.");

    receiveButton.disabled = false;
    receiveButton.textContent = "☕ 커피 받기";
  }
});
