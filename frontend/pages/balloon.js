import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const area = document.querySelector("#balloonArea");
const remainingText = document.querySelector("#remaining");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

let remaining = 0;
let playing = false;

area.style.position = "relative";
area.style.width = "min(420px, 100%)";
area.style.height = "300px";
area.style.marginTop = "22px";
area.style.borderRadius = "22px";
area.style.background = "#faf4f0";
area.style.overflow = "hidden";

const emojis = ["🎈", "🎈", "🎈", "🎈", "🎈"];

function startGame() {
  area.innerHTML = "";
  remaining = 10;
  playing = true;

  remainingText.textContent = "10";
  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  for (let i = 0; i < 10; i++) {
    createBalloon(i);
  }
}

function createBalloon(index) {
  const balloon = document.createElement("button");

  balloon.type = "button";
  balloon.textContent = emojis[index % emojis.length];

  balloon.style.position = "absolute";
  balloon.style.left = `${8 + Math.random() * 78}%`;
  balloon.style.top = `${8 + Math.random() * 75}%`;
  balloon.style.border = "0";
  balloon.style.background = "transparent";
  balloon.style.fontSize = "42px";
  balloon.style.cursor = "pointer";
  balloon.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;

  balloon.addEventListener("click", () => {
    if (!playing) return;

    balloon.remove();
    remaining--;

    remainingText.textContent = String(remaining);

    if (remaining <= 0) {
      finishGame();
    }
  });

  area.appendChild(balloon);
}

function finishGame() {
  playing = false;
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
      game: "balloon",
      score: 10,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "balloon",
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
