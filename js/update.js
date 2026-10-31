"use strict";
/* ══════════════ 主更新 ══════════════ */
function update(dt){
  if(G.reviseFlash > 0) G.reviseFlash = Math.max(0, G.reviseFlash - dt);
  G.time += dt;
  if(G.shake > 0) G.shake = Math.max(0, G.shake - dt*40);
  if(G.superCD > 0) G.superCD = Math.max(0, G.superCD - dt);

  // 粒子
  for(let i=G.particles.length-1;i>=0;i--){
    const p = G.particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.vy += 320*dt;
    p.life -= dt;
    if(p.life <= 0) G.particles.splice(i,1);
  }
  // 特效
  for(let i=G.effects.length-1;i>=0;i--){
    const e = G.effects[i];
    e.t += dt;
    if(e.t > e.dur) G.effects.splice(i,1);
  }
  // 建築脈動
  for(const s of G.structures) if(s.pulse > 0) s.pulse = Math.max(0, s.pulse - dt);

  // 電力
  calcPower();

  updateWater(dt);
  updateTowers(dt);
  updateTrucks(dt);

  // 階段邏輯
  if(G.phase === 'prep'){
    G.timer -= dt;
    G.incomeAcc += dt;
    while(G.incomeAcc >= 1){
      G.incomeAcc -= 1;
      let inc = BASE_INCOME;
      for(const s of G.structures){
        if(s.def.income) inc += s.def.income * (G.power.ok ? 1 : 0.5);
      }
      G.materials += inc;
    }

    G.boxTimer += dt;
    if(G.boxTimer > 1.2){ G.boxTimer = 0; spawnBox(); }
    for(let i=G.boxes.length-1;i>=0;i--){
      G.boxes[i].life -= dt;
      if(G.boxes[i].life <= 0) G.boxes.splice(i,1);
    }

    if(G.wave >= 1 && !G.revised && G.timer <= REVISE_AT) reviseForecast();
    if(G.timer <= 0) startWave();
  }
  else if(G.phase === 'tsunami'){
    // 檢查家前水深
    let homeDanger = 0;
    for(let x=HOME.x; x<HOME.x+HOME.w; x++){
      for(let y=HOME.y; y<HOME.y+HOME.h; y++){
        homeDanger = Math.max(homeDanger, G.water[idx(x,y)]);
      }
    }
    if(homeDanger > LOSE_DEPTH && !(TEST && TEST.noLose)){
      G.phase = 'lose';
      G.shake = 30;
      setTimeout(()=>endGame(false), 800);
      return;
    }

    // 判斷波次結束：水源結束且水退去，或超時
    const totalWater = G.water.reduce((a,b)=>a+b, 0);
    if(G.waveProgress > G.inflowEnd && (totalWater < 3 || G.waveProgress > G.inflowEnd + TSUNAMI_MAX)){
      G.phase = 'drain';
      G.drainT = 0;
    }
  }
  else if(G.phase === 'drain'){
    G.drainT = (G.drainT || 0) + dt;
    const totalWater = G.water.reduce((a,b)=>a+b, 0);
    if(totalWater < 0.6 || G.drainT > 6){
      G.wave++;
      if(G.wave >= WAVES.length){
        G.phase = 'win';
        setTimeout(()=>endGame(true), 500);
      } else {
        G.phase = 'prep';
        G.timer = WAVES[G.wave].prep;
        G.revised = false; G.raisedRows = [];
        G.boxTimer = 0;
        G.water.fill(0);
        G.freeze.fill(0);
        toast(L().tNextWave(G.wave+1, WAVES[G.wave].prep), true);
      }
    }
  }

  updateUI();
}

function calcPower(){
  let prod = 0, cons = 0;
  for(const s of G.structures){
    const p = powerOf(s.defId);
    if(p > 0) prod += p; else cons -= p;
  }
  G.power.prod = prod;
  G.power.cons = cons;
  G.power.ok = cons <= prod;
}
