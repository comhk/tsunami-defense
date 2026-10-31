"use strict";
/* ══════════════ 超級武器 ══════════════ */
function fireSuper(gx, gy){
  G.superCD = SUPER.cd;
  const R = SUPER.radius;

  for(let dx=-R;dx<=R;dx++) for(let dy=-R;dy<=R;dy++){
    if(Math.hypot(dx,dy) > R) continue;
    const x = gx+dx, y = gy+dy;
    if(x<0 || x>=COLS || y<0 || y>=ROWS) continue;
    const i = idx(x,y);
    G.water[i] = 0;
    G.freeze[i] = Math.max(G.freeze[i], 2.5);
  }

  G.effects.push({
    type:'super',
    x: gx*TX + TX/2,
    y: gy*TY + TY/2,
    t:0, dur:1.6, r: R*TX,
  });
  G.shake = 26;
  toast(L().tSuperFire, true);
}
