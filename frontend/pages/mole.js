import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const board = document.querySelector("#moleBoard");
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
let moleId = null;

board.style.display = "grid";
board.style.gridTemplateColumns = "repeat(3, 1fr)";
board.style.gap = "10px";
board.style.width = "min(360px, 100%)";
board.style.marginTop = "20px";

function createBoard() {
  board.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const hole = document.createElement("button");

    hole.type = "button";
    hole.dataset.index = String(i);

    hole.style.aspectRatio = "1";
    hole.style.border = "0";
    hole.style.borderRadius = "50%";
    hole.style.background = "#d8c2b3";
    hole.style.fontSize = "38px";
    hole.style.cursor = "pointer";

    hole.addEventListener("click", () => {
      if (!playing) return;

      if (hole.dataset.mole === "true") {
        score++;
        scoreText.textContent = String(score);

        hole.textContent = "";
        hole.dataset.mole = "false";

        showMole();
      }
    });

    board.appendChild(hole);
  }
}

function showMole() {
  board.querySelectorAll("button").forEach((button) => {
    button.textContent = "";
    button.dataset.mole = "false";
  });

  const buttons = [...board.querySelectorAll("button")];
  const index = Math.floor(Math.random() * buttons.length);
  const mole = buttons[index];

  mole.textContent = "🐹";
  mole.dataset.mole = "true";
}

function startGame() {
  clearInterval(timerId);
  clearInterval(moleId);

  score = 0;
  time = 20;
  playing = true;

  scoreText.textContent = "0";
  timerText.textContent = "20";

  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  createBoard();
  showMole();

  timerId = setInterval(() => {
    time--;
    timerText.textContent = String(time);

    if (time <= 0) {
      finishGame();
    }
  }, 1000);

  moleId = setInterval(showMole, 750);
}

function finishGame() {
  playing = false;

  clearInterval(timerId);
  clearInterval(moleId);

  board.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

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
      game: "mole",
      score,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "mole",
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
