/* ======================================
   全站按鈕點擊音效
   - 以目前 js/main.js 的位置自動找到 ../audio/ui-click.mp3
   - 真正按下（pointerdown）才播放，不是 hover
   - 不更動任何原本按鈕功能
   - 若音效檔載入失敗，Console 會顯示路徑方便檢查
====================================== */
(() => {
  const currentScriptSrc =
    document.currentScript && document.currentScript.src
      ? document.currentScript.src
      : new URL("js/main.js", document.baseURI).href;

  const uiClickUrl =
    new URL("../audio/ui-click.mp3", currentScriptSrc).href;

  const uiClickTemplate =
    new Audio(uiClickUrl);

  uiClickTemplate.preload = "auto";
  uiClickTemplate.volume = 1.0;

  uiClickTemplate.addEventListener(
    "error",
    () => {
      console.warn(
        "參國按鈕音效載入失敗，請確認檔案存在：",
        uiClickUrl
      );
    }
  );

  function playUiClickSound() {
    const sound = uiClickTemplate.cloneNode(true);
    sound.volume = 1.0;
    sound.currentTime = 0;

    sound.play().catch(error => {
      console.warn(
        "參國按鈕音效播放失敗：",
        error
      );
    });
  }

  function getUiControl(target) {
    if (!(target instanceof Element)) {
      return null;
    }

    const control =
      target.closest(
        'button, .btn, [role="button"]'
      );

    if (!control) {
      return null;
    }

    /* 群雄問答的答案按鈕使用自己的答對 / 答錯音效，
       不再疊加全站按鈕聲，避免答錯音被蓋住。 */
    if (
      control.matches(".quiz-option-btn")
    ) {
      return null;
    }

    /* NPC 本體、人物圖鑑 Q 版小人物、BGM 開關都有自己的聲音／功能，
       不再疊加全站 ui-click。 */
    if (
      control.matches(
        ".npc-character, .hero-sprite, .sanguo-bgm-toggle"
      )
    ) {
      return null;
    }

    if (
      control.matches(":disabled") ||
      control.getAttribute("aria-disabled") === "true"
    ) {
      return null;
    }

    // 導覽列的一般文字連結不播放；漢堡按鈕仍會播放。
    if (
      control.tagName === "A" &&
      control.closest(".nav-menu")
    ) {
      return null;
    }

    return control;
  }

  document.addEventListener(
    "pointerdown",
    event => {
      if (getUiControl(event.target)) {
        playUiClickSound();
      }
    },
    true
  );

  // 鍵盤操作按鈕時也能有聲音。
  document.addEventListener(
    "keydown",
    event => {
      if (
        (event.key === "Enter" || event.key === " ") &&
        getUiControl(event.target)
      ) {
        playUiClickSound();
      }
    },
    true
  );

  // 方便測試：在 Console 輸入 testSanguoUiClick() 可直接播放。
  window.testSanguoUiClick =
    playUiClickSound;
})();



/* ======================================
   全站背景音樂 + 靜音按鈕
   - audio/sanguo-bgm.mp3
   - localStorage 記住開 / 關
   - sessionStorage 記住換頁前播放位置
   - 若瀏覽器禁止自動播放，第一次互動後再開始
====================================== */
(() => {

  const BGM_ENABLED_KEY =
    "sanguoBgmEnabled";

  const BGM_TIME_KEY =
    "sanguoBgmTime";

  const BGM_LEAVE_AT_KEY =
    "sanguoBgmLeaveAt";


  const bgmUrl =
    new URL(
      "audio/sanguo-bgm.mp3",
      document.baseURI
    ).href;


  const bgm =
    new Audio(
      bgmUrl
    );


  bgm.preload =
    "auto";

  bgm.loop =
    true;

  bgm.volume =
    0.21;


  let bgmEnabled =
    localStorage.getItem(
      BGM_ENABLED_KEY
    )
    !==
    "false";


  let bgmStarted =
    false;

  let bgmSuppressedByGacha =
    false;

  let bgmShouldResumeAfterGacha =
    false;

  let bgmSuppressedByQuiz =
    false;

  let bgmSuppressedByLubuEvent =
    false;

  let bgmSuppressedByCodex =
    false;

  let bgmFadeTimer =
    null;


  const savedTime =
    parseFloat(
      sessionStorage.getItem(
        BGM_TIME_KEY
      )
      ||
      "0"
    );


  const savedLeaveAt =
    parseInt(
      sessionStorage.getItem(
        BGM_LEAVE_AT_KEY
      )
      ||
      "0",
      10
    );


  bgm.addEventListener(
    "loadedmetadata",
    () => {

      let resumeTime =
        savedTime;


      if (
        Number.isFinite(
          savedTime
        )
        &&
        savedTime >= 0
        &&
        Number.isFinite(
          savedLeaveAt
        )
        &&
        savedLeaveAt > 0
      ) {

        const elapsedSeconds =
          Math.max(
            0,
            (
              Date.now()
              -
              savedLeaveAt
            )
            /
            1000
          );


        resumeTime =
          savedTime
          +
          elapsedSeconds;

      }


      if (
        Number.isFinite(
          resumeTime
        )
        &&
        resumeTime >= 0
        &&
        Number.isFinite(
          bgm.duration
        )
        &&
        bgm.duration > 0
      ) {

        bgm.currentTime =
          resumeTime
          %
          bgm.duration;

      }

    },
    {
      once: true
    }
  );


  function tryPlayBgm() {

    if (
      !bgmEnabled
      ||
      bgmSuppressedByGacha
      ||
      bgmSuppressedByQuiz
      ||
      bgmSuppressedByLubuEvent
      ||
      bgmSuppressedByCodex
    ) {
      return;
    }


    const playPromise =
      bgm.play();


    if (playPromise) {

      playPromise
        .then(
          () => {

            bgmStarted =
              true;

          }
        )
        .catch(
          () => {

            bgmStarted =
              false;

          }
        );

    }

  }



  function fadeSiteBgmTo(
    targetVolume,
    duration = 320,
    onComplete = null
  ) {

    if (bgmFadeTimer) {
      clearInterval(bgmFadeTimer);
      bgmFadeTimer = null;
    }

    const startVolume =
      bgm.volume;

    const startedAt =
      performance.now();

    bgmFadeTimer =
      setInterval(
        () => {

          const progress =
            Math.min(
              1,
              (
                performance.now()
                -
                startedAt
              )
              /
              Math.max(1, duration)
            );

          bgm.volume =
            startVolume
            +
            (
              targetVolume
              -
              startVolume
            )
            *
            progress;

          if (progress >= 1) {

            clearInterval(
              bgmFadeTimer
            );

            bgmFadeTimer =
              null;

            if (
              typeof onComplete
              ===
              "function"
            ) {

              onComplete();

            }

          }

        },
        16
      );

  }


  window.addEventListener(
    "sanguo:gacha-bgm-start",
    () => {

      if (
        bgmSuppressedByGacha
      ) {
        return;
      }

      bgmSuppressedByGacha =
        true;

      bgmShouldResumeAfterGacha =
        bgmEnabled
        &&
        !bgm.paused;

      if (
        !bgm.paused
      ) {

        fadeSiteBgmTo(
          0,
          320,
          () => {

            bgm.pause();

            bgmStarted =
              false;

            bgm.volume =
              0.21;

          }
        );

      }

    }
  );


  window.addEventListener(
    "sanguo:gacha-bgm-end",
    () => {

      const shouldResume =
        bgmShouldResumeAfterGacha;

      bgmShouldResumeAfterGacha =
        false;

      bgmSuppressedByGacha =
        false;

      if (
        shouldResume
        &&
        bgmEnabled
        &&
        !bgmSuppressedByQuiz
        &&
        !bgmSuppressedByLubuEvent
        &&
        !bgmSuppressedByCodex
      ) {

        bgm.volume =
          0;

        const playPromise =
          bgm.play();

        if (playPromise) {

          playPromise
            .then(
              () => {

                bgmStarted =
                  true;

                fadeSiteBgmTo(
                  0.21,
                  420
                );

              }
            )
            .catch(
              () => {

                bgm.volume =
                  0.21;

                bgmStarted =
                  false;

              }
            );

        }

      }

      else {

        bgm.volume =
          0.21;

      }

    }
  );



  window.addEventListener(
    "sanguo:quiz-bgm-start",
    () => {

      if (bgmSuppressedByQuiz) {
        return;
      }

      bgmSuppressedByQuiz =
        true;

      if (!bgm.paused) {

        fadeSiteBgmTo(
          0,
          300,
          () => {

            bgm.pause();

            bgmStarted =
              false;

            bgm.volume =
              0.21;

          }
        );

      }

    }
  );


  window.addEventListener(
    "sanguo:quiz-bgm-end",
    () => {

      bgmSuppressedByQuiz =
        false;

      if (
        bgmEnabled
        &&
        !bgmSuppressedByGacha
        &&
        !bgmSuppressedByLubuEvent
        &&
        !bgmSuppressedByCodex
      ) {

        bgm.volume =
          0;

        const playPromise =
          bgm.play();

        if (playPromise) {

          playPromise
            .then(
              () => {

                bgmStarted =
                  true;

                fadeSiteBgmTo(
                  0.21,
                  420
                );

              }
            )
            .catch(
              () => {

                bgm.volume =
                  0.21;

                bgmStarted =
                  false;

              }
            );

        }

      }

      else {

        bgm.volume =
          0.21;

      }

    }
  );



  window.addEventListener(
    "sanguo:lubu-event-bgm-start",
    () => {

      if (
        bgmSuppressedByLubuEvent
      ) {
        return;
      }

      bgmSuppressedByLubuEvent =
        true;

      if (
        !bgm.paused
      ) {

        fadeSiteBgmTo(
          0,
          260,
          () => {

            bgm.pause();

            bgmStarted =
              false;

            bgm.volume =
              0.21;

          }
        );

      }

    }
  );


  window.addEventListener(
    "sanguo:lubu-event-bgm-end",
    () => {

      bgmSuppressedByLubuEvent =
        false;

      /*
        彩蛋配樂屬於劇情演出：
        - 即使玩家關閉全站 BGM，彩蛋音樂仍可播放。
        - 彩蛋結束後只有在全站 BGM 原本開啟時才恢復。
      */
      if (
        bgmEnabled
        &&
        !bgmSuppressedByGacha
        &&
        !bgmSuppressedByQuiz
        &&
        !bgmSuppressedByCodex
      ) {

        bgm.volume =
          0;

        const playPromise =
          bgm.play();

        if (playPromise) {

          playPromise
            .then(
              () => {

                bgmStarted =
                  true;

                fadeSiteBgmTo(
                  0.21,
                  380
                );

              }
            )
            .catch(
              () => {

                bgm.volume =
                  0.21;

                bgmStarted =
                  false;

              }
            );

        }

      }

      else {

        bgm.volume =
          0.21;

      }

    }
  );



  window.addEventListener(
    "sanguo:codex-bgm-start",
    () => {

      if (bgmSuppressedByCodex) {
        return;
      }

      bgmSuppressedByCodex =
        true;

      if (!bgm.paused) {

        fadeSiteBgmTo(
          0,
          260,
          () => {

            bgm.pause();

            bgmStarted =
              false;

            bgm.volume =
              0.21;

          }
        );

      }

    }
  );


  window.addEventListener(
    "sanguo:codex-bgm-end",
    () => {

      bgmSuppressedByCodex =
        false;

      if (
        bgmEnabled
        &&
        !bgmSuppressedByGacha
        &&
        !bgmSuppressedByQuiz
        &&
        !bgmSuppressedByLubuEvent
      ) {

        bgm.volume =
          0;

        const playPromise =
          bgm.play();

        if (playPromise) {

          playPromise
            .then(
              () => {

                bgmStarted =
                  true;

                fadeSiteBgmTo(
                  0.21,
                  360
                );

              }
            )
            .catch(
              () => {

                bgm.volume =
                  0.21;

                bgmStarted =
                  false;

              }
            );

        }

      }

      else {

        bgm.volume =
          0.21;

      }

    }
  );


  function updateBgmButton() {

    if (!bgmButton) {
      return;
    }


    bgmButton.textContent =
      bgmEnabled
        ? "♫"
        : "🔇";


    bgmButton.title =
      bgmEnabled
        ? "關閉背景音樂"
        : "開啟背景音樂";


    bgmButton.setAttribute(
      "aria-pressed",
      bgmEnabled
        ? "true"
        : "false"
    );

  }


  function handleFirstInteraction() {

    if (
      bgmEnabled
      &&
      !bgmStarted
    ) {

      tryPlayBgm();

    }

  }


  const bgmButton =
    document.createElement(
      "button"
    );


  bgmButton.type =
    "button";

  bgmButton.className =
    "sanguo-bgm-toggle";


  bgmButton.setAttribute(
    "aria-label",
    "背景音樂開關"
  );


  Object.assign(
    bgmButton.style,
    {

      position:
        "fixed",

      left:
        "18px",

      bottom:
        "18px",

      width:
        "42px",

      height:
        "42px",

      zIndex:
        "10050",

      border:
        "1px solid rgba(196,157,92,.65)",

      borderRadius:
        "50%",

      background:
        "rgba(18,14,11,.90)",

      color:
        "#e8d3a6",

      fontSize:
        "18px",

      fontFamily:
        "'Noto Serif TC', serif",

      cursor:
        "pointer",

      boxShadow:
        "0 5px 16px rgba(0,0,0,.35)",

      backdropFilter:
        "blur(6px)",

      display:
        "flex",

      alignItems:
        "center",

      justifyContent:
        "center",

      lineHeight:
        "1"

    }
  );


  bgmButton.addEventListener(
    "pointerdown",
    event => {

      event.stopPropagation();

    }
  );


  bgmButton.addEventListener(
    "click",
    event => {

      event.stopPropagation();


      bgmEnabled =
        !bgmEnabled;


      localStorage.setItem(
        BGM_ENABLED_KEY,
        bgmEnabled
          ? "true"
          : "false"
      );


      if (bgmEnabled) {

        tryPlayBgm();

      }

      else {

        bgm.pause();

        bgmStarted =
          false;

      }


      updateBgmButton();

    }
  );


  document.addEventListener(
    "DOMContentLoaded",
    () => {

      if (
        !document.body.contains(
          bgmButton
        )
      ) {

        document.body.appendChild(
          bgmButton
        );

      }


      updateBgmButton();


      if (bgmEnabled) {

        tryPlayBgm();

      }

    },
    {
      once: true
    }
  );


  document.addEventListener(
    "pointerdown",
    handleFirstInteraction,
    {
      passive: true
    }
  );


  document.addEventListener(
    "keydown",
    handleFirstInteraction
  );


  window.addEventListener(
    "beforeunload",
    () => {

      if (
        Number.isFinite(
          bgm.currentTime
        )
      ) {

        sessionStorage.setItem(
          BGM_TIME_KEY,
          String(
            bgm.currentTime
          )
        );

      }


      sessionStorage.setItem(
        BGM_LEAVE_AT_KEY,
        String(
          Date.now()
        )
      );

    }
  );

})();


/* ======================================
   Book Flip
====================================== */

function flipBook(element) {
  element.classList.toggle("flipped");
}


/* ======================================
   Story Expand / Collapse
====================================== */

function toggleStory(button) {

  const content =
    button.closest(".story-content");

  if (!content) {
    return;
  }

  content.classList.toggle("expanded");

  const isOpen =
    content.classList.contains("expanded");

  const text =
    button.querySelector(".toggle-text");

  if (text) {
    text.textContent =
      isOpen
        ? "收起完整故事"
        : "查看完整故事";
  }

}


/* ======================================
   手機導覽選單
   - 補回漢堡按鈕實際開 / 關功能
   - 同步 aria-expanded / aria-label
   - 點選連結、點外部、Esc 都會關閉
   - 展開時鎖住頁面捲動，避免背景跟著滑
====================================== */
(() => {
  const menuButton = document.querySelector(".mobile-menu-btn");
  const primaryNav = document.getElementById("primaryNav");

  if (!menuButton || !primaryNav) {
    return;
  }

  /* 手機選單標題依目前頁面自動顯示，不再固定寫「參國 · 導覽」。 */
  const currentFile =
    decodeURIComponent(window.location.pathname.split("/").pop() || "")
      .toLowerCase();

  let currentPageName = "首頁";

  if (currentFile === "card.html") {
    currentPageName = "人物圖鑑";
  }
  else if (currentFile === "pickcard.html") {
    currentPageName = "招賢台";
  }
  else if (currentFile === "quizentry.html" || currentFile === "quizpage.html") {
    currentPageName = "群雄問答";
  }
  else if (currentFile === "homepage.html" || currentFile === "index.html" || currentFile === "") {
    currentPageName = "首頁";
  }

  primaryNav.dataset.mobileTitle = `目前所在 · ${currentPageName}`;

  function setMobileMenu(open) {
    const shouldOpen = Boolean(open) && window.innerWidth <= 1000;

    primaryNav.classList.toggle("mobile-open", shouldOpen);
    document.body.classList.toggle("mobile-nav-open", shouldOpen);

    menuButton.setAttribute(
      "aria-expanded",
      shouldOpen ? "true" : "false"
    );
    menuButton.setAttribute(
      "aria-label",
      shouldOpen ? "關閉選單" : "開啟選單"
    );

    menuButton.textContent = shouldOpen ? "×" : "☰";
  }

  menuButton.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();

    setMobileMenu(
      !primaryNav.classList.contains("mobile-open")
    );
  });

  primaryNav.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (link) {
      setMobileMenu(false);
    }
  });

  document.addEventListener("click", event => {
    if (!primaryNav.classList.contains("mobile-open")) {
      return;
    }

    if (
      !primaryNav.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      setMobileMenu(false);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      setMobileMenu(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1000) {
      setMobileMenu(false);
    }
  });
})();


/* ======================================
   Navbar Active Section
====================================== */

const navLinks =
  document.querySelectorAll(
    '.nav-menu a[href^="#"]:not([href="#"])'
  );


const sections =
  Array.from(
    document.querySelectorAll("section[id]")
  ).filter(section => {

    const id =
      section.getAttribute("id");

    return document.querySelector(
      `.nav-menu a[href="#${id}"]`
    );

  });


function updateActiveNav() {

  /*
    QuizEntry、Card、Pickcard 這類獨立頁面
    如果沒有首頁三個 section，
    就不動它自己的 active。
  */
  if (sections.length === 0) {
    return;
  }


  let currentSection = "";


  sections.forEach(section => {

    const sectionTop =
      section.offsetTop;

    const sectionHeight =
      section.offsetHeight;


    if (
      window.scrollY >=
        sectionTop - 180
      &&
      window.scrollY <
        sectionTop +
        sectionHeight -
        180
    ) {

      currentSection =
        section.getAttribute("id");

    }

  });


  if (!currentSection) {
    return;
  }


  navLinks.forEach(link => {

    link.classList.remove("active");


    if (
      link.getAttribute("href")
      ===
      `#${currentSection}`
    ) {

      link.classList.add(
        "active"
      );

    }

  });

}


window.addEventListener(
  "scroll",
  updateActiveNav
);


updateActiveNav();


/* ======================================
   招賢令
====================================== */

function getUserTokens() {

  return parseInt(
    localStorage.getItem(
      "userTokens"
    )
    ||
    0
  );

}


/* 更新招賢令數量並儲存 */

function setUserTokens(count) {

  localStorage.setItem(
    "userTokens",
    Math.max(
      0,
      count
    )
  );

}


/*
  頁面載入時，
  自動更新畫面上的招賢令數量
*/

document.addEventListener(
  "DOMContentLoaded",
  function () {

    const tokenCounter =
      document.getElementById(
        "tokenCounter"
      );


    if (tokenCounter) {

      tokenCounter.textContent =
        `招賢令 × ${getUserTokens()}`;

    }

  }
);


/* ==========================================================
   全站 NPC 彩蛋系統

   曹操：
   點擊 → 對話

   呂布：

   尚未取得貂蟬：
   → 偶爾停下尋找貂蟬
   → 點呂布可看尋妻台詞
   → 點對話框換下一句
   → 點外面立即收起

   已取得貂蟬：
   → 不再主動找貂蟬
   → 不提示玩家
   → 玩家自己點呂布
   → 貂蟬跑來
   → 親吻
   → 完整事件結束
   → 正式解鎖呂布
   → 第一次跳「飛將現世」
========================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* ======================================================
       NPC 資料
    ====================================================== */

    const npcList = [

      {
        id: "caocao",

        name: "曹操",

        type: "dialogue",

        cssClass:
          "npc-caocao",

        sprite:
          "images/npc-cao-walk.png",

        walkRange:
          100,

        moveSpeed:
          0.32,

        lines: [
          "「天下英雄，誰堪與孤一論？」",
          "「史書中的曹操，可沒有演義寫得那麼簡單。」",
          "「治世之能臣，亂世之奸雄……你覺得孤是哪一個？」",
          "「孟德獻刀？呵……演義之言罷了。」",
          "「你怎麼還在點孤？」",
          "「……莫非你想討招賢令？」",
          "「沒有。」"
        ]
      },


      {
        id: "lubu",

        name: "呂布",

        type: "special-event",

        cssClass:
          "npc-lubu",

        sprite:
          "images/npc-lubu-walk.png",

        walkRange:
          100,

        moveSpeed:
          0.34,

        lines: []
      }

    ];



    /* ======================================================
       抓 NPC HTML
    ====================================================== */

    const npcBox =
      document.getElementById(
        "siteNpc"
      );


    const npcCharacter =
      document.getElementById(
        "npcCharacter"
      );


    const npcSprite =
      document.getElementById(
        "npcSprite"
      );


    const npcName =
      document.getElementById(
        "npcName"
      );


    const npcDialogue =
      document.getElementById(
        "npcDialogue"
      );


    const npcDialogueText =
      document.getElementById(
        "npcDialogueText"
      );


    const npcAlert =
      document.getElementById(
        "npcAlert"
      );



    /* ======================================================
       NPC 開啟對話音效
       檔案位置：audio/npc-dialogue-open.mp3

       這版不用 Web Audio / AudioContext，
       直接在玩家 click 的同一個使用者手勢內播放，
       避免瀏覽器自動播放限制造成完全沒聲音。

       同步疊兩個完全相同的聲音，只是把音量推大，
       不會變成前後兩聲。
    ====================================================== */

    const npcDialogueSoundUrl =
      new URL(
        "audio/npc-dialogue-open.mp3",
        document.baseURI
      ).href;


    const npcDialogueSoundTemplate =
      new Audio(
        npcDialogueSoundUrl
      );


    npcDialogueSoundTemplate.preload =
      "auto";


    npcDialogueSoundTemplate.volume =
      1.0;


    npcDialogueSoundTemplate.addEventListener(
      "error",
      () => {

        console.warn(
          "NPC 對話音效載入失敗，請確認檔案存在：",
          npcDialogueSoundUrl
        );

      }
    );


    function playNpcDialogueOpenSound() {

      const soundA =
        npcDialogueSoundTemplate.cloneNode(
          true
        );


      const soundB =
        npcDialogueSoundTemplate.cloneNode(
          true
        );


      soundA.volume =
        0.68;


      soundB.volume =
        0.38;


      soundA.currentTime =
        0;


      soundB.currentTime =
        0;


      const playA =
        soundA.play();


      const playB =
        soundB.play();


      if (playA) {

        playA.catch(
          error => {

            console.warn(
              "NPC 對話音效播放失敗：",
              error
            );

          }
        );

      }


      if (playB) {

        playB.catch(
          () => {}
        );

      }

    }


    /* F12 Console 可直接輸入 testNpcDialogueSound() 測試 */
    window.testNpcDialogueSound =
      playNpcDialogueOpenSound;



    /* ======================================================
       呂布 × 貂蟬 彩蛋音效
       - 貂蟬跑步：audio/npc-diaochan-run.mp3
       - 羈絆畫面：audio/npc-lubu-diaochan-bond.mp3
    ====================================================== */

    const diaochanRunSoundUrl =
      new URL(
        "audio/npc-diaochan-run.mp3",
        document.baseURI
      ).href;


    const diaochanRunSoundTemplate =
      new Audio(
        diaochanRunSoundUrl
      );


    diaochanRunSoundTemplate.preload =
      "auto";


    diaochanRunSoundTemplate.volume =
      1.0;


    function playDiaochanRunSound() {

      const sound =
        diaochanRunSoundTemplate.cloneNode(
          true
        );


      sound.volume =
        1.0;


      sound.currentTime =
        0;


      sound.play().catch(
        error => {

          console.warn(
            "貂蟬跑步音效播放失敗：",
            error
          );

        }
      );

    }



    const lubuDiaochanBondSoundUrl =
      new URL(
        "audio/npc-lubu-diaochan-bond.mp3",
        document.baseURI
      ).href;


    const lubuDiaochanBondSoundTemplate =
      new Audio(
        lubuDiaochanBondSoundUrl
      );


    lubuDiaochanBondSoundTemplate.preload =
      "auto";


    lubuDiaochanBondSoundTemplate.volume =
      1.0;


    function playLubuDiaochanBondSound() {

      const sound =
        lubuDiaochanBondSoundTemplate.cloneNode(
          true
        );


      sound.volume =
        1.0;


      sound.currentTime =
        0;


      sound.play().catch(
        error => {

          console.warn(
            "呂布 × 貂蟬羈絆音效播放失敗：",
            error
          );

        }
      );

    }



    /* ======================================================
       呂布 × 貂蟬短劇情配樂
       - audio/npc-lubu-diaochan-scene-bgm.mp3
       - 不循環，只服務 4.5 秒左右的彩蛋演出
       - 不受全站 BGM 開關影響
    ====================================================== */

    const lubuDiaochanSceneBgmUrl =
      new URL(
        "audio/npc-lubu-diaochan-scene-bgm.mp3",
        document.baseURI
      ).href;


    const lubuDiaochanSceneBgm =
      new Audio(
        lubuDiaochanSceneBgmUrl
      );


    lubuDiaochanSceneBgm.preload =
      "auto";


    lubuDiaochanSceneBgm.loop =
      false;


    lubuDiaochanSceneBgm.volume =
      0.46;


    let lubuSceneBgmFadeTimer =
      null;


    function startLubuDiaochanSceneBgm() {

      if (lubuSceneBgmFadeTimer) {

        clearInterval(
          lubuSceneBgmFadeTimer
        );

        lubuSceneBgmFadeTimer =
          null;

      }


      window.dispatchEvent(
        new CustomEvent(
          "sanguo:lubu-event-bgm-start"
        )
      );


      lubuDiaochanSceneBgm.pause();

      lubuDiaochanSceneBgm.currentTime =
        0;

      lubuDiaochanSceneBgm.volume =
        0.46;


      lubuDiaochanSceneBgm
        .play()
        .catch(
          error => {

            console.warn(
              "呂布 × 貂蟬劇情配樂播放失敗：",
              error
            );

          }
        );

    }


    function stopLubuDiaochanSceneBgm(
      fadeMs = 260
    ) {

      if (lubuSceneBgmFadeTimer) {

        clearInterval(
          lubuSceneBgmFadeTimer
        );

        lubuSceneBgmFadeTimer =
          null;

      }


      if (
        lubuDiaochanSceneBgm.paused
      ) {

        window.dispatchEvent(
          new CustomEvent(
            "sanguo:lubu-event-bgm-end"
          )
        );

        return;

      }


      const startVolume =
        lubuDiaochanSceneBgm.volume;

      const startedAt =
        performance.now();


      lubuSceneBgmFadeTimer =
        setInterval(
          () => {

            const progress =
              Math.min(
                1,
                (
                  performance.now()
                  -
                  startedAt
                )
                /
                Math.max(
                  1,
                  fadeMs
                )
              );


            lubuDiaochanSceneBgm.volume =
              startVolume
              *
              (
                1
                -
                progress
              );


            if (
              progress >= 1
            ) {

              clearInterval(
                lubuSceneBgmFadeTimer
              );

              lubuSceneBgmFadeTimer =
                null;


              lubuDiaochanSceneBgm.pause();

              lubuDiaochanSceneBgm.currentTime =
                0;

              lubuDiaochanSceneBgm.volume =
                0.46;


              window.dispatchEvent(
                new CustomEvent(
                  "sanguo:lubu-event-bgm-end"
                )
              );

            }

          },
          16
        );

    }


    /* F12 測試：testLubuDiaochanSceneBgm() */
    window.testLubuDiaochanSceneBgm =
      () => {

        startLubuDiaochanSceneBgm();

        setTimeout(
          () => {
            stopLubuDiaochanSceneBgm(260);
          },
          4600
        );

      };



    /* ======================================================
       沒有 NPC 的頁面
       直接停止 NPC 部分

       上面的故事 / Navbar / 招賢令
       不會受到影響
    ====================================================== */

    if (
      !npcBox ||
      !npcCharacter ||
      !npcSprite
    ) {

      return;

    }



    /* ======================================================
       防止 main.js 重複載入
    ====================================================== */

    if (
      npcBox.dataset.npcInitialized
      ===
      "true"
    ) {

      return;

    }


    npcBox.dataset.npcInitialized =
      "true";



    /* ======================================================
       貂蟬 Runner / 親吻畫面
    ====================================================== */

    let dcRunner =
      document.getElementById(
        "dcRunner"
      );


    let dcSprite =
      document.getElementById(
        "dcSprite"
      );


    let kissScene =
      document.getElementById(
        "kissScene"
      );


    let kissSprite =
      document.getElementById(
        "kissSprite"
      );



    /* =========================
       建立貂蟬 Runner
    ========================== */

    if (!dcRunner) {

      dcRunner =
        document.createElement(
          "div"
        );


      dcRunner.id =
        "dcRunner";


      dcRunner.className =
        "dc-runner";


      dcRunner.setAttribute(
        "aria-hidden",
        "true"
      );


      dcSprite =
        document.createElement(
          "span"
        );


      dcSprite.id =
        "dcSprite";


      dcSprite.className =
        "dc-sprite";


      dcRunner.appendChild(
        dcSprite
      );


      document.body.appendChild(
        dcRunner
      );

    }



    if (!dcSprite) {

      dcSprite =
        document.createElement(
          "span"
        );


      dcSprite.id =
        "dcSprite";


      dcSprite.className =
        "dc-sprite";


      dcRunner.appendChild(
        dcSprite
      );

    }



    /* =========================
       建立親吻畫面
    ========================== */

    if (!kissScene) {

      kissScene =
        document.createElement(
          "div"
        );


      kissScene.id =
        "kissScene";


      kissScene.className =
        "kiss-scene";


      kissScene.setAttribute(
        "aria-hidden",
        "true"
      );


      kissSprite =
        document.createElement(
          "span"
        );


      kissSprite.id =
        "kissSprite";


      kissSprite.className =
        "kiss-sprite";


      kissScene.appendChild(
        kissSprite
      );


      document.body.appendChild(
        kissScene
      );

    }



    if (!kissSprite) {

      kissSprite =
        document.createElement(
          "span"
        );


      kissSprite.id =
        "kissSprite";


      kissSprite.className =
        "kiss-sprite";


      kissScene.appendChild(
        kissSprite
      );

    }



    /* =========================
       圖片
    ========================== */

    dcSprite.style.backgroundImage =
      'url("images/npc-diaochan-run.png")';


    kissSprite.style.backgroundImage =
      'url("images/npc-lubu-diaochan-kiss.png")';



    /* ======================================================
       選 NPC

       盡量不要連續同一隻
    ====================================================== */

    const lastNpcId =
      sessionStorage.getItem(
        "lastNpc"
      );


    let availableNpcList =
      npcList.filter(
        npc =>
          npc.id !== lastNpcId
      );


    if (
      availableNpcList.length
      ===
      0
    ) {

      availableNpcList =
        npcList;

    }



    const currentNpc =
      availableNpcList[
        Math.floor(
          Math.random()
          *
          availableNpcList.length
        )
      ];



    sessionStorage.setItem(
      "lastNpc",
      currentNpc.id
    );



    /* ======================================================
       套用 NPC
    ====================================================== */

    npcBox.classList.remove(
      "npc-caocao",
      "npc-lubu",
      "talking",
      "eventing",
      "walk-left",
      "walk-right"
    );


    npcBox.classList.add(
      currentNpc.cssClass
    );


    npcSprite.style.backgroundImage =
      `url("${currentNpc.sprite}")`;


    if (npcName) {

      npcName.textContent =
        currentNpc.name;

    }


    npcCharacter.setAttribute(
      "aria-label",
      `與${currentNpc.name}互動`
    );


    if (npcAlert) {

      npcAlert.style.display =
        "flex";

    }


    dcRunner.classList.remove(
      "show",
      "running-left",
      "running-right"
    );


    kissScene.classList.remove(
      "show"
    );



    /* ======================================================
       NPC 走路
    ====================================================== */

    let npcOffset =
      0;


    let direction =
      -1;


    let isTalking =
      false;


    let isEventPlaying =
      false;


    const walkRange =
      currentNpc.walkRange
      ??
      100;


    const speed =
      currentNpc.moveSpeed
      ??
      0.32;



    function updateNpcDirection() {

      npcBox.classList.toggle(
        "walk-left",
        direction === -1
      );


      npcBox.classList.toggle(
        "walk-right",
        direction === 1
      );

    }



    function walkNpc() {

      if (
        !isTalking &&
        !isEventPlaying
      ) {

        npcOffset +=
          speed
          *
          direction;



        /* 左端 */

        if (
          npcOffset
          <=
          -walkRange
        ) {

          npcOffset =
            -walkRange;


          direction =
            1;


          updateNpcDirection();

        }



        /* 右端 */

        if (
          npcOffset
          >=
          0
        ) {

          npcOffset =
            0;


          direction =
            -1;


          updateNpcDirection();

        }


        npcBox.style.transform =
          `translateX(${npcOffset}px)`;

      }


      requestAnimationFrame(
        walkNpc
      );

    }


    updateNpcDirection();

    walkNpc();



    /* ======================================================
       等待工具
    ====================================================== */

    function wait(ms) {

      return new Promise(
        resolve =>
          setTimeout(
            resolve,
            ms
          )
      );

    }



    /* ======================================================
       移動貂蟬
    ====================================================== */

    function moveDiaochan(
      fromX,
      toX,
      duration
    ) {

      return new Promise(
        resolve => {


          const startTime =
            performance.now();



          function animate(
            currentTime
          ) {

            const progress =
              Math.min(
                (
                  currentTime
                  -
                  startTime
                )
                /
                duration,
                1
              );


            const currentX =
              fromX
              +
              (
                toX
                -
                fromX
              )
              *
              progress;


            dcRunner.style.left =
              `${currentX}px`;


            if (
              progress
              <
              1
            ) {

              requestAnimationFrame(
                animate
              );

            }

            else {

              resolve();

            }

          }


          requestAnimationFrame(
            animate
          );

        }
      );

    }



    /* ======================================================
       heroesData 工具
    ====================================================== */

    function getStoredHeroes() {

      try {

        const saved =
          JSON.parse(
            localStorage.getItem(
              "heroesData"
            )
            ||
            "[]"
          );


        return Array.isArray(saved)
          ?
          saved
          :
          [];

      }

      catch (error) {

        console.warn(
          "heroesData 讀取失敗：",
          error
        );


        return [];

      }

    }



    /* =========================
       檢查角色是否已解鎖
    ========================== */

    function isHeroUnlocked(
      heroName
    ) {

      return getStoredHeroes().some(
        hero =>
          hero.name === heroName
          &&
          hero.unlocked === true
      );

    }



    /* =========================
       解鎖指定角色
    ========================== */

    function unlockHeroByName(
      heroName
    ) {

      const heroes =
        getStoredHeroes();


      let changed =
        false;



      const updatedHeroes =
        heroes.map(
          hero => {


            if (
              hero.name === heroName
              &&
              hero.unlocked !== true
            ) {

              changed =
                true;


              return {

                ...hero,

                unlocked:
                  true

              };

            }


            return hero;

          }
        );



      if (changed) {

        localStorage.setItem(
          "heroesData",
          JSON.stringify(
            updatedHeroes
          )
        );

      }


      return changed;

    }



    /* ======================================================
       飛將現世：呂布第一次解鎖專屬音效
       檔案：audio/lubu-unlock.mp3
    ====================================================== */

    const lubuUnlockSoundUrl =
      new URL(
        "audio/lubu-unlock.mp3",
        document.baseURI
      ).href;


    const lubuUnlockSoundTemplate =
      new Audio(
        lubuUnlockSoundUrl
      );


    lubuUnlockSoundTemplate.preload =
      "auto";


    lubuUnlockSoundTemplate.volume =
      1.0;


    lubuUnlockSoundTemplate.addEventListener(
      "error",
      () => {

        console.warn(
          "飛將現世音效載入失敗，請確認檔案存在：",
          lubuUnlockSoundUrl
        );

      }
    );


    function playLubuUnlockSound() {

      const sound =
        lubuUnlockSoundTemplate.cloneNode(
          true
        );


      sound.volume =
        1.0;


      sound.currentTime =
        0;


      sound.play().catch(
        error => {

          console.warn(
            "飛將現世音效播放失敗：",
            error
          );

        }
      );

    }


    /* F12 Console 可直接輸入 testLubuUnlockSound() 測試 */
    window.testLubuUnlockSound =
      playLubuUnlockSound;



    /* ======================================================
       呂布解鎖提示視窗

       只在第一次成功解鎖時出現
    ====================================================== */

    function showLubuUnlockNotice() {


      const oldNotice =
        document.getElementById(
          "lubuUnlockNotice"
        );


      if (oldNotice) {

        oldNotice.remove();

      }



      /* =========================
         黑色遮罩
      ========================== */

      const overlay =
        document.createElement(
          "div"
        );


      overlay.id =
        "lubuUnlockNotice";


      Object.assign(
        overlay.style,
        {

          position:
            "fixed",

          inset:
            "0",

          background:
            "rgba(0,0,0,.72)",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          zIndex:
            "99999",

          opacity:
            "0",

          transition:
            "opacity .3s ease"

        }
      );



      /* =========================
         視窗本體
      ========================== */

      const box =
        document.createElement(
          "div"
        );


      Object.assign(
        box.style,
        {

          width:
            "min(420px,88vw)",

          padding:
            "32px 28px 26px",

          textAlign:
            "center",

          background:
            "linear-gradient(145deg,#251811,#100b08)",

          border:
            "1px solid #d2a451",

          borderRadius:
            "10px",

          boxShadow:
            "0 18px 50px rgba(0,0,0,.65), 0 0 28px rgba(212,175,55,.18), inset 0 0 20px rgba(212,175,55,.05)",

          transform:
            "translateY(16px) scale(.96)",

          transition:
            "transform .35s ease",

          fontFamily:
            "'Noto Serif TC',serif"

        }
      );



      box.innerHTML = `

        <div
          style="
            color:#d4af37;
            font-size:15px;
            letter-spacing:6px;
            margin-bottom:8px;
          "
        >
          ◇ 隱 藏 彩 蛋 ◇
        </div>


        <h2
          style="
            margin:0 0 15px;
            color:#ffe6a6;
            font-size:30px;
            letter-spacing:7px;
            font-weight:900;
          "
        >
          飛 將 現 世
        </h2>


        <div
          style="
            width:70px;
            height:1px;
            margin:0 auto 18px;
            background:#b98a42;
          "
        ></div>


        <p
          style="
            margin:0;
            color:#eadcc4;
            font-size:16px;
            line-height:1.9;
            letter-spacing:1px;
          "
        >
          你發現了貂蟬與呂布之間的隱藏羈絆。

          <br>

          <strong
            style="
              color:#ffd477;
              font-weight:700;
            "
          >
            呂布已加入人物圖鑑！
          </strong>
        </p>


        <button
          type="button"
          id="lubuUnlockConfirm"

          style="
            margin-top:24px;
            min-width:130px;
            padding:11px 24px;

            border:
              1px solid #c89a4b;

            border-radius:
              5px;

            background:
              linear-gradient(
                135deg,
                #76502b,
                #3b2516
              );

            color:
              #fff1c8;

            font-family:
              'Noto Serif TC',
              serif;

            font-size:
              15px;

            font-weight:
              700;

            letter-spacing:
              4px;

            cursor:
              pointer;
          "
        >
          收 入 圖 鑑
        </button>

      `;



      overlay.appendChild(
        box
      );


      document.body.appendChild(
        overlay
      );



      /* =========================
         淡入
      ========================== */

      requestAnimationFrame(
        () => {


          overlay.style.opacity =
            "1";


          box.style.transform =
            "translateY(0) scale(1)";


        }
      );



      let closing =
        false;



      /* =========================
         關閉
      ========================== */

      function closeNotice() {


        if (closing) {

          return;

        }


        closing =
          true;


        overlay.style.opacity =
          "0";


        box.style.transform =
          "translateY(10px) scale(.97)";


        setTimeout(
          () => {


            overlay.remove();


          },
          300
        );

      }



      const confirmBtn =
        box.querySelector(
          "#lubuUnlockConfirm"
        );


      if (confirmBtn) {

        confirmBtn.addEventListener(
          "click",
          closeNotice
        );

      }



      /* 點黑色背景也可以關 */

      overlay.addEventListener(
        "click",
        event => {


          if (
            event.target
            ===
            overlay
          ) {

            closeNotice();

          }


        }
      );

    }



    /* ======================================================
       呂布尋妻台詞
    ====================================================== */

    const lubuSearchingLines = [

      "「我的貂蟬……究竟在何處？」",

      "「蟬兒，妳可曾來過此地？」",

      "「天下雖大，為何尋不到蟬兒……」",

      "「若有人見過貂蟬，速來告知本將！」",

      "「赤兔可日行千里，卻仍尋不到蟬兒……」",

      "「貂蟬……妳到底在哪裡？」",

      "「縱有方天畫戟，也斬不斷這相思。」",

      "「本將不要天下，只想知道蟬兒在哪。」"

    ];



    let lubuSearchTimer =
      null;


    let lubuSearchCloseTimer =
      null;


    let lastLubuSearchIndex =
      -1;



    /* ======================================================
       清除尋妻計時器
    ====================================================== */

    function clearLubuSearchTimers() {


      if (lubuSearchTimer) {

        clearTimeout(
          lubuSearchTimer
        );

      }


      if (lubuSearchCloseTimer) {

        clearTimeout(
          lubuSearchCloseTimer
        );

      }


      lubuSearchTimer =
        null;


      lubuSearchCloseTimer =
        null;

    }



    /* ======================================================
       隨機取得下一句
       避免連續兩句一樣
    ====================================================== */

    function getNextLubuSearchingLine() {


      let nextIndex;


      do {

        nextIndex =
          Math.floor(
            Math.random()
            *
            lubuSearchingLines.length
          );

      }

      while (
        lubuSearchingLines.length
        >
        1
        &&
        nextIndex
        ===
        lastLubuSearchIndex
      );


      lastLubuSearchIndex =
        nextIndex;


      return lubuSearchingLines[
        nextIndex
      ];

    }



    /* ======================================================
       關閉呂布尋妻對話
    ====================================================== */

    function closeLubuSearchDialogue() {


      if (
        currentNpc.id
        !==
        "lubu"
      ) {

        return;

      }


      isTalking =
        false;


      npcBox.classList.remove(
        "talking"
      );


      npcSprite.style.animationPlayState =
        "running";


      if (npcDialogue) {

        npcDialogue.classList.remove(
          "show"
        );

      }


      if (
        npcAlert
        &&
        !isEventPlaying
      ) {

        npcAlert.style.display =
          "flex";

      }

    }



    /* ======================================================
       安排下一次尋妻
    ====================================================== */

    function scheduleLubuSearchDialogue(
      delay = null
    ) {


      if (lubuSearchTimer) {

        clearTimeout(
          lubuSearchTimer
        );

      }


      lubuSearchTimer =
        null;



      /*
         已經抽到貂蟬
         → 永遠不再主動尋妻
      */

      if (
        currentNpc.id !== "lubu"
        ||
        isHeroUnlocked(
          "貂蟬"
        )
      ) {

        return;

      }



      const nextDelay =
        delay
        ??
        (
          6500
          +
          Math.random()
          *
          6500
        );



      lubuSearchTimer =
        setTimeout(
          () => {


            lubuSearchTimer =
              null;


            /*
               計時期間如果剛抽到貂蟬，
               這一句也不要再講。
            */

            if (
              !isHeroUnlocked(
                "貂蟬"
              )
            ) {

              showLubuSearchDialogue(
                true
              );

            }


          },
          nextDelay
        );

    }



    /* ======================================================
       顯示呂布尋妻對話
    ====================================================== */

    function showLubuSearchDialogue(
      autoClose = true
    ) {


      if (
        currentNpc.id !== "lubu"
        ||
        isEventPlaying
        ||
        isHeroUnlocked(
          "貂蟬"
        )
        ||
        !npcDialogue
        ||
        !npcDialogueText
      ) {

        return;

      }



      clearLubuSearchTimers();


      isTalking =
        true;


      npcBox.classList.add(
        "talking"
      );


      npcSprite.style.animationPlayState =
        "paused";


      if (npcName) {

        npcName.textContent =
          "呂布";

      }


      npcDialogueText.textContent =
        getNextLubuSearchingLine();


      npcDialogue.classList.add(
        "show"
      );


      if (npcAlert) {

        npcAlert.style.display =
          "none";

      }



      /*
         玩家完全不操作
         → 2.6 秒後自己關閉
      */

      if (autoClose) {


        lubuSearchCloseTimer =
          setTimeout(
            () => {


              lubuSearchCloseTimer =
                null;


              closeLubuSearchDialogue();


              scheduleLubuSearchDialogue();


            },
            2600
          );

      }

    }



    /* ======================================================
       呂布第一次自動尋妻

       進頁面後約 3.2 ～ 5.4 秒
    ====================================================== */

    if (
      currentNpc.id
      ===
      "lubu"
      &&
      !isHeroUnlocked(
        "貂蟬"
      )
    ) {


      scheduleLubuSearchDialogue(
        3200
        +
        Math.random()
        *
        2200
      );

    }



    /* ======================================================
       呂布 × 貂蟬 彩蛋
    ====================================================== */

    async function playLubuEvent() {


      if (isEventPlaying) {

        return;

      }



      /* =========================
         還沒有貂蟬

         不准進親吻事件
      ========================== */

      if (
        !isHeroUnlocked(
          "貂蟬"
        )
      ) {


        showLubuSearchDialogue(
          true
        );


        return;

      }



      /* =========================
         檢查動畫元素
      ========================== */

      if (
        !dcRunner
        ||
        !kissScene
      ) {


        console.warn(
          "找不到貂蟬或親吻場景"
        );


        return;

      }



      clearLubuSearchTimers();


      closeLubuSearchDialogue();



      /*
         記住事件開始前
         呂布是不是已經解鎖。

         false：
         第一次彩蛋

         true：
         之後只是重播
      */

      const lubuWasUnlocked =
        isHeroUnlocked(
          "呂布"
        );



      /* =========================
         正式開始
      ========================== */

      isEventPlaying =
        true;


      startLubuDiaochanSceneBgm();


      isTalking =
        false;


      npcBox.classList.remove(
        "talking"
      );


      npcBox.classList.add(
        "eventing"
      );


      npcSprite.style.animationPlayState =
        "running";


      if (npcAlert) {

        npcAlert.style.display =
          "none";

      }


      if (npcDialogue) {

        npcDialogue.classList.remove(
          "show"
        );

      }



      /* =========================
         呂布目前位置
      ========================== */

      const lubuRect =
        npcCharacter
          .getBoundingClientRect();



      /* =========================
         貂蟬從螢幕右側開始
      ========================== */

      const startX =
        window.innerWidth
        +
        80;


      const targetX =
        lubuRect.left
        +
        25;



      /* =========================
         貂蟬出現
      ========================== */

      dcRunner.classList.add(
        "show",
        "running-left"
      );


      dcRunner.classList.remove(
        "running-right"
      );


      dcRunner.style.left =
        `${startX}px`;



      /* =========================
         貂蟬跑向呂布
      ========================== */

      playDiaochanRunSound();

      await moveDiaochan(
        startX,
        targetX,
        900
      );



      /* =========================
         到達呂布旁
      ========================== */

      dcRunner.classList.remove(
        "show"
      );


      await wait(
        100
      );



      /* =========================
         呂布暫時隱藏
      ========================== */

      npcCharacter.style.visibility =
        "hidden";



      /* =========================
         親吻圖位置
      ========================== */

      const kissWidth =
        kissScene.offsetWidth
        ||
        150;


      let kissLeft =
        lubuRect.left
        -
        kissWidth
        *
        0.34;



      /* 防止超出畫面 */

      kissLeft =
        Math.max(
          8,
          Math.min(
            kissLeft,
            window.innerWidth
            -
            kissWidth
            -
            8
          )
        );


      kissScene.style.left =
        `${kissLeft}px`;


      kissScene.style.right =
        "auto";



      /* =========================
         親吻
      ========================== */

      kissScene.classList.add(
        "show"
      );


      playLubuDiaochanBondSound();


      await wait(
        1000
      );



      /* =========================
         呂布台詞
      ========================== */

      if (
        npcDialogue
        &&
        npcDialogueText
        &&
        npcName
      ) {


        npcName.textContent =
          "呂布";


        npcDialogueText.textContent =
          "「蟬兒……此生有妳，足矣。」";


        npcDialogue.classList.add(
          "show"
        );


        playNpcDialogueOpenSound();


        await wait(
          1500
        );


        npcDialogue.classList.remove(
          "show"
        );

      }



      /* =========================
         親吻畫面消失
      ========================== */

      kissScene.classList.remove(
        "show"
      );


      await wait(
        100
      );



      /* =========================
         呂布重新出現
      ========================== */

      npcCharacter.style.visibility =
        "visible";



      /* =========================
         貂蟬離開
      ========================== */

      dcRunner.classList.add(
        "show",
        "running-right"
      );


      dcRunner.classList.remove(
        "running-left"
      );


      dcRunner.style.left =
        `${targetX}px`;


      const exitX =
        window.innerWidth
        +
        100;


      playDiaochanRunSound();


      await moveDiaochan(
        targetX,
        exitX,
        900
      );


      dcRunner.classList.remove(
        "show",
        "running-right"
      );



      /* =========================
         呂布恢復正常
      ========================== */

      npcBox.classList.remove(
        "eventing"
      );


      isEventPlaying =
        false;


      /*
        貂蟬離開後收掉劇情配樂。
        第一次解鎖時，後面的「飛將現世」音效會單獨接上。
      */
      stopLubuDiaochanSceneBgm(
        240
      );


      if (npcAlert) {

        npcAlert.style.display =
          "flex";

      }



      /* ====================================================
         第一次完整完成親吻彩蛋

         現在才正式解鎖呂布

         並顯示：
         「飛將現世」
      ==================================================== */

      if (!lubuWasUnlocked) {


        const lubuJustUnlocked =
          unlockHeroByName(
            "呂布"
          );


        if (lubuJustUnlocked) {

          playLubuUnlockSound();

          showLubuUnlockNotice();

        }

      }

    }



    /* ======================================================
       曹操對話
    ====================================================== */

    let dialogueIndex =
      0;



    function openDialogue() {


      if (
        currentNpc.type
        !==
        "dialogue"
        ||
        !npcDialogue
        ||
        !npcDialogueText
      ) {

        return;

      }


      isTalking =
        true;


      npcBox.classList.add(
        "talking"
      );


      npcDialogue.classList.add(
        "show"
      );


      if (npcAlert) {

        npcAlert.style.display =
          "none";

      }


      npcDialogueText.textContent =
        currentNpc.lines[
          dialogueIndex
        ];

    }



    function nextDialogue() {


      if (
        currentNpc.type
        !==
        "dialogue"
        ||
        !npcDialogueText
        ||
        !currentNpc.lines.length
      ) {

        return;

      }


      dialogueIndex =
        (
          dialogueIndex
          +
          1
        )
        %
        currentNpc.lines.length;


      npcDialogueText.textContent =
        currentNpc.lines[
          dialogueIndex
        ];

    }



    function closeDialogue() {


      if (
        currentNpc.type
        !==
        "dialogue"
      ) {

        return;

      }


      isTalking =
        false;


      npcBox.classList.remove(
        "talking"
      );


      if (npcDialogue) {

        npcDialogue.classList.remove(
          "show"
        );

      }


      if (npcAlert) {

        npcAlert.style.display =
          "flex";

      }

    }



    /* ======================================================
       點 NPC
    ====================================================== */

    npcCharacter.addEventListener(
      "click",
      event => {


        /*
           不讓 NPC 點擊
           傳到 document
        */

        event.stopPropagation();


        /*
           招賢台過場／抽卡結果開啟時，
           不讓右下角 NPC 插入對話或呂布彩蛋，
           避免專屬音效 / BGM 與抽卡演出互相疊加。
        */
        if (
          document.body.classList.contains(
            "gacha-intro-body-lock"
          )
          ||
          document.body.classList.contains(
            "gacha-result-open"
          )
        ) {
          return;
        }


        if (isEventPlaying) {

          return;

        }



        /* =========================
           呂布
        ========================== */

        if (
          currentNpc.id
          ===
          "lubu"
        ) {


          /*
             還沒抽到貂蟬

             → 只能講找貂蟬的話
          */

          if (
            !isHeroUnlocked(
              "貂蟬"
            )
          ) {


            if (!isTalking) {

              playNpcDialogueOpenSound();

            }


            showLubuSearchDialogue(
              true
            );


            return;

          }



          /*
             已經抽到貂蟬

             → 玩家自己點到呂布
             → 才觸發彩蛋
          */

          playLubuEvent();


          return;

        }



        /* =========================
           曹操
        ========================== */

        if (!isTalking) {

          playNpcDialogueOpenSound();

          openDialogue();

        }

        else {

          nextDialogue();

        }

      }
    );



    /* ======================================================
       點 NPC 對話框

       曹操：
       → 下一句

       呂布未取得貂蟬：
       → 下一句尋妻台詞
       → 重新倒數 2.6 秒
    ====================================================== */

    if (npcDialogue) {


      npcDialogue.addEventListener(
        "click",
        event => {


          event.stopPropagation();



          if (isEventPlaying) {

            return;

          }



          /* =========================
             呂布尋妻
          ========================== */

          if (
            currentNpc.id
            ===
            "lubu"
            &&
            !isHeroUnlocked(
              "貂蟬"
            )
          ) {


            showLubuSearchDialogue(
              true
            );


            return;

          }



          /* =========================
             曹操
          ========================== */

          if (
            currentNpc.type
            ===
            "dialogue"
          ) {

            nextDialogue();

          }

        }
      );

    }



    /* ======================================================
       點畫面其他地方

       曹操：
       → 關閉對話

       呂布未有貂蟬：
       → 尋妻對話立即關閉
       → 繼續走
       → 再安排下一次

       親吻事件播放中：
       → 不受影響
    ====================================================== */

    document.addEventListener(
      "click",
      () => {


        if (isEventPlaying) {

          return;

        }



        /* =========================
           呂布尋妻對話
        ========================== */

        if (
          currentNpc.id
          ===
          "lubu"
          &&
          isTalking
          &&
          !isHeroUnlocked(
            "貂蟬"
          )
        ) {


          clearLubuSearchTimers();


          closeLubuSearchDialogue();


          scheduleLubuSearchDialogue();


          return;

        }



        /* =========================
           曹操
        ========================== */

        if (
          currentNpc.type
          ===
          "dialogue"
          &&
          isTalking
        ) {


          closeDialogue();

        }

      }
    );



    /* ======================================================
       離開頁面
       清除呂布計時器
    ====================================================== */

    window.addEventListener(
      "beforeunload",
      clearLubuSearchTimers
    );


  }
);