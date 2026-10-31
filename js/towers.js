"use strict";
/* ══════════════ 防禦塔 ══════════════ */
function updateTowers(dt){
  for(const s of G.structures){
    if(!s.def.tower) continue;
    if(s.hp <= 0) continue;

    const def = s.def;
    const cx = s.gx*TX + s.size*TX/2;
    const cy = s.gy*TY + s.size*TY/2;
    const R = def.range;
    const Rg = Math.ceil(R);

    // 搜尋射程內最厚的水
    let best = null, bestH = 0.08;
    for(let dx=-Rg;dx<=Rg;dx++) for(let dy=-Rg;dy<=Rg;dy++){
      const gx = s.gx + dx, gy = s.gy + dy;
      if(gx<0 || gx>=COLS || gy<0 || gy>=ROWS) continue;
      if(Math.hypot(dx, dy) > R) continue;
      const h = G.water[idx(gx,gy)];
      if(h > bestH){ bestH = h; best = {gx, gy}; }
    }

    if(!best){ s.target = null; continue; }
    s.target = best;

    if(def.tower === 'mg'){
      s.cd -= dt;
      if(s.cd <= 0){
        s.cd += def.cd;
        const ti = idx(best.gx, best.gy);
        G.water[ti] = Math.max(0, G.water[ti] - def.dmg);
        // 彈道特效
        G.projectiles.push({
          type:'bullet',
          x1: cx, y1: cy,
          x2: best.gx*TX+TX/2, y2: best.gy*TY+TY/2,
          t: 0, dur: 0.06,
        });
        spawnParticles(best.gx*TX+TX/2, best.gy*TY+TY/2, 2, '#ffe080', 80);
      }
    }
    else if(def.tower === 'rocket'){
      s.cd -= dt;
      if(s.cd <= 0){
        s.cd += def.cd;
        G.projectiles.push({
          type:'rocket',
          x1: cx, y1: cy,
          x2: best.gx*TX+TX/2, y2: best.gy*TY+TY/2,
          t: 0, dur: 0.55,
          gx: best.gx, gy: best.gy,
        });
      }
    }
    else if(def.tower === 'frost'){
      // 持續光束：凍結並削弱
      s.beamTo = best;
      const ti = idx(best.gx, best.gy);
      G.freeze[ti] = Math.max(G.freeze[ti], 1.4);
      G.water[ti] = Math.max(0, G.water[ti] - def.dmg*dt);
    }
  }

  // 處理彈道
  for(let i=G.projectiles.length-1;i>=0;i--){
    const p = G.projectiles[i];
    p.t += dt;
    if(p.t < p.dur) continue;

    if(p.type === 'rocket'){
      // AOE 傷害
      const R = 1.7;
      for(let dx=-2;dx<=2;dx++) for(let dy=-2;dy<=2;dy++){
        if(Math.hypot(dx,dy) > R) continue;
        const gx = p.gx+dx, gy = p.gy+dy;
        if(gx<0 || gx>=COLS || gy<0 || gy>=ROWS) continue;
        const ti = idx(gx,gy);
        G.water[ti] = Math.max(0, G.water[ti] - DEFS.rocket.dmg);
      }
      G.effects.push({ type:'explosion',
        x: p.x2, y: p.y2, t:0, dur:0.4, r: R*TX });
      G.shake = Math.max(G.shake, 4);
    }
    G.projectiles.splice(i,1);
  }
}
