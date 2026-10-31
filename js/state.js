"use strict";
/* ══════════════ 狀態 ══════════════ */
const G = {
  phase:'menu', wave:0, timer:0, paused:false,
  materials:80, power:{prod:0,cons:0,ok:true},
  water:new Float32Array(COLS*ROWS),
  freeze:new Float32Array(COLS*ROWS),
  grid:[],
  structures:[], trucks:[], city:[],
  particles:[], projectiles:[], effects:[],
  boxes:[],
  selectedBuild:null, selectedSkill:null,
  flowTimer:0,
  incomeAcc:0, boxTimer:0,
  shake:0, time:0,
  waveProgress:0, inflowEnd:0,
  pulseIdx:-1,     // 本幀正在注水的湧浪（-1 = 沒有）；注水與 HUD 共用
  warnedIdx:0,     // 已出警告的最後一道湧浪
  seed:0,          // 本局種子（開局時決定）
  bays:[],         // 每波的每列倍率（由 seed 得出）
  early:[],        // 每波的早期預警低估：{列: 被調低的倍率}（由 seed 得出）
  revised:false,   // 本次準備階段是否已修正預警
  reviseFlash:0,   // 修正後標記閃爍的剩餘秒數
  raisedRows:[],   // 本次修正調高的列
  buoy:null,       // 預警浮標實體（不在 G.grid 內，所以不擋水）
  techUnlocked:false, superUnlocked:false,
  superCD:0,
  superAim:false,
  toastTimer:null,
};

/* ══════════════ 初始化 ══════════════ */
function init(){
  G.grid = [];
  for(let x=0;x<COLS;x++){
    G.grid[x] = [];
    for(let y=0;y<ROWS;y++) G.grid[x][y] = null;
  }
  G.structures = []; G.trucks = []; G.city = []; G.buoy = null;
  G.particles = []; G.projectiles = []; G.effects = []; G.boxes = [];
  G.water.fill(0); G.freeze.fill(0);
  G.waveProgress = 0;

  for(let i=0;i<55;i++){
    const bx = 5 + Math.floor(Math.random()*22);
    const by = Math.floor(Math.random()*13);
    const hgt = 1 + Math.floor(Math.random()*3);
    if(by + hgt > ROWS-1) continue;
    G.city.push({ x:bx, y:by, h:hgt, destroyed:false,
      shade: 58 + Math.random()*50 });
  }
}
