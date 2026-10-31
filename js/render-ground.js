"use strict";
/* ══════════════ 地面預渲染 ══════════════ */
function renderGround(){
  for(let x=0;x<COLS;x++){
    for(let y=0;y<ROWS;y++){
      let r,g,b;
      if(x<=4){ r=36; g=60; b=38; }
      else if(x<=26){ r=46; g=46; b=53; }
      else { r=116; g=100; b=70; }
      const n = (Math.random()-0.5)*14;
      gctx.fillStyle = `rgb(${r+n|0},${g+n|0},${b+n|0})`;
      gctx.fillRect(x*TX, y*TY, TX, TY);
    }
  }
  gctx.fillStyle = 'rgba(26,26,32,0.5)';
  for(let y=2;y<ROWS;y+=6) gctx.fillRect(5*TX, y*TY, 22*TX, 7);
  for(let x=8;x<26;x+=7) gctx.fillRect(x*TX, 0, 7, H);

  gctx.strokeStyle = 'rgba(0,0,0,0.12)';
  gctx.lineWidth = 1;
  for(let x=0;x<=COLS;x++){ gctx.beginPath(); gctx.moveTo(x*TX+.5,0); gctx.lineTo(x*TX+.5,H); gctx.stroke(); }
  for(let y=0;y<=ROWS;y++){ gctx.beginPath(); gctx.moveTo(0,y*TY+.5); gctx.lineTo(W,y*TY+.5); gctx.stroke(); }

  const grd = gctx.createLinearGradient(26*TX,0,28*TX,0);
  grd.addColorStop(0,'rgba(120,180,220,0)');
  grd.addColorStop(1,'rgba(120,180,220,0.16)');
  gctx.fillStyle = grd;
  gctx.fillRect(26*TX,0,2*TX,H);
}
