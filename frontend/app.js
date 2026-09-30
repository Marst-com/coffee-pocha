const buttons = document.querySelectorAll(".game-button");

buttons.forEach((button) => {
  button.addEventListener("click", () => {

    const game = button.dataset.game;

    switch (game) {

      case "fortune":
        showFortune();
        break;

      case "luck":
        showLuck();
        break;

      case "maze":
        startMaze();
        break;

      case "button":
        startButtonGame();
        break;

      default:
        console.warn("알 수 없는 게임:", game);
    }
  });
});


/* =========================
   재미게임
========================= */

function showFortune() {

  const fortunes = [
    "오늘은 좋은 일이 생길지도 몰라요! 🍀",
    "오늘의 행운은 커피입니다! ☕",
    "새로운 사람과 좋은 인연이 생길 수 있어요! ✨",
    "오늘은 작은 도전을 해보세요! 🚀",
    "맛있는 것을 먹으면 행운이 찾아옵니다! 😋"
  ];

  const result =
    fortunes[
      Math.floor(Math.random() * fortunes.length)
    ];

  alert(`🔮 오늘의 운세\n\n${result}`);
}


function showLuck() {

  const number =
    Math.floor(Math.random() * 100) + 1;

  alert(
    `🍀 오늘의 행운 숫자\n\n${number}`
  );
}


/* =========================
   커피획득게임
========================= */

function startMaze() {

  alert(
    "🌀 미로게임\n\n" +
    "미로게임은 다음 단계에서 만들 예정!"
  );
}


function startButtonGame() {

  alert(
    "👆 버튼 누르기\n\n" +
    "버튼게임은 다음 단계에서 만들 예정!"
  );
}
