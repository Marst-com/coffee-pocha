"use strict";

/*
 * 커피포차
 * 게임 목록 이동 기능
 */

document.addEventListener("DOMContentLoaded", () => {

  const sliders = document.querySelectorAll(".game-slider");

  sliders.forEach((slider) => {

    const viewport =
      slider.querySelector(".game-viewport");

    const list =
      slider.querySelector(".game-list");

    const prev =
      slider.querySelector(".game-nav.prev");

    const next =
      slider.querySelector(".game-nav.next");


    if (
      !viewport ||
      !list ||
      !prev ||
      !next
    ) {
      return;
    }


    let position = 0;


    /* 카드 하나의 실제 이동 거리 */

    const getStep = () => {

      const card =
        list.querySelector(".game-card");

      if (!card) {
        return 0;
      }

      const styles =
        window.getComputedStyle(list);

      const gap =
        parseFloat(styles.gap) || 0;

      return card.offsetWidth + gap;
    };


    /* 최대 이동 거리 */

    const getMaxPosition = () => {

      return Math.max(
        0,
        list.scrollWidth -
        viewport.clientWidth
      );
    };


    /* 화면 업데이트 */

    const update = () => {

      const maxPosition =
        getMaxPosition();


      position =
        Math.max(
          0,
          Math.min(
            position,
            maxPosition
          )
        );


      list.style.transform =
        `translateX(-${position}px)`;


      prev.disabled =
        position <= 0;


      next.disabled =
        position >= maxPosition - 1;
    };


    /* 이전 */

    prev.addEventListener(
      "click",
      () => {

        const step =
          getStep();

        position -=
          step * 2;

        update();
      }
    );


    /* 다음 */

    next.addEventListener(
      "click",
      () => {

        const step =
          getStep();

        position +=
          step * 2;

        update();
      }
    );


    /* 화면 크기 변경 */

    window.addEventListener(
      "resize",
      update
    );


    update();

  });

});
