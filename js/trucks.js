"use strict";
/* ══════════════ 垃圾車 ══════════════ */
function updateTrucks(dt){
  if(G.phase === 'prep'){
    // 垃圾場生產
    if(G.power.ok && G.trucks.length < MAX_TRUCKS){
      for(const s of G.structures){
        if(s.def.producer){
          s.prodTimer -= dt;
          if(s.prodTimer <= 0 && G.trucks.length < MAX_TRUCKS){
            s.prodTimer = 14;
            s.pulse = 0.4;
            const cx = s.gx*TX + s.size*TX/2;
            const cy = s.gy*TY + s.size*TY/2;
            G.trucks.push({
              x: cx, y: cy, speed: 130, target: null,
              angle: 0,
            });
            spawnParticles(cx, cy, 4, '#d8d8d8', 60);
          }
        }
      }
    }
  }

  for(const t of G.trucks){
    // 找最近箱子
    if(!t.target || G.boxes.indexOf(t.target) < 0) t.target = null;
    if(!t.target){
      let best = null, bd = 1e9;
      for(const b of G.boxes){
        const bx = b.x*TX + TX/2, by = b.y*TY + TY/2;
        const d = Math.hypot(bx-t.x, by-t.y);
        if(d < bd){ bd = d; best = b; }
      }
      t.target = best;
    }

    if(t.target){
      const bx = t.target.x*TX + TX/2;
      const by = t.target.y*TY + TY/2;
      const dx = bx-t.x, dy = by-t.y;
      const d = Math.hypot(dx,dy);
      t.angle = Math.atan2(dy,dx);
      if(d < 10){
        const amt = 10 + Math.floor(Math.random()*8);
        G.materials += amt;
        spawnParticles(bx, by, 6, '#ffd166', 100);
        const bi = G.boxes.indexOf(t.target);
        if(bi >= 0) G.boxes.splice(bi,1);
        t.target = null;
      } else {
        const step = Math.min(t.speed*dt, d);
        t.x += dx/d*step;
        t.y += dy/d*step;
      }
    }
  }
}
