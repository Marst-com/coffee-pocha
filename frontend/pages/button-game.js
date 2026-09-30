import {
  saveGameResult,
  saveCoffee
} from "../firebase/firebase.js";


const timer =
  document.querySelector("#timer");

const scoreText =
  document.querySelector("#score");

const clickButton =
  document.querySelector("#clickButton");

const startButton =
  document.querySelector("#startButton");

const nameArea =
  document.querySelector("#nameArea");

const nameInput =
  document.querySelector("#nameInput");

const receiveButton =
  document.querySelector("#receiveButton");

const completeArea =
  document.querySelector("#completeArea");

const completeText =
  document.querySelector("#completeText");


let score = 0;
let playing = false;
let startTime = 0;
let timerId = null;


clickButton.disabled = true;


startButton.addEventListener(
  "click",
  startGame
);


clickButton.addEventListener(
  "click",
  () => {

    if (!playing) {
      return;
    }

    score++;

    scoreText.textContent =
      String(score);
  }
);


function startGame() {

  if (playing) {
    return;
  }

  score = 0;

  scoreText.textContent = "0";

  timer.textContent = "10.00";

  playing = true;

  clickButton.disabled = false;

  startButton.disabled = true;

  startButton.hidden = true;

  nameArea.hidden = true;

  completeArea.hidden = true;


  startTime =
    performance.now();


  timerId =
    requestAnimationFrame(updateTimer);
}


function updateTimer(now) {

  if (!playing) {
    return;
  }

  const elapsed =
    now - startTime;

  const remaining =
    Math.max(
      0,
      10000 - elapsed
    );


  timer.textContent =
    (remaining / 1000).toFixed(2);


  if (remaining <= 0) {

    finishGame();

    return;
  }


  timerId =
    requestAnimationFrame(updateTimer);
}


function finishGame() {

  playing = false;

  cancelAnimationFrame(timerId);

  clickButton.disabled = true;

  timer.textContent = "0.00";

  nameArea.hidden = false;

  nameInput.focus();
}


receiveButton.addEventListener(
  "click",
  async () => {

    const name =
      nameInput.value.trim();


    if (!name) {

      alert(
        "이름을 입력해주세요!"
      );

      nameInput.focus();

      return;
    }


    receiveButton.disabled = true;

    receiveButton.textContent =
      "저장 중...";


    try {

      await saveGameResult({
        name,
        game: "button-game",
        score,
        coffee: 1
      });


      await saveCoffee({
        name,
        game: "button-game",
        amount: 1
      });


      nameArea.hidden = true;

      completeArea.hidden = false;

      completeText.textContent =
        `${name}님, 커피 1잔을 획득했습니다!`;

    } catch (error) {

      console.error(error);

      alert(
        "커피 기록 저장에 실패했습니다."
      );

      receiveButton.disabled = false;

      receiveButton.textContent =
        "☕ 커피 받기";
    }

  }
);
