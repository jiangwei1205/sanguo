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
   Mobile Navbar
   只控制 <= 1000px 的漢堡選單
====================================== */

const mobileMenuBtn =
  document.querySelector(
    ".mobile-menu-btn"
  );


const mobileNavMenu =
  document.querySelector(
    ".nav-menu"
  );


function closeMobileNav() {

  if (
    !mobileMenuBtn ||
    !mobileNavMenu
  ) {
    return;
  }


  mobileNavMenu.classList.remove(
    "mobile-open"
  );


  mobileMenuBtn.classList.remove(
    "mobile-open"
  );


  mobileMenuBtn.setAttribute(
    "aria-expanded",
    "false"
  );


  mobileMenuBtn.setAttribute(
    "aria-label",
    "開啟選單"
  );


  mobileMenuBtn.textContent =
    "☰";

}


if (
  mobileMenuBtn &&
  mobileNavMenu
) {

  mobileMenuBtn.addEventListener(
    "click",
    () => {

      const willOpen =
        !mobileNavMenu.classList.contains(
          "mobile-open"
        );


      mobileNavMenu.classList.toggle(
        "mobile-open",
        willOpen
      );


      mobileMenuBtn.classList.toggle(
        "mobile-open",
        willOpen
      );


      mobileMenuBtn.setAttribute(
        "aria-expanded",
        String(willOpen)
      );


      mobileMenuBtn.setAttribute(
        "aria-label",
        willOpen
          ? "關閉選單"
          : "開啟選單"
      );


      mobileMenuBtn.textContent =
        willOpen
          ? "×"
          : "☰";

    }
  );


  /*
    點任何導覽連結後收起：
    - 首頁錨點仍照原本 smooth scroll
    - Quiz / Card / Pickcard 仍照原本 href 跳頁
  */
  mobileNavMenu.addEventListener(
    "click",
    event => {

      const link =
        event.target.closest("a");


      if (
        link &&
        window.innerWidth <= 1000
      ) {

        closeMobileNav();

      }

    }
  );


  /*
    點選單外面時收起。
    不 stopPropagation，
    避免影響原本 NPC / 其他 document click 功能。
  */
  document.addEventListener(
    "click",
    event => {

      if (
        window.innerWidth > 1000
        ||
        !mobileNavMenu.classList.contains(
          "mobile-open"
        )
      ) {
        return;
      }


      if (
        mobileNavMenu.contains(
          event.target
        )
        ||
        mobileMenuBtn.contains(
          event.target
        )
      ) {
        return;
      }


      closeMobileNav();

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
        &&
        mobileNavMenu.classList.contains(
          "mobile-open"
        )
      ) {

        closeMobileNav();

        mobileMenuBtn.focus();

      }

    }
  );


  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth > 1000
      ) {

        closeMobileNav();

      }

    }
  );

}


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