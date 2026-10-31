"use strict";
/* ══════════════ 提示 ══════════════ */
// 供電為正、耗電為負
function powerOf(id){
  const d = DEFS[id];
  if(d.power) return d.power;
  if(d.tower) return -3;
  if(d.producer || d.income) return -5;
  if(id === 'tech') return -10;
  if(id === 'superbase') return -15;
  return 0;
}

function defTip(id, ent){
  const d = DEFS[id], pw = powerOf(id), T = L();
  const hp = ent ? `${Math.ceil(ent.hp)} / ${ent.maxHp}` : d.hp;
  const st = [`${T.cost} <b>${d.cost}</b>`, `${T.hp} <b>${hp}</b>`];
  if(d.size === 2) st.push(T.size2);
  if(pw > 0) st.push(`${T.supply} <b>+${pw}</b>`);
  else if(pw < 0) st.push(`${T.use} <b>${-pw}</b>`);
  const lines = [`<span class="t">${bname(id)}</span>${T.role[id]}`, st.join(' · ')];
  if(d.tower === 'frost') lines.push(T.frostStats(d));
  else if(d.tower) lines.push(T.towerStats(d));
  if(!ent && d.key) lines.push(T.hotkey(d.key));
  return lines.join('<br>');
}

function tipFor(key){
  if(key.startsWith('b:')) return defTip(key.slice(2));
  const T = L(), w = WAVES[Math.min(G.wave, WAVES.length-1)];
  switch(key){
    case 'mats':   return T.tipMats(Math.floor(G.materials));
    case 'power':  return T.tipPower(G.power);
    case 'trucks': return T.tipTrucks(G.trucks.length);
    case 'phase':  return T.tipPhase;
    case 'wave':   return T.tipWave(Math.min(G.wave+1, WAVES.length), w);
    case 'super':  return T.tipSuper();
    case 'pause':  return T.tipPause(G.paused);
  }
  return '';
}

// 預警：有浮標時，準備階段顯示下一波，海嘯與退水顯示當前波（G.wave 兩者皆指向該波）
function forecast(){
  if(!G.buoy || G.wave >= WAVES.length) return null;
  // 準備階段尚未修正時顯示早期（低估）預警；之後與之後才建的浮標都顯示真實值
  const w = G.wave, early = G.phase === 'prep' && !G.revised ? G.earlyForecast[w] : {};
  const prof = G.bays[w].map((m, y) => early[y] != null ? early[y] : m);
  return { wave: w, rows: prof.map(m => ({
    mult: m, level: levelOf(m), surges: WAVES[w].pulses.map(p => p.power) })) };
}
function markerTip(y){
  const f = forecast();
  if(!f || y < 0 || y >= ROWS) return '';
  const r = f.rows[y];
  return L().tipMarker(r.level, r.mult, r.surges);
}
// 滑鼠停在 (gx, gy) 的提示：標記隨時可看；其他地圖提示只在暫停時
function hoverTip(gx, gy){
  if(G.buoy && gx === COLS-1 && !(G.paused && (G.grid[gx][gy] || buoyAt(gx, gy)))){
    const t = markerTip(gy);
    if(t) return t;
  }
  return G.paused ? worldTip(gx, gy) : '';
}

// 地圖上的提示（只在暫停時顯示）
function worldTip(gx, gy){
  if(gx<0 || gx>=COLS || gy<0 || gy>=ROWS) return '';
  const ent = G.grid[gx][gy] || buoyAt(gx, gy);
  if(ent) return defTip(ent.defId, ent);
  const box = G.boxes.find(b => b.x === gx && b.y === gy);
  if(box) return L().tipBox(Math.ceil(box.life));
  const h = G.water[idx(gx,gy)];
  if(inHome(gx,gy)) return L().tipHome(h.toFixed(2));
  if(h > 0.02) return L().tipWater(h.toFixed(2), G.freeze[idx(gx,gy)] > 0);
  return '';
}

const tipEl = document.getElementById('tip');
function showTip(html, x, y){
  tipEl.innerHTML = html;
  tipEl.style.display = 'block';
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  tipEl.style.left = Math.max(4, Math.min(x + 14, 960 - w - 4)) + 'px';
  tipEl.style.top = (y + 14 + h > 516 ? y - h - 10 : y + 14) + 'px';
}
function hideTip(){ tipEl.style.display = 'none'; }

app.addEventListener('pointermove', e => {
  const r = app.getBoundingClientRect(), s = r.width / 960;
  const x = (e.clientX - r.left) / s, y = (e.clientY - r.top) / s;
  const t = e.target.closest('[data-tip]');
  const html = t ? tipFor(t.dataset.tip)
    : e.target === canvas ? hoverTip(mouse.gx, mouse.gy) : '';
  if(html) showTip(html, x, y); else hideTip();
});
app.addEventListener('pointerleave', hideTip);
