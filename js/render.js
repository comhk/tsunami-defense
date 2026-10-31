"use strict";
/* ══════════════ 渲染 ══════════════ */
function render(){
  ctx.clearRect(0,0,960,520);

  // 天空/背景
  const bgGrad = ctx.createLinearGradient(0,0,0,WORLD_Y);
  bgGrad.addColorStop(0,'#0a1220');
  bgGrad.addColorStop(1,'#0d1828');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,960,WORLD_Y);

  ctx.save();
  ctx.translate(WORLD_X, WORLD_Y);
  if(G.shake > 0) ctx.translate((Math.random()-0.5)*G.shake, (Math.random()-0.5)*G.shake);

  // 世界裁剪
  ctx.beginPath();
  ctx.rect(0, -40, W, H+40);
  ctx.clip();

  ctx.drawImage(groundCanvas, 0, 0);
  drawWaterLayer();
  drawCity();
  drawHome();
  drawAllEntities();
  drawMarkers();
  drawTrucks();
  drawBoxes();
  drawProjectiles();
  drawParticles();
  drawEffects();
  drawPreview();

  ctx.restore();

  // 底部陰影
  const botGrad = ctx.createLinearGradient(0,H+WORLD_Y-10,0,H+WORLD_Y+10);
  botGrad.addColorStop(0,'rgba(0,0,0,0)');
  botGrad.addColorStop(1,'rgba(0,0,0,0.5)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0,H+WORLD_Y-10,960,20);

  // 暫停畫面
  if(G.paused){
    ctx.fillStyle = 'rgba(4,10,18,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#dff4ff';
    ctx.textAlign = 'center';
    ctx.font = '700 36px sans-serif';
    ctx.fillText(L().paused, canvas.width/2, canvas.height/2);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#8fb3cc';
    ctx.fillText(L().pausedHint, canvas.width/2, canvas.height/2 + 28);
    ctx.textAlign = 'left';
  }
}

/* --- 水體渲染 --- */
function drawWaterLayer(){
  for(let x=0;x<COLS;x++){
    for(let y=0;y<ROWS;y++){
      const i = idx(x,y);
      const w = G.water[i];
      if(w < 0.02) continue;

      const sx = x*TX, sy = y*TY;
      const depth = Math.min(w / WATER_MAX, 1);
      const alpha = Math.min(depth * 0.85, 0.85);

      // 基礎水色
      const baseR = 40 + depth*30;
      const baseG = 110 + depth*50;
      const baseB = 180 + depth*40;

      const wob = Math.sin(G.time*4 + x*0.7 + y*0.4) * 0.5 + 0.5;
      const a = alpha * (0.85 + wob * 0.15);

      ctx.fillStyle = `rgba(${baseR|0},${baseG|0},${baseB|0},${a})`;
      ctx.fillRect(sx, sy, TX+.5, TY+.5);

      // 水面高光
      if(depth > 0.4){
        ctx.fillStyle = `rgba(200,235,255,${(depth-0.4)*0.35})`;
        ctx.fillRect(sx, sy + Math.sin(G.time*3 + x*0.5)*2, TX, 2);
      }

      // 泡沫（前緣）
      if(depth > 0.15){
        const leftI = x > 0 ? idx(x-1,y) : -1;
        if(leftI < 0 || G.water[leftI] < 0.05){
          ctx.fillStyle = `rgba(230,245,255,${Math.min(depth,0.7)})`;
          ctx.fillRect(sx, sy, 3, TY);
        }
      }

      // 冰凍效果
      if(G.freeze[i] > 0){
        ctx.fillStyle = `rgba(180,230,255,0.35)`;
        ctx.fillRect(sx, sy, TX, TY);
        // 冰晶
        ctx.strokeStyle = `rgba(220,245,255,0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx+6, sy+6);
        ctx.lineTo(sx+14, sy+14);
        ctx.moveTo(sx+14, sy+6);
        ctx.lineTo(sx+6, sy+14);
        ctx.stroke();
      }
    }
  }
}

/* --- 城市建築 --- */
function drawCity(){
  const sorted = [...G.city].sort((a,b)=>a.y-b.y);
  for(const b of sorted){
    if(b.destroyed) continue;
    const px = b.x*TX, py = b.y*TY, ph = b.h*TY;
    const H = 8 + b.h*4;

    // 陰影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(px+3, py+3, TX, ph);

    // 前側面
    ctx.fillStyle = `rgb(${b.shade*0.7|0},${b.shade*0.7|0},${b.shade*0.75|0})`;
    ctx.fillRect(px, py+ph-H, TX, H);

    // 頂面
    ctx.fillStyle = `rgb(${b.shade|0},${b.shade|0},${b.shade+8|0})`;
    ctx.fillRect(px, py-H, TX, ph);

    // 窗戶
    ctx.fillStyle = 'rgba(255,220,120,0.3)';
    for(let i=0;i<2;i++){
      ctx.fillRect(px+5, py+6+i*12-H, 4, 4);
      ctx.fillRect(px+18, py+6+i*12-H, 4, 4);
    }
  }
}

/* --- 家 --- */
function drawHome(){
  const px = HOME.x*TX, py = HOME.y*TY;
  const pw = HOME.w*TX, ph = HOME.h*TY;
  const H = 24;

  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(px+4, py+4, pw, ph);

  // 圍牆底
  ctx.fillStyle = '#4a3320';
  ctx.fillRect(px, py, pw, ph);

  // 屋身
  ctx.fillStyle = '#c49a6c';
  ctx.fillRect(px, py + ph*0.35, pw, ph*0.65);

  // 屋頂
  ctx.fillStyle = '#a3352f';
  ctx.beginPath();
  ctx.moveTo(px, py + ph*0.38);
  ctx.lineTo(px + pw/2, py - H);
  ctx.lineTo(px + pw, py + ph*0.38);
  ctx.closePath();
  ctx.fill();

  // 門窗
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(px+pw/2-8, py+ph*0.7, 16, ph*0.3);
  ctx.fillStyle = '#ffd97a';
  ctx.fillRect(px+8, py+ph*0.55, 12, 12);
  ctx.fillRect(px+pw-20, py+ph*0.55, 12, 12);

  // 光暈
  const pulse = 0.3 + Math.sin(G.time*2) * 0.12;
  ctx.strokeStyle = `rgba(120,230,150,${pulse})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(px-2, py-2, pw+4, ph+4);

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.9;
  ctx.fillText(L().home, px+pw/2, py-H-4);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

/* --- 所有實體（按 y 排序） --- */
function drawAllEntities(){
  const sorted = [...G.structures].sort((a,b)=>{
    const ya = a.gy + a.size, yb = b.gy + b.size;
    if(ya !== yb) return ya - yb;
    return a.gx - b.gx;
  });

  for(const e of sorted){
    drawEntity3D(e);
  }
}

// 預警標記：海邊最右一欄，每列一支向左箭頭，顏色依強度
function drawMarkers(){
  const f = forecast();
  if(!f) return;
  ctx.globalAlpha = 0.9;
  f.rows.forEach((r, y) => {
    const cx = (COLS-1)*TX + TX/2, cy = y*TY + TY/2;
    const flash = G.reviseFlash > 0 && G.raisedRows.includes(y) && Math.floor(G.reviseFlash * 4) % 2 === 0;
    ctx.fillStyle = flash ? '#fff' : LEVEL_COLOR[r.level];
    ctx.beginPath();
    ctx.moveTo(cx - 9, cy);
    ctx.lineTo(cx + 3, cy - 6);
    ctx.lineTo(cx + 3, cy + 6);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawEntity3D(e){
  const def = e.def;
  const sx = e.gx*TX;
  const sy = e.gy*TY;
  const sw = e.size*TX;
  const sh = e.size*TY;
  const H = def.h;

  // 陰影
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(sx+3, sy+3, sw, sh);

  // 前側面
  ctx.fillStyle = shade(def.color, -0.4);
  ctx.fillRect(sx, sy + sh - H, sw, H);

  // 頂面
  ctx.fillStyle = def.color;
  ctx.fillRect(sx, sy - H, sw, sh);

  // 頂部高光
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(sx, sy - H, sw, 2);

  // 外框
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, sy - H, sw, sh);

  // 依類型加細節
  if(def.tower){
    drawTowerDetail(e, sx, sy, sw, sh, H);
  } else if(defId(e) === 'power'){
    drawPowerDetail(sx, sy, sw, sh, H);
  } else if(defId(e) === 'recycle'){
    drawRecycleDetail(sx, sy, sw, sh, H);
  } else if(defId(e) === 'dump'){
    drawDumpDetail(e, sx, sy, sw, sh, H);
  } else if(defId(e) === 'tech' || defId(e) === 'superbase'){
    drawTechDetail(e, sx, sy, sw, sh, H);
  }

  // HP 條
  if(e.hp < e.maxHp * 0.95){
    const bw = sw * 0.8;
    const bh = 3;
    const bx = sx + (sw-bw)/2;
    const by = sy - H - 7;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx-1, by-1, bw+2, bh+2);
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = ratio > 0.5 ? '#4fd86a' : ratio > 0.25 ? '#ffd166' : '#ff5a5a';
    ctx.fillRect(bx, by, bw*ratio, bh);
  }
}

function defId(e){ return e.defId; }

function drawTowerDetail(e, sx, sy, sw, sh, H){
  const cx = sx + sw/2;
  const cy = sy - H + sh/2;
  const type = e.def.tower;

  if(type === 'mg'){
    // 槍管
    if(e.target){
      const t = e.target;
      const tx = t.gx*TX + TX/2;
      const ty = t.gy*TY + TY/2;
      const ang = Math.atan2(ty - (sy - H + sh/2), tx - (sx - H + sh/2));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.fillStyle = '#3a4a3a';
      ctx.fillRect(-2, -2, 16, 4);
      ctx.fillStyle = '#1a2a1a';
      ctx.fillRect(10, -1.5, 5, 3);
      ctx.restore();
    }
    // 塔身
    ctx.fillStyle = '#4a5a4a';
    ctx.fillRect(cx-8, cy-8, 16, 16);
    ctx.fillStyle = '#6a7a6a';
    ctx.fillRect(cx-5, cy-5, 10, 10);
  }
  else if(type === 'rocket'){
    // 發射架
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(cx-9, cy-3, 18, 8);
    ctx.fillStyle = '#8a6a5a';
    for(let i=0;i<3;i++){
      ctx.fillRect(cx-8+i*6, cy-8, 4, 7);
    }
    // 紅點
    ctx.fillStyle = '#ff5555';
    ctx.beginPath();
    ctx.arc(cx, cy-10, 2, 0, 7);
    ctx.fill();
  }
  else if(type === 'frost'){
    // 發射器
    ctx.fillStyle = '#3a6a9a';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#7acaf0';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, 7);
    ctx.fill();
    // 光束
    if(e.beamTo){
      const tx = e.beamTo.gx*TX + TX/2;
      const ty = e.beamTo.gy*TY + TY/2;
      const pulse = 0.5 + Math.sin(G.time*12)*0.3;
      ctx.strokeStyle = `rgba(150,220,255,${pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // 目標冰圈
      ctx.strokeStyle = `rgba(200,240,255,${pulse*0.8})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(tx, ty, 12, 0, 7);
      ctx.stroke();
    }
  }
}

function drawPowerDetail(sx, sy, sw, sh, H){
  const cx = sx + sw/2;
  const cy = sy - H + sh/2;
  // 閃電
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.moveTo(cx+3, cy-14);
  ctx.lineTo(cx-6, cy+1);
  ctx.lineTo(cx, cy+1);
  ctx.lineTo(cx-3, cy+14);
  ctx.lineTo(cx+7, cy-2);
  ctx.lineTo(cx+1, cy-2);
  ctx.closePath();
  ctx.fill();
  // 煙囪
  ctx.fillStyle = '#4a5a6a';
  ctx.fillRect(sx+8, sy-H-6, 6, 12);
  ctx.fillRect(sx+sw-14, sy-H-6, 6, 12);
  // 通電
  if(Math.floor(G.time*3)%2===0){
    ctx.fillStyle = 'rgba(255,240,150,0.6)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 7);
    ctx.fill();
  }
}

function drawRecycleDetail(sx, sy, sw, sh, H){
  const cx = sx + sw/2;
  const cy = sy - H + sh/2;
  // 循環箭頭
  ctx.strokeStyle = '#c8f0d8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0.4, 2.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 3.5, 5.2);
  ctx.stroke();
  // 箭頭
  ctx.fillStyle = '#c8f0d8';
  ctx.beginPath();
  ctx.moveTo(cx+11, cy-4);
  ctx.lineTo(cx+6, cy+1);
  ctx.lineTo(cx+14, cy+1);
  ctx.closePath();
  ctx.fill();
  // 材料點
  if(Math.floor(G.time*2)%2===0){
    ctx.fillStyle = 'rgba(255,215,120,0.9)';
    ctx.fillRect(cx-2, cy-2, 4, 4);
  }
}

function drawDumpDetail(e, sx, sy, sw, sh, H){
  const cx = sx + sw/2;
  const cy = sy - H + sh/2;
  // 垃圾堆
  const cols = ['#7a8a5a','#8a7a5a','#5a7a6a','#9a8a6a'];
  for(let i=0;i<5;i++){
    const gx = sx + 10 + (i*17)%(sw-20);
    const gy = sy - H + 12 + (i*13)%(sh-20);
    ctx.fillStyle = cols[i%cols.length];
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, 7);
    ctx.fill();
  }
  // 廠房
  ctx.fillStyle = '#8a6a4a';
  ctx.fillRect(sx+sw-22, sy-H+6, 18, 12);
  ctx.fillStyle = '#d8c060';
  ctx.fillRect(sx+sw-18, sy-H+10, 10, 4);

  if(e.pulse > 0){
    ctx.strokeStyle = `rgba(255,230,120,${e.pulse*2})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx+1, sy-H+1, sw-2, sh-2);
  }
}

function drawTechDetail(e, sx, sy, sw, sh, H){
  const cx = sx + sw/2;
  const cy = sy - H + sh/2;

  if(e.defId === 'tech'){
    // 雷達碟
    ctx.fillStyle = '#b8a8e8';
    ctx.beginPath();
    ctx.ellipse(cx, cy-4, 12, 5, -0.3, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#8a7ac8';
    ctx.fillRect(cx-2, cy-2, 4, 10);
    // 底部
    ctx.fillStyle = '#5a4a8a';
    ctx.fillRect(cx-10, cy+6, 20, 6);
    // 發光
    const glow = 0.4 + Math.sin(G.time*3)*0.3;
    ctx.fillStyle = `rgba(180,150,255,${glow})`;
    ctx.beginPath();
    ctx.arc(cx+10, cy-10, 3, 0, 7);
    ctx.fill();
  }
  else if(e.defId === 'superbase'){
    // 中央炮台
    ctx.fillStyle = '#d0a0a0';
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#a05050';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 7);
    ctx.fill();
    // 炮管
    ctx.fillStyle = '#3a2a2a';
    ctx.fillRect(cx-2, cy-16, 4, 12);
    // 能量環
    const ringPulse = 0.5 + Math.sin(G.time*4)*0.4;
    ctx.strokeStyle = `rgba(255,200,100,${ringPulse})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 7);
    ctx.stroke();
    // 頂燈
    ctx.fillStyle = `rgba(255,80,80,${ringPulse})`;
    ctx.beginPath();
    ctx.arc(cx, cy-18, 2.5, 0, 7);
    ctx.fill();
  }
}

/* --- 垃圾車 --- */
function drawTrucks(){
  for(const t of G.trucks){
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);

    // 陰影
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(1, 1, 12, 7, 0, 0, 7);
    ctx.fill();

    // 車身
    ctx.fillStyle = '#3a7a4a';
    ctx.fillRect(-12, -7, 22, 14);
    // 垃圾箱
    ctx.fillStyle = '#6a7a5a';
    ctx.fillRect(-12, -7, 14, 14);
    ctx.fillStyle = '#8a9a6a';
    ctx.fillRect(-12, -7, 14, 3);
    // 車頭
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(6, -6, 7, 12);
    ctx.fillStyle = '#5ac0ff';
    ctx.fillRect(9, -4, 3, 4);
    // 輪子
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(-7, -7, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(-7, 7, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -7, 3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 7, 3, 0, 7); ctx.fill();

    ctx.restore();
  }
}

/* --- 物資箱 --- */
function drawBoxes(){
  for(const b of G.boxes){
    const px = b.x*TX, py = b.y*TY;
    const bob = Math.sin(G.time*3 + b.t) * 2.5;
    const alpha = b.life < 4 ? (0.35 + 0.65*Math.abs(Math.sin(G.time*8))) : 1;

    ctx.globalAlpha = alpha;

    // 陰影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(px+TX/2, py+TY-3, 8, 4, 0, 0, 7);
    ctx.fill();

    // 箱體
    const bh = 16;
    const by = py + TY/2 - bh/2 + bob;
    ctx.fillStyle = '#c98f3d';
    ctx.fillRect(px+7, by, 16, bh);
    ctx.fillStyle = '#8a5f24';
    ctx.fillRect(px+7, by+6, 16, 3);
    ctx.fillRect(px+13, by, 3, bh);
    ctx.strokeStyle = '#e8c274';
    ctx.lineWidth = 1;
    ctx.strokeRect(px+7.5, by+0.5, 15, bh-1);

    // 高光
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(px+8, by+1, 5, 3);

    ctx.globalAlpha = 1;
  }
}

/* --- 彈道 --- */
function drawProjectiles(){
  for(const p of G.projectiles){
    const k = p.t / p.dur;
    if(p.type === 'bullet'){
      const x = p.x1 + (p.x2-p.x1)*k;
      const y = p.y1 + (p.y2-p.y1)*k;
      ctx.strokeStyle = 'rgba(255,240,150,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y1);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = '#fff8c0';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 7);
      ctx.fill();
    }
    else if(p.type === 'rocket'){
      const arc = Math.sin(k * Math.PI) * 20;
      const x = p.x1 + (p.x2-p.x1)*k;
      const y = p.y1 + (p.y2-p.y1)*k - arc;
      // 尾焰
      ctx.fillStyle = 'rgba(255,180,80,0.7)';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#ff5555';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 7);
      ctx.fill();
    }
  }
}

/* --- 粒子 --- */
function drawParticles(){
  for(const p of G.particles){
    const a = Math.max(0, p.life / p.max);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

/* --- 特效 --- */
function drawEffects(){
  for(const e of G.effects){
    const k = e.t / e.dur;

    if(e.type === 'explosion'){
      ctx.globalAlpha = (1-k) * 0.9;
      const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r*(0.3+k));
      grd.addColorStop(0, 'rgba(255,240,180,1)');
      grd.addColorStop(0.4, 'rgba(255,150,50,0.8)');
      grd.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r*(0.3+k), 0, 7);
      ctx.fill();
    }
    else if(e.type === 'super'){
      // 光柱
      ctx.globalAlpha = 1 - k;
      const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r*(0.2+k*1.2));
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(0.15, 'rgba(180,240,255,1)');
      grd.addColorStop(0.5, 'rgba(80,180,255,0.7)');
      grd.addColorStop(1, 'rgba(40,100,200,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r*(0.2+k*1.2), 0, 7);
      ctx.fill();

      // 衝擊環
      ctx.strokeStyle = `rgba(220,245,255,${(1-k)*0.9})`;
      ctx.lineWidth = 4 * (1-k) + 1;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r*(0.3+k*1.3), 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/* --- 建造預覽 --- */
function drawPreview(){
  if(G.superAim){
    if(mouse.gx < 0 || mouse.gx >= COLS || mouse.gy < 0 || mouse.gy >= ROWS) return;
    const R = SUPER.radius;
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#8ef0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.gx*TX+TX/2, mouse.gy*TY+TY/2, R*TX, 0, 7);
    ctx.stroke();
    ctx.fillStyle = 'rgba(80,200,255,0.12)';
    ctx.beginPath();
    ctx.arc(mouse.gx*TX+TX/2, mouse.gy*TY+TY/2, R*TX, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  if(!G.selectedBuild) return;
  if(mouse.gx < 0 || mouse.gx >= COLS || mouse.gy < 0 || mouse.gy >= ROWS) return;

  const def = DEFS[G.selectedBuild];
  if(!def) return;

  const ok = canPlace(def, mouse.gx, mouse.gy) && G.materials >= def.cost;
  const sx = mouse.gx*TX, sy = mouse.gy*TY;
  const sw = def.size*TX, sh = def.size*TY;

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = ok ? def.color : '#ff5555';
  ctx.fillRect(sx+2, sy+2, sw-4, sh-4);

  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = ok ? '#8ef0ff' : '#ff5555';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx+1, sy+1, sw-2, sh-2);

  // 顯示阻擋值
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(bname(G.selectedBuild), sx+sw/2, sy+sh/2-2);
  ctx.textAlign = 'left';
}
