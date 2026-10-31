"use strict";
/* ══════════════ UI 更新 ══════════════ */
function buildUI(){
  const buildsEl = document.getElementById('builds');
  buildsEl.innerHTML = '';
  for(const id in DEFS){
    const d = DEFS[id];
    const el = document.createElement('div');
    el.className = 'btn';
    el.dataset.id = id;
    el.dataset.tip = 'b:' + id;
    const extra = [];
    if(d.size === 2) extra.push('2×2');
    const pw = powerOf(id);
    if(pw > 0) extra.push(`+${pw}⚡`);
    else if(pw < 0) extra.push(`⚡${-pw}`);
    el.innerHTML = `<span class="key">${d.key || ''}</span>
      <span class="nm">${bname(id)}</span>
      <span class="cost">🪵${d.cost} ${extra.join(' ')}</span>`;
    el.onclick = () => {
      if(G.paused) return;
      if(id === 'superbase' && !G.techUnlocked){ toast(L().tNeedTech, true); return; }
      G.selectedBuild = G.selectedBuild === id ? null : id;
      G.superAim = false;
      updateUI();
    };
    buildsEl.appendChild(el);
  }

  const skillsEl = document.getElementById('skills');
  skillsEl.innerHTML = '';
  const su = document.createElement('div');
  su.className = 'btn';
  su.dataset.id = 'super';
  su.dataset.tip = 'super';
  su.style.width = '228px';
  su.innerHTML = `<span class="key">R</span>
    <span class="nm">🛰️ ${bname('super')}</span>
    <span class="cost">${L().superBtn()}</span>
    <div class="cdmask" style="display:none"></div>`;
  su.onclick = () => {
    if(G.paused) return;
    if(!G.superUnlocked){ toast(L().tNeedSuper, true); return; }
    if(G.superCD > 0){ toast(L().tCooldown(Math.ceil(G.superCD)), true); return; }
    G.superAim = !G.superAim;
    G.selectedBuild = null;
    updateUI();
  };
  skillsEl.appendChild(su);
}

function updateUI(){
  document.getElementById('mats').textContent = Math.floor(G.materials);
  document.getElementById('powerTxt').textContent = `${G.power.cons}/${G.power.prod}`;
  const pp = document.getElementById('powerPill');
  pp.style.borderColor = G.power.ok ? 'rgba(90,170,230,.35)' : '#ff6b6b';

  document.getElementById('unitTxt').textContent = `${G.trucks.length}/${MAX_TRUCKS}`;
  document.getElementById('waveTxt').textContent =
    L().wave(Math.min(G.wave+1, WAVES.length), WAVES.length);

  const phasePill = document.getElementById('phasePill');
  const phaseTxt = document.getElementById('phaseTxt');
  const timerTxt = document.getElementById('timerTxt');

  if(G.phase === 'prep'){
    phaseTxt.textContent = L().phasePrep;
    phasePill.classList.remove('danger');
    timerTxt.textContent = Math.ceil(Math.max(0,G.timer)) + 's';
  } else if(G.phase === 'tsunami'){
    // 湧浪中顯示「湧浪 n / N」；間隔中倒數到下一道湧浪（實際秒數）；最後一道湧浪後沿用海嘯標籤
    const w = WAVES[G.wave];
    // 沿用本幀注水所用的湧浪索引，HUD 與注水不會相差一幀
    const k = G.pulseIdx;
    const next = k >= 0 ? -1 : w.pulses.findIndex(s => s.at + s.dur > G.waveProgress);
    phasePill.classList.add('danger');
    if(k >= 0){
      phaseTxt.textContent = L().phaseSurge(k+1, w.pulses.length);
      timerTxt.textContent = '——';
    } else if(next >= 0){
      phaseTxt.textContent = L().phaseNextSurge;
      timerTxt.textContent = Math.max(0, Math.ceil((w.pulses[next].at - G.waveProgress) / G.waveSpeed)) + 's';
    } else {
      phaseTxt.textContent = L().phaseTsunami;
      timerTxt.textContent = '——';
    }
  } else if(G.phase === 'drain'){
    phaseTxt.textContent = L().phaseDrain;
    phasePill.classList.remove('danger');
    timerTxt.textContent = '——';
  }

  // 建造按鈕
  document.querySelectorAll('#builds .btn').forEach(el => {
    const id = el.dataset.id;
    const def = DEFS[id];
    const locked = G.materials < def.cost ||
      (id === 'superbase' && !G.techUnlocked);
    el.classList.toggle('sel', G.selectedBuild === id);
    el.classList.toggle('locked', locked);
  });

  // 超級武器按鈕
  const su = document.querySelector('#skills .btn');
  if(su){
    const mask = su.querySelector('.cdmask');
    su.classList.toggle('sel', G.superAim);
    su.classList.toggle('locked', !G.superUnlocked || G.superCD > 0);
    if(G.superCD > 0){
      mask.style.display = 'flex';
      mask.textContent = Math.ceil(G.superCD);
    } else {
      mask.style.display = 'none';
    }
  }
}
