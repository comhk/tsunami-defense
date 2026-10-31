"use strict";
/* ══════════════ 工具函數 ══════════════ */
const idx = (x,y) => y*COLS + x;

function shade(hex, amt){
  const n = parseInt(hex.slice(1),16);
  let r = (n>>16)&255, g = (n>>8)&255, b = n&255;
  if(amt > 0){ r += (255-r)*amt; g += (255-g)*amt; b += (255-b)*amt; }
  else { r *= (1+amt); g *= (1+amt); b *= (1+amt); }
  return `rgb(${r|0},${g|0},${b|0})`;
}

function spawnParticles(x,y,n,color,speed){
  for(let i=0;i<n;i++){
    const a = Math.random()*Math.PI*2;
    const s = speed*(0.3+Math.random());
    G.particles.push({
      x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 40,
      life: 0.5+Math.random()*0.6, max: 0.5+Math.random()*0.6,
      color, size: 2+Math.random()*3,
    });
  }
}
