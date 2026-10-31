"use strict";
/* ══════════════ 提示 ══════════════ */
let toastTimer = null;
function toast(msg, warn){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.borderColor = warn ? '#ff6b6b' : '#5fd4ff';
  el.style.background = warn ? 'rgba(150,30,30,.92)' : 'rgba(20,60,90,.92)';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 1500);
}
