"use strict";
/* ══════════════ 遊戲流程 ══════════════ */
let nextSeed = null;  // 測試用：下一局的種子
function startGame(){
  init();
  G.phase = 'prep';
  G.wave = 0;
  togglePause(false);
  // 本局種子：測試可先以 setSeed 指定，否則隨機
  G.seed = nextSeed != null ? nextSeed : Math.floor(Math.random() * 4294967296);
  nextSeed = null;
  G.bays = rollBays(G.seed);
  G.earlyForecast = rollEarly(G.seed, G.bays);
  G.revised = false; G.reviseFlash = 0; G.raisedRows = [];
  G.materials = START_MATS;
  G.timer = WAVES[0].prep;
  G.incomeAcc = 0; G.boxTimer = 0;
  G.shake = 0;
  G.selectedBuild = null; G.selectedSkill = null;
  G.techUnlocked = false; G.superUnlocked = false;
  G.superCD = 0; G.superAim = false;
  document.getElementById('overlay').classList.add('hidden');
  updateUI();
}

function startWave(){
  const w = WAVES[G.wave];
  G.phase = 'tsunami';
  G.waveProgress = 0;
  G.waveSpeed = w.speed;
  G.inflowEnd = inflowEndOf(w);
  G.pulseIdx = pulseIndexAt(w, 0); G.warnedIdx = 0;  // 每波重設；進度 0 時第一道湧浪已在注水
  G.boxes.length = 0;
  G.shake = 8;
  toast(L().tWaveIncoming(G.wave+1), true);
  updateUI();
}

function endGame(win){
  G.phase = win ? 'win' : 'lose';
  const ov = document.getElementById('overlay');
  ov.classList.remove('hidden');
  ov.innerHTML = win
    ? `<h1>${L().winH1}</h1><h2 style="color:#5fd4ff">${L().winH2}</h2>
       <p>${L().winP(Math.floor(G.materials))}</p>
       <button id="startBtn">${L().again}</button>`
    : `<h1 style="background:linear-gradient(180deg,#ff9a9a,#a01515);
        -webkit-background-clip:text;background-clip:text">${L().loseH1}</h1>
       <h2 style="color:#ff6b6b">${L().loseH2}</h2>
       <p>${L().loseP(G.wave+1)}</p>
       <button id="startBtn">${L().retry}</button>`;
  document.getElementById('startBtn').onclick = () => { startGame(); };
}

// 第一道之後的每道湧浪：到達前約 SURGE_WARN 秒（實際時間）出警告提示，到達時震動畫面。
// 警告只在間隔中出現（上一道湧浪仍在注水時延到間隔開始），每道只出一次；
// 提示的秒數按實際出警告時剩餘的時間計算，與 HUD 倒數一致。
function surgeCues(w, p0, p1){
  for(let k = 1; k < w.pulses.length; k++){
    const at = w.pulses[k].at;
    if(k > G.warnedIdx && G.pulseIdx < 0 && p0 < at && p0 >= at - SURGE_WARN * G.waveSpeed){
      G.warnedIdx = k;
      toast(L().tSurgeWarn(k+1, Math.max(1, Math.ceil((at - p1) / G.waveSpeed))), true);
    }
    if(p0 < at && p1 >= at) G.shake = Math.max(G.shake, 8);
  }
}

// 準備階段剩 REVISE_AT 秒：預警改為真實值（只會調高）。有浮標才提示並閃爍
function reviseForecast(){
  G.revised = true;
  G.raisedRows = Object.keys(G.earlyForecast[G.wave]).map(Number).sort((a, b) => a - b);
  if(G.buoy && G.raisedRows.length){
    G.reviseFlash = REVISE_FLASH;
    toast(L().tRevised(G.raisedRows.map(y => y + 1)), true);
  }
}
