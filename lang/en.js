// English strings for 海嘯：最後防線 / Tsunami: Last Line of Defense.
// The factory receives game constants so strings can quote live values.
(window.TSUNAMI_LANGS = window.TSUNAMI_LANGS || {})['en'] =
({ SUPER, WAVES, BASE_INCOME, MAX_TRUCKS, LOSE_DEPTH }) => ({
  langName: 'English',
  title: 'Tsunami: Last Line of Defense',
  names: { sandbag:'Sandbag', tree:'Tree Belt', wall:'Stone Wall', dike:'Dike', mg:'Machine Gun',
    rocket:'Rocket', frost:'Freeze Ray', dump:'Dump', power:'Power Plant', recycle:'Recycler',
    tech:'Tech Center', superbase:'Super Base', buoy:'Warning Buoy', super:'Orbital Ion Cannon' },
  role: {
    sandbag:  'Cheap water barrier. Good for plugging gaps fast.',
    tree:     'Medium barrier, tougher than a sandbag.',
    wall:     'High-HP water barrier.',
    dike:     'Highest HP. Place it where the water hits hardest.',
    mg:       'Fast fire. Each shot clears the deepest water tile in range.',
    rocket:   'Area blast. Clears water on several tiles around the target.',
    frost:    'Constant beam: clears water and freezes the tile. Frozen water does not flow.',
    dump:     'Makes a garbage truck every 14 s during prep (max 5). Trucks pick up boxes. Needs enough power.',
    power:    'Supplies power.',
    recycle:  '+2 materials per second during prep (halved when power is short).',
    tech:     'Unlocks the Super Base.',
    superbase:'Unlocks the Orbital Ion Cannon.',
    buoy:     'Beach only, one per game. Water passes through it and never harms it. Shows each row\'s expected strength at the sea edge.',
  },
  menuH1: 'TSUNAMI', menuH2: 'LAST LINE OF DEFENSE',
  menuP: () => `A giant wave is coming. In the <span class="hi">prep phase</span>, collect supplies and build defences.<br>
    Water flows over the ground and <span class="hi">spills diagonally around obstacles</span>. Watch for gaps!<br>
    <span class="hi">Walls</span> hold water back; <span class="hi">Machine Guns, Rockets and Freeze Rays</span> clear it.<br>
    The <span class="hi">Tech Center</span> unlocks the <span class="hi">Super Base</span>, which fires the Orbital Ion Cannon (${SUPER.cd} s cooldown).<br>
    Survive ${WAVES.length} waves to win.`,
  start: 'START GAME', again: 'PLAY AGAIN', retry: 'TRY AGAIN',
  pickLang: '選擇語言 · Choose language', changeLang: 'Language / 語言',
  winH1: 'YOU HELD', winH2: 'THE VILLAGE IS SAFE',
  winP: m => `All ${WAVES.length} waves stopped. Your home is untouched.<br>Materials left: <span class="hi">${m}</span>`,
  loseH1: 'HOME LOST', loseH2: 'THE TSUNAMI TOOK IT ALL',
  loseP: w => `Fell on wave <span class="warn">${w}</span>.<br>Cover gaps with tower range, and watch for water flowing around obstacles.`,
  wave: (n, total) => `Wave ${n} / ${total}`,
  phasePrep: 'Prep', phaseTsunami: '⚠ Tsunami!', phaseDrain: 'Water receding…',
  phaseSurge: (n, total) => `⚠ Surge ${n} / ${total}`, phaseNextSurge: 'Next surge',
  tWaveIncoming: n => `⚠ Wave ${n} incoming!`,
  tSurgeWarn: (n, s) => `⚠ Surge ${n} in ${s} s!`,
  tNextWave: (n, s) => `Wave ${n} is coming — ${s} s to prepare`,
  tNoMats: 'Not enough materials', tCantBuild: "Can't build here", tMats: n => `+${n} materials`,
  tSuperLocked: 'Super weapon not unlocked', tCooldown: s => `Cooling down ${s}s`,
  tNeedTech: 'Build a Tech Center first', tNeedSuper: 'Build a Tech Center and a Super Base first',
  tSuperFire: '⚡ Ion cannon fired!',
  paused: 'PAUSED', pausedHint: 'Press P / Space or ▶ to resume',
  home: '🏠 Home',
  superBtn: () => `Radius ${SUPER.radius} · CD ${SUPER.cd}s`,
  cost: 'Cost', hp: 'HP', size2: 'Size 2×2', supply: 'Power', use: 'Uses',
  frostStats: d => `Range ${d.range} · Clears ${d.dmg}/s`,
  towerStats: d => `Range ${d.range} · Clears ${d.dmg}/shot · Cooldown ${d.cd}s`,
  hotkey: k => `Hotkey ${k}`,
  tipMats: m => `<span class="t">🪵 Materials ${m}</span>Used for building.<br>
    +<b>${BASE_INCOME}</b>/s during prep, +2 more per Recycler.<br>Click a supply box for +10–17.`,
  tipPower: p => `<span class="t">⚡ Power used ${p.cons} / supply ${p.prod}</span>
    ${p.ok ? 'Power is enough.' : '<b>Not enough power!</b>'}<br>
    When short, Recyclers earn half and Dumps stop making trucks. Towers are not affected.`,
  tipTrucks: n => `<span class="t">🚛 Trucks ${n} / ${MAX_TRUCKS}</span>Made by Dumps during prep. They pick up supply boxes.`,
  tipPhase: `<span class="t">How a wave works</span>Prep: build and collect boxes.<br>
    Tsunami: water pours in from the right in several surges, with short gaps between. The first is often not the biggest.<br>
    After the last surge the water slowly seeps away. Clear it fast to end the wave early.<br>Receding: the water drains, then the next wave starts.`,
  // Biggest surge = highest dur * power (1-based).
  tipWave: (n, w, big = w.pulses.reduce((b, s, k, a) => s.dur * s.power > a[b].dur * a[b].power ? k : b, 0) + 1) => `<span class="t">Wave ${n} / ${WAVES.length}</span>
    ${w.pulses.length === 1 ? '1 surge' : `${w.pulses.length} surges · biggest: #${big}`} · Flow speed ×${w.speed} · Prep ${w.prep}s`,
  tipSuper: () => `<span class="t">🛰️ Orbital Ion Cannon</span>Clears all water within radius ${SUPER.radius} and briefly freezes it.<br>
    Cooldown ${SUPER.cd}s · Needs a Tech Center and a Super Base · Hotkey R`,
  levels: { low:'Low', medium:'Medium', high:'High' },
  tipMarker: (level, m, surges) => `<span class="t">🌊 Forecast: ${({ low:'Low', medium:'Medium', high:'High' })[level]} ×${m.toFixed(1)}</span>
    Surges: ${surges.map(s => '×' + s.toFixed(1)).join(' · ')}<br>High rows wear structures down faster.`,
  tipPause: p => p ? 'Resume (P / Space)' : 'Pause (P / Space)',
  tipBox: s => `<span class="t">📦 Supply box</span>Click for +10–17 materials · disappears in ${s} s`,
  tipHome: h => `<span class="t">🏠 Home</span>Water depth <b>${h}</b>. Above ${LOSE_DEPTH} you lose.`,
  tipWater: (h, frozen) => `<span class="t">🌊 Water depth ${h}</span>${frozen ? 'Frozen: it does not flow.' : ''}`,
});
