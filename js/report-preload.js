/* =========================================================
   參國｜專題展示效能預載器
   ---------------------------------------------------------
   - 不播放音效、不改動畫、不改抽卡/問答/NPC 邏輯。
   - 首頁優先正常顯示；之後利用空閒時間分批把下一頁素材放入 HTTP cache。
   - 同時最多 2 個背景請求，避免搶走目前頁面的頻寬。
   - Data Saver / 2G / 3G 自動停止大量圖片預載。
========================================================= */
(() => {
  'use strict';

  if (window.__SANGUO_REPORT_PRELOAD__) return;
  window.__SANGUO_REPORT_PRELOAD__ = true;

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const effectiveType = connection?.effectiveType || '';
  const conservativeNetwork = !!(
    connection && (
      connection.saveData ||
      effectiveType === 'slow-2g' ||
      effectiveType === '2g' ||
      effectiveType === '3g'
    )
  );

  const seen = new Set();
  const queue = [];
  let active = 0;
  const MAX_CONCURRENT = 2;

  function absoluteUrl(path) {
    try { return new URL(path, document.baseURI).href; }
    catch (_) { return null; }
  }

  function enqueue(paths, { priority = false } = {}) {
    for (const path of paths) {
      const url = absoluteUrl(path);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      priority ? queue.unshift(url) : queue.push(url);
    }
    pump();
  }

  function pump() {
    while (active < MAX_CONCURRENT && queue.length) {
      const url = queue.shift();
      active++;
      fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'force-cache'
      })
        .catch(() => {})
        .finally(() => {
          active--;
          pump();
        });
    }
  }

  function whenIdle(callback, delay = 0) {
    window.setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 1800 });
      } else {
        callback();
      }
    }, delay);
  }

  const QUIZ_ENTRY_CORE = [
    'QuizEntry.html',
    'css/QuizEntry.css',
    'images/quiz1.png',
    'images/quizentry.png'
  ];

  const QUIZ_CORE = [
    'QuizPage.html',
    'css/QuizPage.css',
    'images/quiz-paper-bg.png',
    'audio/quiz-bgm.mp3',
    'audio/quiz-correct.mp3',
    'audio/quiz-wrong.mp3',
    'audio/quiz-token-reward.mp3'
  ];

  const GACHA_PAGE_CORE = [
    'Pickcard.html',
    'css/Pickcard.css',
    'css/GachaIntro.css',
    'images/招賢台背景.png',
    'audio/card-flip.mp3',
    'audio/ssr-reveal.mp3',
    'audio/gacha-card-drop.mp3',
    'audio/gacha-single-charge.mp3',
    'audio/gacha-intro-page.mp3',
    'audio/gacha-intro-glow.mp3',
    'audio/gacha-intro-eye.mp3',
    'audio/gacha-intro-rumble.mp3',
    'audio/gacha-intro-burst.mp3',
    'audio/gacha-intro-flash.mp3',
    'audio/gacha-ten-bgm.mp3'
  ];

  const GACHA_COMIC_CORE = [
    'images/gacha-comic/01.webp',
    'images/gacha-comic/02.webp',
    'images/gacha-comic/03.webp',
    'images/gacha-comic/04.webp',
    'images/gacha-comic/05.webp'
  ];

  const GACHA_SINGLE_TEASERS = [
    'images/gacha-comic/05-liubei.webp',
    'images/gacha-comic/05-zhangfei.webp',
    'images/gacha-comic/05-sunquan.webp',
    'images/gacha-comic/05-guanyu.webp',
    'images/gacha-comic/05-simayi.webp',
    'images/gacha-comic/05-zhouyu.webp',
    'images/gacha-comic/05-zhaoyun.webp',
    'images/gacha-comic/05-zhugeliang.webp',
    'images/gacha-comic/05-huanggai.webp',
    'images/gacha-comic/05-pangtong.webp',
    'images/gacha-comic/05-guojia.webp',
    'images/gacha-comic/05-sunce.webp',
    'images/gacha-comic/05-xiahoudun.webp',
    'images/gacha-comic/05-zhenji.webp',
    'images/gacha-comic/05-caiwenji.webp',
    'images/gacha-comic/05-sunshangxiang.webp',
    'images/gacha-comic/05-guanyinping.webp',
    'images/gacha-comic/05-daqiaoxiaoqiao.webp',
    'images/gacha-comic/05-diaochan.webp'
  ];

  const CODEX_CORE = [
    'Card.html',
    'css/Card.css',
    'images/card-bg.png',
    'images/未解鎖.png',
    'images/specialcard.png'
  ];

  function unlockedHeroImages(limit = 8) {
    try {
      const heroes = JSON.parse(localStorage.getItem('heroesData') || '[]');
      if (!Array.isArray(heroes)) return [];
      return heroes
        .filter(hero => hero && hero.unlocked && typeof hero.image === 'string')
        .slice(0, limit)
        .map(hero => hero.image);
    } catch (_) {
      return [];
    }
  }

  function decodeExistingGachaFrames() {
    if (conservativeNetwork) return;
    const images = [...document.querySelectorAll('#gachaIntro img')];
    images.forEach(img => {
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    });
  }

  function prioritizeNavigation(event) {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;

    let file = '';
    try { file = new URL(link.href, document.baseURI).pathname.split('/').pop().toLowerCase(); }
    catch (_) { return; }

    if (file === 'quizentry.html') {
      enqueue(QUIZ_ENTRY_CORE, { priority: true });
    } else if (file === 'quizpage.html') {
      enqueue(QUIZ_CORE, { priority: true });
    } else if (file === 'pickcard.html') {
      enqueue(GACHA_PAGE_CORE, { priority: true });
      if (!conservativeNetwork) enqueue(GACHA_COMIC_CORE, { priority: true });
    } else if (file === 'card.html') {
      enqueue(CODEX_CORE, { priority: true });
      enqueue(unlockedHeroImages(6), { priority: true });
    }
  }

  document.addEventListener('pointerover', prioritizeNavigation, { passive: true });
  document.addEventListener('focusin', prioritizeNavigation);

  function startPagePlan() {
    const path = location.pathname.toLowerCase();
    const isHome = document.body.classList.contains('home-page') || path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/homepage.html');
    const isQuizEntry = path.endsWith('/quizentry.html');
    const isQuiz = path.endsWith('/quizpage.html');
    const isPickcard = path.endsWith('/pickcard.html');
    const isCard = path.endsWith('/card.html');

    if (isHome) {
      whenIdle(() => enqueue(['QuizEntry.html', 'Card.html', 'Pickcard.html']), 900);
      whenIdle(() => enqueue(QUIZ_ENTRY_CORE), 2300);
      return;
    }

    if (isQuizEntry) {
      whenIdle(() => enqueue(QUIZ_CORE), 700);
      return;
    }

    if (isQuiz) {
      // 玩家答 11 題的時間足夠讓招賢台在背景準備好。
      whenIdle(() => enqueue(GACHA_PAGE_CORE), 1200);
      whenIdle(() => {
        if (!conservativeNetwork) enqueue(GACHA_COMIC_CORE);
      }, 2600);
      whenIdle(() => enqueue(CODEX_CORE), 5200);
      whenIdle(() => enqueue(unlockedHeroImages(6)), 7200);
      // 高速網路才慢慢把單抽角色特寫放入 cache；總量約 12 MB（WebP 版）。
      whenIdle(() => {
        if (!conservativeNetwork) enqueue(GACHA_SINGLE_TEASERS);
      }, 9000);
      return;
    }

    if (isPickcard) {
      whenIdle(decodeExistingGachaFrames, 500);
      whenIdle(() => enqueue(CODEX_CORE), 1600);
      whenIdle(() => enqueue(unlockedHeroImages(8)), 2600);
      whenIdle(() => {
        if (!conservativeNetwork) enqueue(GACHA_SINGLE_TEASERS);
      }, 3200);
      return;
    }

    if (isCard) {
      whenIdle(() => enqueue(['Pickcard.html', 'css/Pickcard.css']), 1600);
    }
  }

  if (document.readyState === 'complete') {
    startPagePlan();
  } else {
    window.addEventListener('load', startPagePlan, { once: true });
  }
})();
