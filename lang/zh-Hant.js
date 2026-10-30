// 繁體中文 strings for 海嘯：最後防線 / Tsunami: Last Line of Defense.
// The factory receives game constants so strings can quote live values.
(window.TSUNAMI_LANGS = window.TSUNAMI_LANGS || {})['zh-Hant'] =
({ SUPER, WAVES, BASE_INCOME, MAX_TRUCKS, LOSE_DEPTH }) => ({
  langName: '繁體中文',
  title: '海嘯：最後防線 · 半3D版',
  names: { sandbag:'沙包', tree:'防護林', wall:'石牆', dike:'堤壩', mg:'機槍塔', rocket:'火箭炮塔',
    frost:'冷凍光線塔', dump:'垃圾場', power:'發電廠', recycle:'回收站', tech:'科技中心',
    superbase:'超級武器基地', super:'軌道離子炮' },
  role: {
    sandbag:  '便宜的擋水牆，適合快速封住缺口。',
    tree:     '中等擋水，比沙包耐打。',
    wall:     '高血量擋水牆。',
    dike:     '血量最高，適合補在最多水衝擊的位置。',
    mg:       '高射速，每發清走射程內最深一格的水。',
    rocket:   '範圍爆炸，清走目標周圍多格的水。',
    frost:    '持續光束：清水並凍結水格，凍結的水不會流動。',
    dump:     '準備階段每 14 秒生產一輛垃圾車，自動撿物資箱（最多 5 輛）。需電力充足。',
    power:    '提供電力。',
    recycle:  '準備階段每秒 +2 材料（電力不足時減半）。',
    tech:     '解鎖超級武器基地。',
    superbase:'解鎖軌道離子炮。',
  },
  menuH1: '海 嘯', menuH2: '最 後 防 線 · 半 3 D 版',
  menuP: () => `巨浪將至。<span class="hi">準備階段</span>收集物資、建造設施與防線。<br>
    水會沿地面流動，<span class="hi">遇到障礙物會向斜前方漫流</span>——小心被繞過防線！<br>
    <span class="hi">牆</span>擋水，<span class="hi">機槍塔 / 火箭炮塔 / 冷凍光線塔</span>清水。<br>
    <span class="hi">科技中心</span>解鎖<span class="hi">超級武器基地</span>，建成後可發射軌道離子炮（CD ${SUPER.cd} 秒）。<br>
    撐過 ${WAVES.length} 波海嘯即勝利。`,
  start: '開 始 遊 戲', again: '再 玩 一 次', retry: '重 新 挑 戰',
  pickLang: '選擇語言 · Choose language', changeLang: 'Language / 語言',
  winH1: '守 住 了', winH2: '村 莊 平 安',
  winP: m => `${WAVES.length} 波海嘯全部擋下，你的家完好無損。<br>剩餘材料：<span class="hi">${m}</span>`,
  loseH1: '家 園 已 毀', loseH2: '海 嘯 吞 沒 了 一 切',
  loseP: w => `在第 <span class="warn">${w}</span> 波倒下。<br>試著用塔的射程覆蓋缺口，並注意水會繞過障礙物。`,
  wave: (n, total) => `第 ${n} / ${total} 波`,
  phasePrep: '準備階段', phaseTsunami: '⚠ 海嘯來襲', phaseDrain: '海水退去…',
  tWaveIncoming: n => `⚠ 第 ${n} 波海嘯來襲！`,
  tNextWave: (n, s) => `第 ${n} 波即將來臨 — 準備時間 ${s} 秒`,
  tNoMats: '材料不足', tCantBuild: '這裡無法建造', tMats: n => `+${n} 材料`,
  tSuperLocked: '尚未解鎖超級武器', tCooldown: s => `冷卻中 ${s}s`,
  tNeedTech: '需要先建造科技中心', tNeedSuper: '需要先建造科技中心與超級武器基地',
  tSuperFire: '⚡ 軌道離子炮發射！',
  paused: '暫 停', pausedHint: '按 P / Space 或 ▶ 繼續',
  home: '🏠 我的家',
  superBtn: () => `半徑 ${SUPER.radius} · CD ${SUPER.cd}s`,
  cost: '成本', hp: '血量', size2: '佔地 2×2', supply: '供電', use: '耗電',
  frostStats: d => `射程 ${d.range} · 每秒清水 ${d.dmg}`,
  towerStats: d => `射程 ${d.range} · 每發清水 ${d.dmg} · 冷卻 ${d.cd}s`,
  hotkey: k => `快捷鍵 ${k}`,
  tipMats: m => `<span class="t">🪵 材料 ${m}</span>用來建造。<br>
    準備階段每秒 +<b>${BASE_INCOME}</b>，每座回收站再 +2。<br>點擊物資箱 +10–17。`,
  tipPower: p => `<span class="t">⚡ 電力 耗電 ${p.cons} / 供電 ${p.prod}</span>
    ${p.ok ? '電力充足。' : '<b>電力不足！</b>'}<br>
    不足時回收站收益減半、垃圾場停止生產垃圾車。塔不受影響。`,
  tipTrucks: n => `<span class="t">🚛 垃圾車 ${n} / ${MAX_TRUCKS}</span>由垃圾場在準備階段生產，自動撿物資箱。`,
  tipPhase: `<span class="t">波次流程</span>準備：建造、撿物資箱。<br>
    海嘯：右側注水，之後積水慢慢滲退；水清得快，波次就早完結。<br>退水：海水退去，進入下一波。`,
  tipWave: (n, w) => `<span class="t">第 ${n} / ${WAVES.length} 波</span>
    注水時長 ×${w.energy} · 水流速度 ×${w.speed} · 準備 ${w.prep}s`,
  tipSuper: () => `<span class="t">🛰️ 軌道離子炮</span>清空半徑 ${SUPER.radius} 內的水並短暫凍結。<br>
    冷卻 ${SUPER.cd}s · 需要科技中心與超級武器基地 · 快捷鍵 R`,
  tipPause: p => p ? '繼續（P / Space）' : '暫停（P / Space）',
  tipBox: s => `<span class="t">📦 物資箱</span>點擊 +10–17 材料 · ${s} 秒後消失`,
  tipHome: h => `<span class="t">🏠 我的家</span>水深 <b>${h}</b>，超過 ${LOSE_DEPTH} 即失敗。`,
  tipWater: (h, frozen) => `<span class="t">🌊 水深 ${h}</span>${frozen ? '已凍結，不會流動。' : ''}`,
});
