const API = "http://localhost:3000/api";

let currentUser = null;

async function registerUser() {
  const name = prompt("이름을 입력해주세요.");

  if (!name) {
    return;
  }

  const response = await fetch(`${API}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error ?? "등록에 실패했습니다.");
    return;
  }

  currentUser = data;

  alert(`${data.name}님, 환영합니다!`);
}

async function completeGame(gameType, score) {
  if (!currentUser) {
    await registerUser();

    if (!currentUser) {
      return;
    }
  }

  const response = await fetch(`${API}/games/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId: currentUser.id,
      gameType,
      score
    })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error ?? "처리에 실패했습니다.");
    return;
  }

  alert(data.message);
}

document
  .querySelectorAll(".game-button")
  .forEach(button => {

    button.addEventListener("click", async () => {
      const game = button.dataset.game;

      if (game === "fortune") {
        const fortunes = [
          "오늘은 좋은 일이 생길 수 있어요! 🍀",
          "새로운 도전을 해보세요! ✨",
          "오늘의 행운은 커피입니다! ☕",
          "친구와 함께하면 더 즐거운 하루! 😎"
        ];

        const result =
          fortunes[
            Math.floor(Math.random() * fortunes.length)
          ];

        alert(result);
        return;
      }

      if (game === "random") {
        const number =
          Math.floor(Math.random() * 100) + 1;

        alert(`오늘의 행운 숫자: ${number}`);
        return;
      }

      if (game === "maze") {
        // 임시 게임
        const score = Number(
          prompt("미로 게임 점수를 입력하세요. (개발용)")
        );

        if (Number.isFinite(score)) {
          await completeGame("maze", score);
        }

        return;
      }

      if (game === "button") {
        // 임시 게임
        const score = Number(
          prompt("버튼 누르기 점수를 입력하세요. (개발용)")
        );

        if (Number.isFinite(score)) {
          await completeGame("button", score);
        }
      }
    });
  });
