import { saveGameResult, saveCoffee } from "../firebase/firebase.js";

const game = document.querySelector("#bombGame");
const scoreText = document.querySelector("#score");
const startButton = document.querySelector("#startButton");
const nameArea = document.querySelector("#nameArea");
const nameInput = document.querySelector("#nameInput");
const receiveButton = document.querySelector("#receiveButton");
const completeArea = document.querySelector("#completeArea");
const completeText = document.querySelector("#completeText");

let playing = false;
let startTime = 0;
let animationId = null;
let bomb = null;
let player = null;
let keys = new Set();

game.style.position = "relative";
game.style.width = "min(420px, 100%)";
game.style.height = "300px";
game.style.marginTop = "22px";
game.style.borderRadius = "22px";
game.style.background = "#f5eee9";
game.style.overflow = "hidden";

function createGame() {
  game.innerHTML = "";

  player = document.createElement("div");
  player.textContent = "🙂";

  Object.assign(player.style, {
    position: "absolute",
    left: "50%",
    bottom: "15px",
    transform: "translateX(-50%)",
    fontSize: "34px",
    zIndex: "2"
  });

  bomb = document.createElement("div");
  bomb.textContent = "💣";

  Object.assign(bomb.style, {
    position: "absolute",
    top: "-45px",
    left: `${10 + Math.random() * 80}%`,
    fontSize: "34px"
  });

  game.append(player, bomb);
}

function startGame() {
  cancelAnimationFrame(animationId);

  playing = true;
  startTime = performance.now();

  scoreText.textContent = "0.0";
  nameArea.hidden = true;
  completeArea.hidden = true;
  startButton.hidden = true;

  createGame();
  animationId = requestAnimationFrame(loop);
}

function loop(now) {
  if (!playing) return;

  const elapsed = now - startTime;
  const seconds = elapsed / 1000;

  scoreText.textContent = seconds.toFixed(1);

  const bombTop = -45 + seconds * 95;
  bomb.style.top = `${bombTop}px`;

  if (bombTop > 300) {
    bomb.style.top = "-45px";
    bomb.style.left = `${10 + Math.random() * 80}%`;
  }

  if (keys.has("ArrowLeft")) {
    player.style.left =
      `${Math.max(8, parseFloat(player.style.left) - 0.8)}%`;
  }

  if (keys.has("ArrowRight")) {
    player.style.left =
      `${Math.min(92, parseFloat(player.style.left) + 0.8)}%`;
  }

  const playerRect = player.getBoundingClientRect();
  const bombRect = bomb.getBoundingClientRect();

  const collision =
    playerRect.left < bombRect.right &&
    playerRect.right > bombRect.left &&
    playerRect.top < bombRect.bottom &&
    playerRect.bottom > bombRect.top;

  if (collision) {
    finishGame(seconds);
    return;
  }

  animationId = requestAnimationFrame(loop);
}

function finishGame(seconds) {
  playing = false;
  cancelAnimationFrame(animationId);

  scoreText.textContent = seconds.toFixed(1);

  nameArea.hidden = false;
  nameInput.focus();

  nameArea.dataset.score = String(seconds.toFixed(1));
}

document.addEventListener("keydown", (event) => {
  if (
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight"
  ) {
    keys.add(event.key);
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

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
      game: "bomb",
      score,
      coffee: 1
    });

    await saveCoffee({
      name,
      game: "bomb",
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
