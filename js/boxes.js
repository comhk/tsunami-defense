"use strict";
/* ══════════════ 物資箱 ══════════════ */
function spawnBox(){
  for(let tries=0; tries<24; tries++){
    const x = Math.floor(Math.random()*COLS);
    const y = Math.floor(Math.random()*ROWS);
    if(G.grid[x][y]) continue;
    if(inHome(x,y)) continue;
    if(G.boxes.some(b=>b.x===x && b.y===y)) continue;
    G.boxes.push({ x, y, life:18, t:Math.random()*6 });
    return;
  }
}
