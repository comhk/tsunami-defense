"use strict";
/* ══════════════ 縮放 ══════════════ */
function fit(){
  const s = Math.min(window.innerWidth / 980, window.innerHeight / 540);
  app.style.transform = `scale(${Math.min(s, 1.3)})`;
}
window.addEventListener('resize', fit);

/* ══════════════ 主迴圈 ══════════════ */
let lastT = performance.now();
function loop(now){
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  if(!G.paused) update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ══════════════ 啟動 ══════════════ */
renderGround();
init();
applyLang(LANG);
fit();
showMenu();

requestAnimationFrame(t => { lastT = t; loop(t); });

// 只在測試旗標下公開測試介面：狀態與函式（G、update…）加上 setSeed／place 兩個會改變遊戲的入口
if(TEST) window.__tsunami = Object.freeze({ G, update, startGame, WAVES, HOME, COLS, ROWS, LOSE_DEPTH, pulseIndexAt, nextPulseIndex,
  BAY_PEAK, BAY_FLOOR, BUOY_COST, LEVEL_LOW, LEVEL_HIGH, REVISE_AT,
  forecast, markerTip, hoverTip,
  setSeed: s => { nextSeed = s; },          // 在 startGame 前呼叫
  rowProfile: w => G.bays[w].slice(),       // 第 w 波（0 起）的每列倍率副本
  place: (defId, gx, gy) => placeEntity(defId, gx, gy) });  // 照一般規則建造
