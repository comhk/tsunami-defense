"use strict";
/* ══════════════ 開始畫面 ══════════════ */
function showMenu(){
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  ov.innerHTML = `<h1>${L().menuH1}</h1><h2>${L().menuH2}</h2><p>${L().menuP()}</p>
    <button id="startBtn">${L().start}</button>
    <div id="langLink">${L().changeLang}</div>`;
  document.getElementById('startBtn').onclick = () => savedLang() ? startGame() : showLangPicker();
  document.getElementById('langLink').onclick = showLangPicker;
}

// 第一次開始遊戲時詢問語言；之後記住選擇
function showLangPicker(){
  const ov = document.getElementById('overlay');
  ov.innerHTML = `<h2>${L().pickLang}</h2>
    <div class="langs">${Object.entries(STR).map(([k, s]) =>
      `<button class="langBtn" data-lang="${k}">${s.langName}</button>`).join('')}</div>`;
  ov.querySelectorAll('.langBtn').forEach(b => {
    b.onclick = () => { setLang(b.dataset.lang); showMenu(); };
  });
}
