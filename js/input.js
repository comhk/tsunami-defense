"use strict";
/* ══════════════ 輸入處理 ══════════════ */
const mouse = { x:-999, y:-999, gx:-1, gy:-1 };

function toWorld(e){
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  return {
    x: (e.clientX - r.left) * sx,
    y: (e.clientY - r.top) * sy - WORLD_Y,
  };
}

canvas.addEventListener('pointermove', e => {
  const p = toWorld(e);
  mouse.x = p.x; mouse.y = p.y;
  mouse.gx = Math.floor(p.x / TX);
  mouse.gy = Math.floor(p.y / TY);
});

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  const p = toWorld(e);
  mouse.x = p.x; mouse.y = p.y;
  const gx = Math.floor(p.x / TX);
  const gy = Math.floor(p.y / TY);
  if(gx<0 || gx>=COLS || gy<0 || gy>=ROWS) return;

  if(G.phase === 'menu' || G.phase === 'win' || G.phase === 'lose') return;
  if(G.paused) return;

  // 1. 撿箱子
  for(let i=0;i<G.boxes.length;i++){
    const b = G.boxes[i];
    if(b.x === gx && b.y === gy){
      const amt = 10 + Math.floor(Math.random()*8);
      G.materials += amt;
      spawnParticles(gx*TX+TX/2, gy*TY+TY/2, 6, '#ffd166', 100);
      toast(L().tMats(amt));
      G.boxes.splice(i,1);
      return;
    }
  }

  // 2. 超級武器瞄準
  if(G.superAim){
    if(!G.superUnlocked){ toast(L().tSuperLocked, true); return; }
    if(G.superCD > 0){ toast(L().tCooldown(Math.ceil(G.superCD)), true); return; }
    fireSuper(gx, gy);
    G.superAim = false;
    updateUI();
    return;
  }

  // 3. 建造
  if(G.selectedBuild){
    placeEntity(G.selectedBuild, gx, gy);
    return;
  }
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  G.selectedBuild = null;
  G.superAim = false;
  updateUI();
});

window.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  if((k === 'P' || e.key === ' ') && canPause()){ e.preventDefault(); togglePause(); return; }
  if(G.paused) return;
  for(const id in DEFS){
    if(DEFS[id].key === k){
      if(id === 'superbase' && !G.techUnlocked){ toast(L().tNeedTech, true); return; }
      G.selectedBuild = G.selectedBuild === id ? null : id;
      G.superAim = false;
      updateUI();
      return;
    }
  }
  if(k === 'R'){ // 超級武器快捷鍵
    if(G.superUnlocked && G.superCD <= 0){
      G.superAim = true; G.selectedBuild = null; updateUI();
    }
  }
  if(e.key === 'Escape'){
    G.selectedBuild = null;
    G.superAim = false;
    updateUI();
  }
});
