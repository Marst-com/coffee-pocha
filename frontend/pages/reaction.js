import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const button = document.querySelector("#reactionButton");
const scoreText = document.querySelector("#score");
const status = document.querySelector("#status");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

let state = "idle";
let timeoutId = null;
let startTime = 0;
let score = 0;

function startGame() {
  clearTimeout(timeoutId);

  state = "waiting";
  button.textContent = "기다리세요...";
  button.style.background = "#d79a9a";
  scoreText.textContent = "-";
  status.textContent = "초록색이 되면 바로 클릭!";

  nameArea.hidden = true;
  completeArea.hidden = true;

  const delay = 1500 + Math.random() * 3500;

  timeoutId = setTimeout(() => {
    state = "ready";

    button.textContent = "CLICK!";
    button.style.background = "#76b987";

    startTime = performance.now();
    status.textContent = "지금!";
  }, delay);
}

button.addEventListener("click", () => {
  if (state === "idle") {
    startGame();
    return;
  }

  if (state === "waiting") {
    clearTimeout(timeoutId);

    state = "idle";
    button.textContent = "다시 시작";
    button.style.background = "";
    status.textContent = "너무 빨랐어요!";

    return;
  }

  if (state !== "ready") return;

  score = Math.round(performance.now() - startTime);

  state = "idle";

  scoreText.textContent = String(score);
  button.textContent = "다시 시작";
  button.style.background = "";
  status.textContent = "측정 완료!";

  nameArea.hidden = false;
  nameInput.focus();
});

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
      game: "reaction",
      score,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "reaction",
      amount: 1
    });

    nameArea.hidden = true;
    completeArea.hidden = false;

    completeText.textContent =
      `${name}님, 커피 1잔을 획득했습니다!`;
  } catch (error) {
    console.error(error);
    alert("커피 기록 저장에 실패했습니다!");

    receiveButton.disabled = false;
    receiveButton.textContent = "☕ 커피 받기";
  }
});
