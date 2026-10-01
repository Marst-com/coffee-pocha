import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const maze = document.querySelector("#maze");
const movesText = document.querySelector("#moves");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

const map = [
  [0, 0, 1, 0, 0, 0, 1, 0],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 0, 0, 0, 1, 0]
];

let player = { x: 0, y: 0 };
const goal = { x: 7, y: 7 };
let moves = 0;
let playing = false;

function render() {
  maze.innerHTML = "";
  maze.style.display = "grid";
  maze.style.gridTemplateColumns = `repeat(${map[0].length}, 1fr)`;
  maze.style.gap = "4px";
  maze.style.width = "min(400px, 100%)";
  maze.style.marginTop = "24px";

  map.forEach((row, y) => {
    row.forEach((cell, x) => {
      const tile = document.createElement("button");

      tile.type = "button";
      tile.style.aspectRatio = "1";
      tile.style.border = "0";
      tile.style.borderRadius = "7px";
      tile.style.cursor = cell === 0 ? "pointer" : "default";
      tile.style.background = cell === 1 ? "#5c4438" : "#f5eee9";

      if (x === player.x && y === player.y) {
        tile.textContent = "🙂";
        tile.style.background = "#d9c4e8";
      }

      if (x === goal.x && y === goal.y) {
        tile.textContent = "☕";
        tile.style.background = "#f4d6a7";
      }

      if (cell === 0) {
        tile.addEventListener("click", () => moveTo(x, y));
      }

      maze.appendChild(tile);
    });
  });
}

function moveTo(x, y) {
  if (!playing) return;

  const distance =
    Math.abs(x - player.x) +
    Math.abs(y - player.y);

  if (distance !== 1 || map[y][x] === 1) return;

  player = { x, y };
  moves++;
  movesText.textContent = String(moves);

  render();

  if (player.x === goal.x && player.y === goal.y) {
    finishGame();
  }
}

function startGame() {
  player = { x: 0, y: 0 };
  moves = 0;
  playing = true;

  movesText.textContent = "0";
  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  render();
}

function finishGame() {
  playing = false;
  nameArea.hidden = false;
  nameInput.focus();
}

startButton.addEventListener("click", startGame);

document.addEventListener("keydown", (event) => {
  if (!playing) return;

  const directions = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0]
  };

  const direction = directions[event.key];
  if (!direction) return;

  event.preventDefault();

  moveTo(
    player.x + direction[0],
    player.y + direction[1]
  );
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
      game: "maze",
      score: moves,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "maze",
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

render();
