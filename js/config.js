"use strict";
/* ══════════════ 常數 ══════════════ */
const COLS = 32, ROWS = 16;
const TX = 30, TY = 24;              // 格子像素尺寸（水平 / 垂直）
const WORLD_X = 0, WORLD_Y = 56;     // 世界在畫布中的偏移
const W = COLS * TX;                 // 960
const H = ROWS * TY;                 // 384

const WATER_MAX = 1.4;
const FLOW_INTERVAL = 0.075;         // 每 75ms 一步水流
const HOME = { x: 1, y: 8, w: 3, h: 4 };
const LOSE_DEPTH = 0.55;             // 家前水深刻度即失敗
const SURGE_WARN = 3;                // 後續湧浪到達前幾秒（實際時間）出警告
const TSUNAMI_MAX = 12;             // 停止注水後最多再等的波次進度
const SEEP_KEEP = 0.7;               // 湧浪之間及之後每秒保留的水量比例
const DRAIN_KEEP = 0.35;             // 退水階段每秒保留的水量比例
const FLOW_RATE = 0.55;              // 每步流向下一格的水量比例
const WATER_EPS = 0.008;             // 低於此水深視為乾涸
const BUOY_COST = 30;                // 預警浮標成本
const BEACH_X = 27;                  // 海灘起點（浮標只能建在 x >= 此值）
const LEVEL_LOW = 0.9;               // 倍率低於此值為「低」
const LEVEL_HIGH = 1.15;             // 倍率高於此值為「高」；之間為「中」
const LEVEL_COLOR = { low:'#6fd08c', medium:'#ffd166', high:'#ff5a5a' };  // 預警標記顏色
const REVISE_AT = 10;                // 準備階段剩餘此秒數時，預警修正為真實值
const REVISE_FLASH = 3;              // 修正後被調高的標記閃爍秒數
const START_MATS = 80;               // 開局材料
const BASE_INCOME = 3;               // 準備階段每秒基本收入

const DEFS = {
  sandbag:   { cost:14,  hp:400,  block:true, size:1, color:'#c9a86a', h:6,  key:'1' },
  tree:      { cost:22,  hp:650,  block:true, size:1, color:'#3e8a3e', h:16, key:'2' },
  wall:      { cost:26,  hp:900,  block:true, size:1, color:'#8c8c96', h:12, key:'3' },
  dike:      { cost:45,  hp:1900, block:true, size:1, color:'#b4b4be', h:18, key:'4' },
  mg:        { cost:30,  hp:150,  block:true, size:1, color:'#6a7a6a', h:20, key:'5', tower:'mg',     range:3.6, dmg:1.2, cd:0.14 },
  rocket:    { cost:60,  hp:180,  block:true, size:1, color:'#8a6a5a', h:22, key:'6', tower:'rocket', range:4.5, dmg:1.4, cd:0.5 },
  frost:     { cost:55,  hp:140,  block:true, size:1, color:'#5a9aca', h:20, key:'7', tower:'frost',  range:3.2, dmg:0.8 },
  dump:      { cost:50,  hp:200,  block:true, size:2, color:'#6a7a5a', h:10, key:'8', producer:true },
  power:     { cost:70,  hp:220,  block:true, size:2, color:'#4a7aa8', h:16, key:'9', power:30 },
  recycle:   { cost:40,  hp:160,  block:true, size:2, color:'#3f8f6a', h:8,  key:'0', income:2 },
  tech:      { cost:150, hp:400,  block:true, size:2, color:'#7a5a9a', h:26, key:'T' },
  superbase: { cost:300,hp:500, block:true, size:2, color:'#a05050', h:30, key:'Y' },
  // 預警浮標：不擋水（不進 G.grid）、水不會傷害它；只能建在海灘，全局最多一個
  buoy:      { cost:BUOY_COST, hp:100, block:false, size:1, color:'#ffb347', h:14, key:'B' },
};

const SUPER = { cd:45, radius:6 };
const MAX_TRUCKS = 5;

// pulses：每波的湧浪 { at 開始, dur 長度, power 強度 }，at/dur 以波次進度計（遊戲時間 × speed）
const WAVES = [
  { speed:1.0, prep:45, pulses:[{at:0,dur:8,power:1.0}] },
  { speed:1.1, prep:38, pulses:[{at:0,dur:7,power:1.1}, {at:12,dur:5,power:0.8}] },
  { speed:1.2, prep:34, pulses:[{at:0,dur:5,power:0.8}, {at:9,dur:8,power:1.3}, {at:22,dur:5,power:0.8}] },
  { speed:1.3, prep:32, pulses:[{at:0,dur:6,power:0.9}, {at:10,dur:6,power:1.0}, {at:20,dur:10,power:1.3}] },
  { speed:1.4, prep:30, pulses:[{at:0,dur:7,power:1.0}, {at:11,dur:12,power:1.4}, {at:27,dur:9,power:0.9}] },
];
// 海灣：從第 2 波起，每波的注水集中在以隨機一列為中心的平滑隆起
const BAY_PEAK = 1.5;    // 中心列倍率上限
const BAY_FLOOR = 0.7;   // 遠離中心列倍率下限
const BAY_WIDTH = 2.5;   // 隆起寬度（列，高斯標準差）
const levelOf = m => m < LEVEL_LOW ? 'low' : m > LEVEL_HIGH ? 'high' : 'medium';
// 小型可設種子亂數（mulberry32），不用 Math.random，令同一種子得同一組海灣
function seededRng(seed){
  let a = seed >>> 0;
  return () => {
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// 以中心列 c 建立每列倍率：平均為 1，最高不超過 BAY_PEAK，最低不低於 BAY_FLOOR
function bayProfile(c){
  const bump = Array.from({length:ROWS}, (_, y) => Math.exp(-0.5 * ((y - c) / BAY_WIDTH) ** 2));
  const mean = bump.reduce((a, b) => a + b, 0) / ROWS;
  const hi = Math.max(...bump) - mean, lo = mean - Math.min(...bump);
  const scale = Math.min((BAY_PEAK - 1) / hi, (1 - BAY_FLOOR) / lo);
  return bump.map(b => 1 + scale * (b - mean));
}
// 由本局種子得出每波的每列倍率；第 1 波平坦
function rollBays(seed){
  const rng = seededRng(seed);
  return WAVES.map((_, w) => {
    const c = Math.floor(rng() * ROWS);
    return w === 0 ? new Array(ROWS).fill(1) : bayProfile(c);
  });
}
// 早期預警：從第 2 波起，低估緊鄰中心列的 1–2 列，各低一級（絕不動中心列、不高估）
// 被低估列的顯示倍率取低一級範圍的中點，必定落在該級範圍內
const lowerLevelMult = m => levelOf(m) === 'high' ? (LEVEL_LOW + LEVEL_HIGH) / 2 : (BAY_FLOOR + LEVEL_LOW) / 2;
function rollEarly(seed, bays){
  const rng = seededRng(seed ^ 0x5bd1e995);
  return bays.map((prof, w) => {
    const n = 1 + Math.floor(rng() * 2), side = rng() < 0.5 ? -1 : 1;  // 每波固定抽兩次，結果只取決於種子
    const out = {};
    if(w === 0) return out;
    const c = prof.indexOf(Math.max(...prof));
    const nearRows = [c + side, c - side].filter(y => y >= 0 && y < ROWS && levelOf(prof[y]) !== 'low');
    for(const y of nearRows.slice(0, n)) out[y] = Math.min(prof[y], lowerLevelMult(prof[y]));
    return out;
  });
}
// 最後一道湧浪結束的進度
const inflowEndOf = w => Math.max(...w.pulses.map(s => s.at + s.dur));
// 進度 p 時正在注水的湧浪索引（無則 -1）
const pulseIndexAt = (w, p) => w.pulses.findIndex(s => p >= s.at && p <= s.at + s.dur);
// 進度 p 之後下一道湧浪的索引（無則 -1）
const nextPulseIndex = (w, p) => w.pulses.findIndex(s => s.at > p);

// 測試旗標：test/waves.test.mjs 在載入前設定 window.__TSUNAMI_TEST__ = { noLose? }
const TEST = window.__TSUNAMI_TEST__ || null;
