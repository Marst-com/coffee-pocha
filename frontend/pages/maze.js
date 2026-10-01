import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const maze = document.querySelector("#maze");
const movesText = document.querySelector("#moves");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

const controls = document.querySelector("#mazeControls");

const map = [
  [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  [1, 1, 1, 1, 1, 0, 0, 0, 1, 0]
];

const playerStart = { x: 0, y: 0 };
const goal = { x: 9, y: 9 };

let player = { ...playerStart };
let moves = 0;
let playing = false;
let failed = false;

const MIN_MOVES = 22;
const MAX_MOVES = 38;

function render() {
  maze.innerHTML = "";

  maze.style.display = "grid";
  maze.style.gridTemplateColumns = `repeat(${map[0].length}, 1fr)`;
  maze.style.gap = "3px";
  maze.style.width = "min(420px, 100%)";
  maze.style.marginTop = "22px";

  map.forEach((row, y) => {
    row.forEach((cell, x) => {
      const tile = document.createElement("button");

      tile.type = "button";
      tile.style.aspectRatio = "1";
      tile.style.border = "0";
      tile.style.borderRadius = "5px";

      if (cell === 1) {
        tile.style.background = "#60463a";
        tile.disabled = true;
      } else {
        tile.style.background = "#f5eee9";
      }

      if (x === player.x && y === player.y) {
        tile.textContent = "🙂";
        tile.style.background = "#d9c4e8";
      }

      if (x === goal.x && y === goal.y) {
        tile.textContent = "☕";
        tile.style.background = "#f1d19f";
      }

      if (cell === 0) {
        tile.addEventListener("click", () => moveTo(x, y));
      }

      maze.appendChild(tile);
    });
  });
}

function moveTo(x, y) {
  if (!playing || failed) return;

  const distance =
    Math.abs(x - player.x) +
    Math.abs(y - player.y);

  if (distance !== 1) return;
  if (map[y]?.[x] !== 0) return;

  player = { x, y };
  moves++;

  movesText.textContent = String(moves);

  if (moves > MAX_MOVES) {
    failGame("너무 많이 돌아갔어요!");
    return;
  }

  render();

  if (player.x === goal.x && player.y === goal.y) {
    if (moves < MIN_MOVES) {
      failGame("아직 조건을 충족하지 못했어요!");
      return;
    }

    finishGame();
  }
}

function startGame() {
  player = { ...playerStart };
  moves = 0;
  playing = true;
  failed = false;

  movesText.textContent = "0";

  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  render();
}

function failGame(message) {
  playing = false;
  failed = true;

  alert(message);

  startButton.hidden = false;
  startButton.textContent = "다시 도전";
}

function finishGame() {
  playing = false;
  nameArea.hidden = false;
  nameInput.focus();
}

if (controls) {
  controls.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const directions = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
      };

      const direction = directions[button.dataset.direction];

      if (!direction) return;

      moveTo(
        player.x + direction[0],
        player.y + direction[1]
      );
    });
  });
}

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
