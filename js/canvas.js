"use strict";
/* ══════════════ 畫布 ══════════════ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const app = document.getElementById('app');

const groundCanvas = document.createElement('canvas');
groundCanvas.width = W; groundCanvas.height = H;
const gctx = groundCanvas.getContext('2d');
