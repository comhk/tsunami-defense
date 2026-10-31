"use strict";
/* ══════════════ 水體模擬 ══════════════ */
function updateWater(dt){
  // 海嘯階段：湧浪期間從右側注入；強度 > 1 的湧浪提高注水上限（最多至滿水深）
  G.pulseIdx = G.phase === 'tsunami' ? pulseIndexAt(WAVES[G.wave], G.waveProgress) : -1;
  const pulse = G.pulseIdx >= 0 ? WAVES[G.wave].pulses[G.pulseIdx] : null;
  if(pulse){
    // 以 60fps 為基準按 dt 縮放，令注水量不受幀率影響
    // 每列強度 = 湧浪強度 × 海灣倍率；同時決定注水速度與上限
    const bay = G.bays[G.wave];
    for(let y=0;y<ROWS;y++){
      const power = pulse.power * bay[y];
      const injectRate = 0.55 * G.waveSpeed * power * dt * 60;
      // 注水上限：強度 ≤ 1 為 92%，之後平滑上升（1.1→94%、1.3→98%、1.4 起滿水深）
      const cap = WATER_MAX * (power <= 1 ? 0.92 : Math.min(1, 0.92 + (power - 1) * 0.2));
      const i = idx(COLS-1, y);
      if(G.water[i] < cap){
        G.water[i] = Math.min(cap, G.water[i] + injectRate);
      }
    }
  }
  if(G.phase === 'tsunami'){
    const p0 = G.waveProgress;
    G.waveProgress += dt * G.waveSpeed;
    surgeCues(WAVES[G.wave], p0, G.waveProgress);
    // 滲水：湧浪之間及最後一道湧浪後，積水緩慢消退
    if(!pulse) decayWater(SEEP_KEEP, dt);
  }
  // 退水
  if(G.phase === 'drain') decayWater(DRAIN_KEEP, dt);
  // 冰凍計時
  for(let i=0;i<G.freeze.length;i++){
    if(G.freeze[i] > 0) G.freeze[i] = Math.max(0, G.freeze[i]-dt);
  }
  // 流動步進
  G.flowTimer += dt;
  while(G.flowTimer >= FLOW_INTERVAL){
    G.flowTimer -= FLOW_INTERVAL;
    flowStep();
  }
}

// 每秒保留 keep 比例的水；凍結格不變
function decayWater(keep, dt){
  const k = Math.pow(keep, dt);
  for(let i=0;i<G.water.length;i++){
    if(G.freeze[i] > 0) continue;
    G.water[i] *= k;
    if(G.water[i] < WATER_EPS) G.water[i] = 0;
  }
}

function flowStep(){
  const nw = new Float32Array(G.water.length);
  nw.set(G.water);

  // 左邊界：水流出地圖
  for(let y=0;y<ROWS;y++){
    const i = idx(0,y);
    if(G.freeze[i] > 0) continue;
    nw[i] -= G.water[i] * FLOW_RATE;
  }

  for(let x=COLS-1;x>=1;x--){
    for(let y=0;y<ROWS;y++){
      const i = idx(x,y);
      if(G.freeze[i] > 0) continue;
      const h = G.water[i];
      if(h < 0.02) continue;

      const transfer = h * FLOW_RATE;
      if(transfer < 0.004) continue;

      const left = G.grid[x-1][y];
      const leftI = idx(x-1,y);

      if(!left && G.freeze[leftI] <= 0){
        // 暢通 → 向左流
        const space = WATER_MAX - G.water[leftI];
        const amt = Math.min(transfer, space);
        if(amt > 0){
          nw[leftI] += amt;
          nw[i] -= amt;
        }
      } else if(left){
        // 撞擊障礙 → 損傷 + 側向漫流
        // 海嘯期間，該列的海灣倍率放大或減少傷害
        const rowMul = G.phase === 'tsunami' ? G.bays[G.wave][y] : 1;
        left.hp -= h * 1.6 * rowMul;
        if(left.hp <= 0) destroyEntity(left);

        let remaining = transfer;
        for(const dy of [-1,1]){
          const ny = y + dy;
          if(ny < 0 || ny >= ROWS) continue;
          if(G.grid[x-1][ny]) continue;
          const ni = idx(x-1, ny);
          if(G.freeze[ni] > 0) continue;
          const space = WATER_MAX - G.water[ni];
          const amt = Math.min(remaining * 0.55, space);
          if(amt > 0){
            nw[ni] += amt;
            nw[i] -= amt;
            remaining -= amt;
          }
        }
      }
    }
  }
  G.water = nw;
}
