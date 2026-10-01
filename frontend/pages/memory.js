import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const board = document.querySelector("#memoryBoard");
const attemptsText = document.querySelector("#attempts");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

const icons = ["☕", "🍀", "⭐", "🎈", "🍪", "🌈"];

let cards = [];
let first = null;
let second = null;
let locked = false;
let matched = 0;
let attempts = 0;

board.style.display = "grid";
board.style.gridTemplateColumns = "repeat(4, 1fr)";
board.style.gap = "9px";
board.style.width = "min(360px, 100%)";
board.style.marginTop = "24px";

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function startGame() {
  cards = shuffle([...icons, ...icons]);
  first = null;
  second = null;
  locked = false;
  matched = 0;
  attempts = 0;

  attemptsText.textContent = "0";
  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  render();
}

function render() {
  board.innerHTML = "";

  cards.forEach((icon, index) => {
    const card = document.createElement("button");

    card.type = "button";
    card.dataset.index = String(index);
    card.textContent = "?";

    card.style.aspectRatio = "1";
    card.style.border = "0";
    card.style.borderRadius = "14px";
    card.style.background = "#eee5f4";
    card.style.color = "#684632";
    card.style.fontSize = "28px";
    card.style.fontWeight = "900";
    card.style.cursor = "pointer";

    card.addEventListener("click", () => flip(card, index));

    board.appendChild(card);
  });
}

function flip(card, index) {
  if (locked) return;
  if (card.dataset.matched === "true") return;
  if (card === first) return;

  card.textContent = cards[index];
  card.style.background = "#ffffff";

  if (!first) {
    first = card;
    return;
  }

  second = card;
  locked = true;
  attempts++;

  attemptsText.textContent = String(attempts);

  const firstIndex = Number(first.dataset.index);
  const secondIndex = Number(second.dataset.index);

  if (cards[firstIndex] === cards[secondIndex]) {
    first.dataset.matched = "true";
    second.dataset.matched = "true";

    first = null;
    second = null;
    locked = false;

    matched += 2;

    if (matched === cards.length) {
      finishGame();
    }

    return;
  }

  setTimeout(() => {
    first.textContent = "?";
    second.textContent = "?";

    first.style.background = "#eee5f4";
    second.style.background = "#eee5f4";

    first = null;
    second = null;
    locked = false;
  }, 650);
}

function finishGame() {
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
      game: "memory",
      score: attempts,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "memory",
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
