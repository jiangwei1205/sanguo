/* =========================================================
   參國｜專題報告背景預載器
   ---------------------------------------------------------
   目的：
   1. 首頁先正常顯示，不搶首屏載入速度。
   2. 閒置後才分批預載下一頁素材。
   3. 最多同時下載 2 個檔案，避免把網路塞爆。
   4. 不播放任何音效、不改任何動畫與功能。
   5. 低速網路 / Data Saver 自動減少大量預載。
========================================================= */

(() => {
  "use strict";

  if (window.__SANGUO_REPORT_PRELOADER__) {
    return;
  }

  window.__SANGUO_REPORT_PRELOADER__ = true;


  /* =====================================================
     連線狀態
  ===================================================== */

  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection ||
    null;

  const isConservativeConnection =
    !!(
      connection &&
      (
        connection.saveData ||
        connection.effectiveType === "slow-2g" ||
        connection.effectiveType === "2g"
      )
    );


  /* =====================================================
     預載佇列
  ===================================================== */

  const queued = new Set();

  const queue = [];

  let activeCount = 0;

  const MAX_CONCURRENT = 2;


  function normalizeUrl(path) {
    try {
      return new URL(
        path,
        document.baseURI
      ).href;
    }
    catch {
      return null;
    }
  }


  function addToQueue(paths, urgent = false) {

    paths.forEach(path => {

      const url =
        normalizeUrl(path);

      if (
        !url ||
        queued.has(url)
      ) {
        return;
      }

      queued.add(url);

      if (urgent) {
        queue.unshift(url);
      }
      else {
        queue.push(url);
      }

    });

    pumpQueue();

  }


  function pumpQueue() {

    while (
      activeCount < MAX_CONCURRENT &&
      queue.length > 0
    ) {

      const url =
        queue.shift();

      activeCount++;

      fetch(
        url,
        {
          method: "GET",
          credentials: "same-origin"
        }
      )
        .catch(() => {
          /*
            預載失敗不影響網站本身。
            真正進入頁面時仍會照正常方式載入。
          */
        })
        .finally(() => {

          activeCount--;

          pumpQueue();

        });

    }

  }


  /* =====================================================
     閒置後執行
  ===================================================== */

  function runWhenIdle(
    callback,
    delay = 0
  ) {

    window.setTimeout(
      () => {

        if (
          "requestIdleCallback"
          in window
        ) {

          window.requestIdleCallback(
            callback,
            {
              timeout: 1800
            }
          );

        }
        else {

          callback();

        }

      },
      delay
    );

  }


  /* =====================================================
     第一階段
     下一頁 HTML + CSS

     這一批相對小，
     優先讓頁面切換本身更快。
  ===================================================== */

  const PAGE_CORE = [

    "QuizEntry.html",
    "QuizPage.html",
    "Pickcard.html",
    "Card.html",

    "css/QuizEntry.css",
    "css/QuizPage.css",
    "css/Pickcard.css",
    "css/GachaIntro.css",
    "css/Card.css"

  ];


  /* =====================================================
     第二階段
     群雄問答

     報告流程通常會很早展示，
     所以優先於抽卡大量素材。
  ===================================================== */

  const QUIZ_ASSETS = [

    "images/quiz1.png",
    "images/quizback.png",
    "images/quizentry.png",
    "images/quiz-paper-bg.png",

    "audio/quiz-correct.mp3",
    "audio/quiz-wrong.mp3",
    "audio/quiz-token-reward.mp3",
    "audio/quiz-bgm.mp3"

  ];


  /* =====================================================
     第三階段
     招賢台 / 十抽

     五格漫畫與主要抽卡音效先放入快取。
  ===================================================== */

  const GACHA_ASSETS = [

    "images/招賢台背景.png",

    "images/gacha-comic/01.png",
    "images/gacha-comic/02.png",
    "images/gacha-comic/03.png",
    "images/gacha-comic/04.png",
    "images/gacha-comic/05.png",

    "audio/card-flip.mp3",
    "audio/ssr-reveal.mp3",

    "audio/gacha-card-drop.mp3",
    "audio/gacha-single-charge.mp3",
    "audio/gacha-ten-bgm.mp3",

    "audio/gacha-intro-page.mp3",
    "audio/gacha-intro-rumble.mp3",
    "audio/gacha-intro-glow.mp3",
    "audio/gacha-intro-burst.mp3",
    "audio/gacha-intro-eye.mp3",
    "audio/gacha-intro-flash.mp3"

  ];


  /* =====================================================
     第四階段
     人物圖鑑

     不把全部 190 MB 都抓下來，
     只先抓報告最常展示的主要人物。
  ===================================================== */

  const CODEX_ASSETS = [

    "images/card-bg.png",

    "images/曹操.png",
    "images/劉備.png",
    "images/孫權.png",
    "images/關羽.png",
    "images/司馬懿.png",
    "images/趙雲.png",
    "images/諸葛亮.png",
    "images/張飛.png",
    "images/黃蓋.png",
    "images/specialcard.png"

  ];


  /* =====================================================
     滑鼠移到導覽按鈕時
     提前把該區素材排到最前面。

     報告用桌機時特別有用：
     游標移到按鈕 → 點擊之間就開始準備。
  ===================================================== */

  function prioritizeLink(target) {

    if (!(target instanceof Element)) {
      return;
    }

    const link =
      target.closest("a[href]");

    if (!link) {
      return;
    }

    let href;

    try {

      href =
        new URL(
          link.href,
          document.baseURI
        );

    }
    catch {

      return;

    }


    const fileName =
      href.pathname
        .split("/")
        .pop()
        .toLowerCase();


    if (
      fileName === "quizentry.html" ||
      fileName === "quizpage.html"
    ) {

      addToQueue(
        QUIZ_ASSETS,
        true
      );

    }


    else if (
      fileName === "pickcard.html"
    ) {

      addToQueue(
        GACHA_ASSETS,
        true
      );

    }


    else if (
      fileName === "card.html"
    ) {

      addToQueue(
        CODEX_ASSETS,
        true
      );

    }

  }


  document.addEventListener(
    "pointerover",
    event => {
      prioritizeLink(
        event.target
      );
    },
    {
      passive: true
    }
  );


  document.addEventListener(
    "focusin",
    event => {
      prioritizeLink(
        event.target
      );
    }
  );


  /* =====================================================
     正式背景預載時程
  ===================================================== */

  window.addEventListener(
    "load",
    () => {

      /*
        首頁完整出現後才開始，
        所以不跟 Hero 首屏搶資源。
      */

      runWhenIdle(
        () => {
          addToQueue(
            PAGE_CORE
          );
        },
        700
      );


      /*
        問答素材
      */

      runWhenIdle(
        () => {
          addToQueue(
            QUIZ_ASSETS
          );
        },
        1800
      );


      /*
        網路正常才背景準備較大的抽卡素材。
      */

      if (
        !isConservativeConnection
      ) {

        runWhenIdle(
          () => {
            addToQueue(
              GACHA_ASSETS
            );
          },
          3800
        );


        /*
          圖鑑圖片最後才載，
          不跟抽卡搶頻寬。
        */

        runWhenIdle(
          () => {
            addToQueue(
              CODEX_ASSETS
            );
          },
          7000
        );

      }

    },
    {
      once: true
    }
  );

})();