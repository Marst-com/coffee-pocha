import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const area = document.querySelector("#coinArea");
const scoreText = document.querySelector("#score");
const timerText = document.querySelector("#timer");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

let score = 0;
let time = 20;
let playing = false;
let timerId = null;
let coinId = null;

area.style.position = "relative";
area.style.width = "min(420px, 100%)";
area.style.height = "300px";
area.style.marginTop = "20px";
area.style.borderRadius = "22px";
area.style.background = "#faf4e7";
area.style.overflow = "hidden";

function spawnCoin() {
  if (!playing) return;

  area.innerHTML = "";

  const coin = document.createElement("button");

  coin.type = "button";
  coin.textContent = "🪙";

  Object.assign(coin.style, {
    position: "absolute",
    left: `${5 + Math.random() * 85}%`,
    top: `${5 + Math.random() * 80}%`,
    border: "0",
    background: "transparent",
    fontSize: "42px",
    cursor: "pointer"
  });

  coin.addEventListener("click", () => {
    if (!playing) return;

    score++;
    scoreText.textContent = String(score);

    spawnCoin();
  });

  area.appendChild(coin);
}

function startGame() {
  clearInterval(timerId);
  clearInterval(coinId);

  score = 0;
  time = 20;
  playing = true;

  scoreText.textContent = "0";
  timerText.textContent = "20";

  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  spawnCoin();

  coinId = setInterval(spawnCoin, 1300);

  timerId = setInterval(() => {
    time--;
    timerText.textContent = String(time);

    if (time <= 0) {
      finishGame();
    }
  }, 1000);
}

function finishGame() {
  playing = false;

  clearInterval(timerId);
  clearInterval(coinId);

  area.innerHTML = "";

  nameArea.hidden = false;
  nameInput.focus();
}

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
      game: "coin",
      score,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "coin",
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
