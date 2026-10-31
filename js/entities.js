"use strict";
/* ══════════════ 實體管理 ══════════════ */
function inHome(x,y){
  return x >= HOME.x && x < HOME.x+HOME.w && y >= HOME.y && y < HOME.y+HOME.h;
}

// (gx, gy) 上的預警浮標（浮標不在 G.grid 內）
function buoyAt(gx, gy){
  return G.buoy && G.buoy.gx === gx && G.buoy.gy === gy ? G.buoy : null;
}

function canPlace(def, gx, gy){
  if(def === DEFS.buoy && (G.buoy || gx < BEACH_X)) return false;  // 浮標：全局一個，只能建在海灘
  for(let dx=0;dx<def.size;dx++) for(let dy=0;dy<def.size;dy++){
    const x = gx+dx, y = gy+dy;
    if(buoyAt(x,y)) return false;
    if(x<0 || x>=COLS || y<0 || y>=ROWS) return false;
    if(G.grid[x][y]) return false;
    if(inHome(x,y)) return false;
  }
  return true;
}

function placeEntity(defId, gx, gy){
  const def = DEFS[defId];
  if(!def) return false;
  if(G.materials < def.cost){ toast(L().tNoMats, true); return false; }
  if(!canPlace(def, gx, gy)){ toast(L().tCantBuild); return false; }

  G.materials -= def.cost;
  const ent = {
    def, defId, gx, gy, size:def.size,
    hp:def.hp, maxHp:def.hp,
    cells:[], cd:Math.random()*0.5, prodTimer:8, pulse:0,
  };
  for(let dx=0;dx<def.size;dx++) for(let dy=0;dy<def.size;dy++){
    if(def.block) G.grid[gx+dx][gy+dy] = ent;  // 不擋水的建築不進格網，水流不受影響
    ent.cells.push([gx+dx, gy+dy]);
  }
  if(def === DEFS.buoy) G.buoy = ent;
  G.structures.push(ent);
  spawnParticles(gx*TX + def.size*TX/2, gy*TY + def.size*TY/2, 6, def.color, 70);

  if(defId === 'tech' || defId === 'superbase') checkUnlocks();
  return true;
}

function destroyEntity(ent){
  for(const [x,y] of ent.cells){
    if(G.grid[x][y] === ent) G.grid[x][y] = null;
  }
  const i = G.structures.indexOf(ent);
  if(i >= 0) G.structures.splice(i,1);
  for(const [x,y] of ent.cells){
    spawnParticles(x*TX+TX/2, y*TY+TY/2, 4, ent.def.color, 80);
  }
  if(ent.defId === 'tech' || ent.defId === 'superbase') checkUnlocks();
}

function checkUnlocks(){
  G.techUnlocked = G.structures.some(s => s.defId === 'tech');
  G.superUnlocked = G.structures.some(s => s.defId === 'superbase');
  updateUI();
}
