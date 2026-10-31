"use strict";
/* ══════════════ 語言 ══════════════ */
// 語言檔在 lang/*.js，載入時註冊到 window.TSUNAMI_LANGS
const STR = {};
for(const [k, make] of Object.entries(window.TSUNAMI_LANGS))
  STR[k] = make({ SUPER, WAVES, BASE_INCOME, MAX_TRUCKS, LOSE_DEPTH });

const LANG_KEY = 'tsunami.lang';
function savedLang(){
  try { const v = localStorage.getItem(LANG_KEY); return STR[v] ? v : null; } catch(e){ return null; }
}
let LANG = savedLang() || 'zh-Hant';
function L(){ return STR[LANG]; }
function bname(id){ return L().names[id]; }
function applyLang(lang){
  LANG = lang;
  document.documentElement.lang = lang;
  document.title = L().title;
  buildUI();
  updateUI();
}
// 玩家選擇語言時才記住
function setLang(lang){
  try { localStorage.setItem(LANG_KEY, lang); } catch(e){}
  applyLang(lang);
}
