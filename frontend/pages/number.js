import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const board = document.querySelector("#numberBoard");
const nextText = document.querySelector("#nextNumber");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

let nextNumber = 1;
let startTime = 0;
let playing = false;
let numbers = [];

board.style.display = "grid";
board.style.gridTemplateColumns = "repeat(4, 1fr)";
board.style.gap = "9px";
board.style.width = "min(360px, 100%)";
board.style.marginTop = "24px";

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function startGame() {
  nextNumber = 1;
  playing = true;
  startTime = performance.now();

  numbers = shuffle(
    Array.from({ length: 16 }, (_, i) => i + 1)
  );

  nextText.textContent = "1";
  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  render();
}

function render() {
  board.innerHTML = "";

  numbers.forEach((number) => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = String(number);

    button.style.aspectRatio = "1";
    button.style.border = "0";
    button.style.borderRadius = "14px";
    button.style.background = "#f0e7f5";
    button.style.color = "#684632";
    button.style.fontSize = "20px";
    button.style.fontWeight = "900";
    button.style.cursor = "pointer";

    button.addEventListener("click", () => {
      if (!playing) return;

      if (number !== nextNumber) {
        button.animate(
          [
            { transform: "translateX(-5px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(0)" }
          ],
          { duration: 180 }
        );
        return;
      }

      button.disabled = true;
      button.style.opacity = "0.3";

      nextNumber++;

      if (nextNumber > 16) {
        finishGame();
        return;
      }

      nextText.textContent = String(nextNumber);
    });

    board.appendChild(button);
  });
}

function finishGame() {
  playing = false;

  const elapsed = Math.round(performance.now() - startTime);

  nextText.textContent = "완료!";
  nameArea.hidden = false;
  nameInput.focus();

  nameArea.dataset.score = String(elapsed);
}

startButton.addEventListener("click", startGame);

receiveButton.addEventListener("click", async () => {
  const name = nameInput.value.trim();

  if (!name) {
    alert("이름을 입력해주세요!");
    nameInput.focus();
    return;
  }

  const score = Number(nameArea.dataset.score || 0);

  receiveButton.disabled = true;
  receiveButton.textContent = "저장 중...";

  try {
    await saveGameResult({
      name,
      game: "number",
      score,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "number",
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
