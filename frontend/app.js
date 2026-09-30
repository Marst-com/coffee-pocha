"use strict";


document.addEventListener("DOMContentLoaded", () => {

  /*
   * 각 게임 슬라이더 독립적으로 동작
   */

  const sliders =
    document.querySelectorAll(".game-slider");


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


    /*
     * 카드 하나가 이동할 거리
     */

    function getStep() {

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
    }


    /*
     * 최대 이동 거리
     */

    function getMaxPosition() {

      return Math.max(
        0,
        list.scrollWidth -
        viewport.clientWidth
      );
    }


    /*
     * UI 업데이트
     */

    function update() {

      const max =
        getMaxPosition();


      position =
        Math.max(
          0,
          Math.min(position, max)
        );


      list.style.transform =
        `translate3d(-${position}px, 0, 0)`;


      prev.disabled =
        position <= 0;


      next.disabled =
        position >= max - 1;
    }


    /*
     * 이전
     *
     * 한 번에 2장
     */

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


    /*
     * 다음
     */

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


    /*
     * 창 크기 변경
     */

    window.addEventListener(
      "resize",
      update
    );


    /*
     * 처음 상태
     */

    update();

  });

});
