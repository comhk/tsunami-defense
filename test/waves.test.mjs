// Headless tests for the wave/water simulation.
// Run: node test/waves.test.mjs   (no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { loadGame, playAllWaves, watchInflow, DT } from './harness.mjs';

// "Before" baseline: total water poured in per wave with no structures,
// recorded from the single-pulse waves (energy multiplier) by ticket 01.
// Wave-train work must keep each wave within ±15% of these.
// Measured at DT = 1/60. Inflow is now scaled by dt * 60, so 1/60 gives the same totals.
// Peak home depth at that time was 0.903 for every wave (info only).
const BASELINE_INFLOW = [870.7, 1260.1, 1657.3, 1983.5, 2325.2];
const TOLERANCE = 0.15;

test('the test hook exists only when the test flag is set', () => {
  assert.equal(loadGame({ testFlag: false }).window.__tsunami, undefined);
  const game = loadGame();
  assert.equal(typeof game.hook.update, 'function');
  assert.equal(game.hook.G.phase, 'menu');
});

// Bay seeds the balance check runs across (warning-buoy ticket 01).
const BALANCE_SEEDS = [1, 2, 3, 4, 5, 42, 1234];

test('balance: total inflow per wave with no structures stays within ±15% of baseline, across bay seeds', () => {
  console.log('# seed  wave  inflow   peak home depth (info only)');
  for(const seed of BALANCE_SEEDS){
    const game = loadGame({ noLose: true });
    game.hook.setSeed(seed);
    const rows = playAllWaves(game);
    for(const r of rows)
      console.log(`# ${String(seed).padStart(4)}   ${r.wave}   ${r.inflow.toFixed(1).padStart(7)}   ${r.peakHome.toFixed(3)}`);
    rows.forEach((r, i) => {
      const base = BASELINE_INFLOW[i];
      assert.ok(Math.abs(r.inflow - base) <= TOLERANCE * base,
        `seed ${seed} wave ${r.wave}: inflow ${r.inflow.toFixed(1)} is outside ±${TOLERANCE * 100}% of baseline ${base}`);
    });
  }
});

test('inflow per wave does not depend on the frame rate', () => {
  const at = dt => playAllWaves(loadGame({ noLose: true }), { dt }).map(r => r.inflow);
  const ref = at(1 / 60);
  for(const dt of [1 / 30, 1 / 144]){
    at(dt).forEach((v, i) => assert.ok(Math.abs(v - ref[i]) <= 0.05 * ref[i],
      `wave ${i + 1}: inflow ${v.toFixed(1)} at dt=1/${Math.round(1 / dt)} vs ${ref[i].toFixed(1)} at 1/60`));
  }
});

// When towers keep the right edge low, inflow is limited by the inflow rate
// rather than the edge cap, so this is where a per-frame rate would show.
test('inflow per surge does not depend on the frame rate when the map is kept dry', () => {
  const drained = (n, dt) => {
    const game = startWaveN(n);
    const { hook, G } = game;
    const inflow = watchInflow(G);
    for(let i = 0; i < 600 / dt && G.phase === 'tsunami'; i++){ G.water.fill(0); hook.update(dt); }
    return inflow[n];
  };
  // 1/30 is left out: big surges would hit WATER_MAX in one frame from an empty cell.
  for(let n = 0; n < SURGE_COUNTS.length; n++){
    const ref = drained(n, 1 / 60);
    for(const dt of [1 / 90, 1 / 144]){
      const v = drained(n, dt);
      assert.ok(Math.abs(v - ref) <= 0.05 * ref,
        `wave ${n + 1}: drained inflow ${v.toFixed(1)} at dt=1/${Math.round(1 / dt)} vs ${ref.toFixed(1)} at 1/60`);
    }
  }
});

// ── Surges (ticket 02) ──
// Expected surge counts per wave, from the spec's pattern table.
const SURGE_COUNTS = [1, 2, 3, 3, 3];

// Start wave n (0-based) on a fresh game with no structures.
function startWaveN(n, opts = {}){
  const game = loadGame({ noLose: true, ...opts });
  const { hook, G } = game;
  hook.startGame();
  G.wave = n;
  G.timer = 0;
  hook.update(DT);  // prep -> tsunami
  assert.equal(G.phase, 'tsunami');
  return game;
}

// Step the current wave, recording per frame the wave progress before the
// step and how much water the right-edge inflow added during it.
function stepFrames(game, until){
  const { hook, G } = game;
  const inflow = watchInflow(G);
  const frames = [];
  for(let i = 0; i < 60 * 600 && !until(G); i++){
    const p = G.waveProgress, before = inflow[G.wave] || 0;
    hook.update(DT);
    frames.push({ p, added: (inflow[G.wave] || 0) - before, phase: G.phase });
  }
  return frames;
}

test('each wave has the expected number of surges; wave 1 has exactly one', () => {
  const { hook } = loadGame();
  assert.deepEqual([...hook.WAVES.map(w => w.pulses.length)], SURGE_COUNTS);
  assert.equal(hook.WAVES[0].pulses.length, 1);
});

test('inflow switches on during each surge and off between and after surges', () => {
  for(let n = 0; n < SURGE_COUNTS.length; n++){
    const game = startWaveN(n);
    const pulses = game.hook.WAVES[n].pulses;
    const last = pulses[pulses.length - 1];
    const frames = stepFrames(game, G => G.phase !== 'tsunami');
    const step = game.hook.WAVES[n].speed * DT;
    const inside = p => pulses.some(s => p >= s.at && p < s.at + s.dur);
    const nearEdge = p => pulses.some(s => Math.abs(p - s.at) <= step || Math.abs(p - (s.at + s.dur)) <= step);
    for(const f of frames){
      if(nearEdge(f.p) || inside(f.p)) continue;
      assert.equal(f.added, 0, `wave ${n + 1}: inflow at progress ${f.p.toFixed(2)} outside every surge`);
    }
    for(const s of pulses){
      const got = frames.filter(f => f.p > s.at + step && f.p < s.at + s.dur - step)
        .reduce((a, f) => a + f.added, 0);
      assert.ok(got > 0, `wave ${n + 1}: no inflow during surge at ${s.at}`);
    }
    assert.ok(frames.at(-1).p >= last.at + last.dur, `wave ${n + 1}: left tsunami before its last surge ended`);
  }
});

const lastSurgeEnd = w => Math.max(...w.pulses.map(s => s.at + s.dur));

test('a wave stays in tsunami until its last surge ends, even if all water is removed in a gap', () => {
  for(let n = 1; n < SURGE_COUNTS.length; n++){
    const { hook, G } = startWaveN(n);
    const pulses = hook.WAVES[n].pulses;
    const end = lastSurgeEnd(hook.WAVES[n]);
    // Clear the map every frame from the end of the first surge onwards.
    for(let i = 0; i < 60 * 600 && G.waveProgress < end; i++){
      if(G.waveProgress > pulses[0].at + pulses[0].dur) G.water.fill(0);
      hook.update(DT);
      if(G.waveProgress < end)
        assert.equal(G.phase, 'tsunami', `wave ${n + 1}: left tsunami at progress ${G.waveProgress.toFixed(2)}`);
    }
  }
});

test('after the last surge, a nearly dry map ends the wave early', () => {
  const { hook, G } = startWaveN(4);
  const end = lastSurgeEnd(hook.WAVES[4]);
  for(let i = 0; i < 60 * 600 && G.phase === 'tsunami' && G.waveProgress <= end; i++) hook.update(DT);
  assert.equal(G.phase, 'tsunami');
  G.water.fill(0);
  hook.update(DT);
  assert.equal(G.phase, 'drain');
});

test('after the last surge, the time limit moves the wave to drain', () => {
  const { hook, G } = startWaveN(4);
  const end = lastSurgeEnd(hook.WAVES[4]);
  // Keep plenty of water on the map so only the time limit can end the wave.
  let drainedAt = null;
  for(let i = 0; i < 60 * 600 && G.phase === 'tsunami'; i++){
    for(let k = 0; k < 10; k++) G.water[k] = 1;  // top-left cells, far from home
    hook.update(DT);
    if(G.phase === 'drain') drainedAt = G.waveProgress;
  }
  assert.equal(G.phase, 'drain');
  // The time limit (TSUNAMI_MAX) is 12 wave-progress units after the last surge ends.
  assert.ok(Math.abs(drainedAt - (end + 12)) < 0.1, `drained at progress ${drainedAt}, expected about ${end + 12}`);
});

test('materials do not increase during gaps between surges', () => {
  for(let n = 1; n < SURGE_COUNTS.length; n++){
    const { hook, G } = startWaveN(n);
    const pulses = hook.WAVES[n].pulses;
    let checked = 0;
    for(let i = 0; i < 60 * 600 && G.phase === 'tsunami'; i++){
      const p = G.waveProgress, m = G.materials;
      hook.update(DT);
      const inGap = pulses.some((s, k) => k > 0 && p > pulses[k - 1].at + pulses[k - 1].dur && p < s.at);
      if(inGap){ checked++; assert.ok(G.materials <= m, `wave ${n + 1}: materials rose in a gap`); }
    }
    assert.ok(checked > 0, `wave ${n + 1}: never observed a gap`);
  }
});

// The edge cap only matters when an edge cell is already deep: a surge tops
// the cell up only while it is below the cap. Hold the right edge at a fixed
// depth and check which surge powers still pour water in.
test('the edge cap rises smoothly with surge power: 92% up to power 1, full at 1.4', () => {
  const toppedUp = (power, depth) => {
    const game = startWaveN(0);
    const { hook, G } = game;
    hook.WAVES[0].pulses[0].power = power;  // the wave table is shared by reference
    stepTo(game, 2);
    G.flowTimer = 0;  // no flow step this frame, so the edge keeps its depth until inflow
    for(let y = 0; y < hook.ROWS; y++) G.water[y * hook.COLS + hook.COLS - 1] = depth;
    const inflow = watchInflow(G);  // after the setup writes, so only inflow is counted
    hook.update(DT);
    return (inflow[0] || 0) > 0;
  };
  const MAX = 1.4;  // WATER_MAX
  // [power, edge depth as a fraction of max, expect top-up]
  const cases = [
    [1.0, 0.91, true], [1.0, 0.93, false],
    [0.8, 0.93, false],
    [1.1, 0.93, true], [1.1, 0.95, false],
    [1.3, 0.97, true], [1.3, 0.99, false],
    [1.4, 0.995, true],
  ];
  for(const [power, frac, expect] of cases)
    assert.equal(toppedUp(power, frac * MAX), expect, `power ${power}, edge at ${frac * 100}% of max`);
});

test('a later surge does not cut short a stronger shake already running', () => {
  const game = startWaveN(4);  // wave 5: second surge at 11
  const { hook, G } = game;
  // Stop on the last frame before the surge, so the next update crosses 11.
  for(let i = 0; i < 60 * 600 && G.waveProgress + 1.4 * DT < 11; i++) hook.update(DT);
  assert.ok(G.waveProgress < 11);
  G.shake = 20;
  hook.update(DT);
  assert.ok(G.shake > 8, `shake dropped to ${G.shake} when the surge hit`);
});

// ── HUD surge counter and warnings (ticket 03) ──
const hud = game => ({
  phase: game.document.getElementById('phaseTxt').textContent,
  timer: game.document.getElementById('timerTxt').textContent,
});

// Step the current wave until its progress reaches p (bounded).
function stepTo(game, p){
  const { hook, G } = game;
  for(let i = 0; i < 60 * 600 && G.phase === 'tsunami' && G.waveProgress < p; i++) hook.update(DT);
}

test('HUD shows the surge counter while a surge pours, in both languages', () => {
  const expected = { en: ['⚠ Surge 1 / 3', '⚠ Surge 2 / 3'], 'zh-Hant': ['⚠ 湧浪 1 / 3', '⚠ 湧浪 2 / 3'] };
  for(const lang of ['en', 'zh-Hant']){
    const game = startWaveN(4, { lang });  // wave 5: surges at [0,7] [11,12] [27,9], speed 1.4
    stepTo(game, 3);
    assert.deepEqual(hud(game), { phase: expected[lang][0], timer: '——' });
    stepTo(game, 15);
    assert.deepEqual(hud(game), { phase: expected[lang][1], timer: '——' });
  }
});

test('HUD counts down real seconds to the next surge during a gap, then shows the tsunami label', () => {
  const expected = {
    en: { next: 'Next surge', after: '⚠ Tsunami!' },
    'zh-Hant': { next: '下一道湧浪', after: '⚠ 海嘯來襲' },
  };
  for(const lang of ['en', 'zh-Hant']){
    const game = startWaveN(4, { lang });  // wave 5: gap 7→11 at speed 1.4
    stepTo(game, 7.2);   // (11 - 7.2) / 1.4 ≈ 2.7 s
    assert.deepEqual(hud(game), { phase: expected[lang].next, timer: '3s' });
    stepTo(game, 9.7);   // (11 - 9.7) / 1.4 ≈ 0.9 s
    assert.deepEqual(hud(game), { phase: expected[lang].next, timer: '1s' });
    stepTo(game, 36.5);  // after the last surge (27 + 9)
    assert.deepEqual(hud(game), { phase: expected[lang].after, timer: '——' });
  }
});

test('both language files define the same set of keys', () => {
  const { window, hook } = loadGame();
  const consts = { SUPER: {}, WAVES: hook.WAVES, BASE_INCOME: 0, MAX_TRUCKS: 0, LOSE_DEPTH: 0 };
  const keys = lang => Object.keys(window.TSUNAMI_LANGS[lang](consts)).sort();
  assert.deepEqual(keys('zh-Hant'), keys('en'));
  assert.ok(keys('en').includes('phaseSurge') && keys('en').includes('tSurgeWarn'));
});

// The warning for a later surge fires SURGE_WARN (3) real seconds before it,
// but never while the previous surge is still pouring: if that point falls
// inside the previous surge (wave 5), it fires as soon as the gap begins.
test('a warning toast appears once per later surge, in the gap, alongside the countdown', () => {
  for(let n = 0; n < SURGE_COUNTS.length; n++){
    const game = startWaveN(n);
    const { hook, G } = game;
    const w = hook.WAVES[n];
    const step = w.speed * DT;
    const toastEl = game.document.getElementById('toast');
    const inflow = watchInflow(G);
    const warnings = [];  // { text, p, added, hud } for each new toast during the wave
    let last = toastEl.textContent;
    for(let i = 0; i < 60 * 600 && G.phase === 'tsunami'; i++){
      const p = G.waveProgress, before = inflow[n] || 0;
      hook.update(DT);
      if(toastEl.textContent !== last){
        last = toastEl.textContent;
        warnings.push({ text: last, p, added: (inflow[n] || 0) - before, hud: hud(game) });
      }
    }
    const later = [...w.pulses].slice(1);  // spread: vm arrays are from another realm
    // Every gap in the current patterns is at least 2.86 s long, so every warning says 3 s.
    assert.deepEqual(warnings.map(t => t.text), later.map((_, k) => `⚠ Surge ${k + 2} in 3 s!`),
      `wave ${n + 1}: unexpected toasts`);
    warnings.forEach((t, k) => {
      const prev = w.pulses[k];
      const due = Math.max(later[k].at - 3 * w.speed, prev.at + prev.dur);
      // t.p is the progress at the start of the frame the warning fired in.
      assert.ok(t.p > due - step - 1e-9 && t.p <= due + step + 1e-9,
        `wave ${n + 1}: warning for surge ${k + 2} at progress ${t.p.toFixed(3)}, expected ${due.toFixed(3)}`);
      assert.equal(t.added, 0, `wave ${n + 1}: warning for surge ${k + 2} fired while a surge was pouring`);
      assert.deepEqual(t.hud, { phase: 'Next surge', timer: '3s' }, `wave ${n + 1}: HUD beside warning ${k + 2}`);
    });
  }
});

test('when a gap is shorter than 3 s, the warning shows the seconds actually left', () => {
  const game = loadGame({ noLose: true });
  const { hook, G } = game;
  // Wave 2 (speed 1.1): first surge ends at 7; move the second to 8.5, a 1.36 s gap.
  hook.WAVES[1].pulses[1].at = 8.5;
  hook.startGame();
  G.wave = 1; G.timer = 0;
  hook.update(DT);
  const toastEl = game.document.getElementById('toast');
  const toasts = [];
  for(let i = 0; i < 60 * 600 && G.phase === 'tsunami'; i++){
    const before = toastEl.textContent;
    hook.update(DT);
    if(toastEl.textContent !== before) toasts.push({ text: toastEl.textContent, hud: hud(game) });
  }
  assert.deepEqual(toasts, [{ text: '⚠ Surge 2 in 2 s!', hud: { phase: 'Next surge', timer: '2s' } }]);
});

test('HUD shows surge 1 as soon as a wave starts', () => {
  const game = startWaveN(1);
  assert.deepEqual(hud(game), { phase: '⚠ Surge 1 / 2', timer: '——' });
});

test('surge data: each wave\'s surges are sorted by start and do not overlap; wave 1 has one', () => {
  const { hook } = loadGame();
  assert.equal(hook.WAVES[0].pulses.length, 1);
  hook.WAVES.forEach((w, n) => {
    for(let k = 0; k + 1 < w.pulses.length; k++){
      const a = w.pulses[k], b = w.pulses[k + 1];
      assert.ok(b.at >= a.at + a.dur, `wave ${n + 1}: surge ${k + 2} starts at ${b.at}, before surge ${k + 1} ends at ${a.at + a.dur}`);
    }
  });
});

test('wave tooltip shows the surge count and the biggest surge, in both languages', () => {
  const { window, hook } = loadGame();
  const consts = { SUPER: {}, WAVES: hook.WAVES, BASE_INCOME: 0, MAX_TRUCKS: 0, LOSE_DEPTH: 0 };
  const line = (lang, n) => window.TSUNAMI_LANGS[lang](consts).tipWave(n, hook.WAVES[n - 1]).split('\n')[1].trim();
  // Biggest = highest dur * power. Wave 5: 7, 16.8, 8.1 -> #2. Wave 4: 5.4, 6, 13 -> #3.
  assert.equal(line('en', 1), '1 surge · Flow speed ×1 · Prep 45s');
  assert.equal(line('en', 5), '3 surges · biggest: #2 · Flow speed ×1.4 · Prep 30s');
  assert.equal(line('en', 4), '3 surges · biggest: #3 · Flow speed ×1.3 · Prep 32s');
  assert.equal(line('zh-Hant', 1), '1 道湧浪 · 水流速度 ×1 · 準備 45s');
  assert.equal(line('zh-Hant', 5), '3 道湧浪 · 最大：第 2 道 · 水流速度 ×1.4 · 準備 30s');
});

// ── Bays (warning-buoy ticket 01) ──
// Load a game, set the run seed, start the run, and return every wave's row profile.
function profilesFor(seed){
  const { hook } = loadGame();
  hook.setSeed(seed);
  hook.startGame();
  return Array.from(hook.WAVES, (_, w) => [...hook.rowProfile(w)]);
}

test('bays: the same seed gives the same profiles, different seeds give different ones', () => {
  assert.deepEqual(profilesFor(7), profilesFor(7));
  assert.notDeepEqual(profilesFor(7), profilesFor(8));
});

test('bays: wave 1 is flat; later waves average 1 and stay within the peak and floor', () => {
  const { hook } = loadGame();
  for(const seed of [1, 2, 3, 42, 1234]){
    const profiles = profilesFor(seed);
    assert.ok(profiles[0].every(m => m === 1), `seed ${seed}: wave 1 is not flat`);
    profiles.slice(1).forEach((p, i) => {
      const mean = p.reduce((a, b) => a + b, 0) / p.length;
      assert.equal(p.length, hook.ROWS);
      assert.ok(Math.abs(mean - 1) < 1e-9, `seed ${seed} wave ${i + 2}: mean ${mean}`);
      assert.ok(Math.max(...p) <= hook.BAY_PEAK + 1e-9, `seed ${seed} wave ${i + 2}: peak ${Math.max(...p)}`);
      assert.ok(Math.min(...p) >= hook.BAY_FLOOR - 1e-9, `seed ${seed} wave ${i + 2}: floor ${Math.min(...p)}`);
      assert.ok(Math.max(...p) > 1.2, `seed ${seed} wave ${i + 2}: no visible bay`);
    });
  }
});

test('bays: during a strong surge a high row reaches a higher edge depth than a low row', () => {
  // Wave 5's second surge is the strongest (x1.4); sample the edge midway through it.
  const n = 4;
  const { hook, G } = loadGame({ noLose: true });
  hook.setSeed(42);
  hook.startGame();
  G.wave = n;
  G.timer = 0;
  hook.update(DT);  // prep -> tsunami
  const s = hook.WAVES[n].pulses[1];
  while(G.waveProgress < s.at + s.dur / 2) hook.update(DT);
  const p = hook.rowProfile(n);
  const hi = p.indexOf(Math.max(...p)), lo = p.indexOf(Math.min(...p));
  const edge = y => G.water[y * hook.COLS + hook.COLS - 1];
  assert.ok(edge(hi) > edge(lo) + 0.05,
    `high row ${hi} (x${p[hi].toFixed(2)}) edge ${edge(hi).toFixed(3)} vs low row ${lo} (x${p[lo].toFixed(2)}) edge ${edge(lo).toFixed(3)}`);
});

// ── Row damage (ticket 04) ──
// Start wave n (0-based) with the given bay seed, place walls at column x on
// the given rows, then run `seconds` of the tsunami. Returns HP lost per row.
function wallDamage(n, seed, x, rows, seconds){
  const { hook, G } = loadGame({ noLose: true });
  hook.setSeed(seed);
  hook.startGame();
  G.materials = 1e6;
  for(const y of rows) assert.ok(hook.place('wall', x, y), `place wall at ${x},${y}`);
  G.wave = n;
  G.timer = 0;
  hook.update(DT);  // prep -> tsunami
  assert.equal(G.phase, 'tsunami');
  for(let t = 0; t < seconds; t += DT) hook.update(DT);
  return { lost: rows.map(y => G.grid[x][y] ? G.grid[x][y].maxHp - G.grid[x][y].hp : Infinity), profile: hook.rowProfile(n) };
}

test('row damage: a wall on a high row loses HP faster than one on a low row, in proportion', () => {
  const n = 4, x = 22;
  const { hook } = loadGame({ noLose: true });
  hook.setSeed(42);
  hook.startGame();
  const p = hook.rowProfile(n);
  // Interior rows only: top/bottom rows spill sideways one way, which changes depth.
  const inner = p.map((m, y) => ({ m, y })).slice(1, -1).sort((a, b) => a.m - b.m);
  const lo = inner[0].y, hi = inner[inner.length - 1].y;
  const { lost: [dHi, dLo] } = wallDamage(n, 42, x, [hi, lo], 12);
  assert.ok(dLo > 0 && Number.isFinite(dHi), `walls took damage and survived: hi ${dHi}, lo ${dLo}`);
  const want = p[hi] / p[lo], got = dHi / dLo;
  assert.ok(Math.abs(got / want - 1) < 0.15,
    `HP lost ratio ${got.toFixed(3)} vs multiplier ratio ${want.toFixed(3)} (rows ${hi} x${p[hi].toFixed(2)}, ${lo} x${p[lo].toFixed(2)})`);
});

test('row damage: on wave 1 (flat) wall damage matches the pre-bay value on every row', () => {
  // 173.04 HP lost in 12 s at x=22 was measured before row damage existed.
  for(const seed of [1, 42]){
    const { lost } = wallDamage(0, seed, 22, [4, 8, 12], 12);
    for(const d of lost) assert.ok(Math.abs(d - 173.04) < 0.01, `seed ${seed}: lost ${d}`);
  }
});

// ── Warning buoy and row markers (warning-buoy ticket 02) ──
test('buoy: only on the beach (x >= 27), and only one', () => {
  const { hook, G } = loadGame();
  hook.setSeed(1);
  hook.startGame();
  G.materials = 1000;
  assert.equal(hook.place('buoy', 26, 5), false, 'x=26 is not beach');
  assert.equal(hook.place('buoy', 10, 5), false);
  assert.equal(G.materials, 1000, 'failed placements cost nothing');
  assert.equal(hook.place('buoy', 27, 5), true);
  assert.equal(G.materials, 1000 - hook.BUOY_COST);
  assert.equal(hook.place('buoy', 30, 9), false, 'a second buoy is refused');
  assert.equal(G.structures.filter(s => s.defId === 'buoy').length, 1);
});

test('buoy: does not block water: a buoy on a row gives the same water as an empty row', () => {
  const run = withBuoy => {
    const { hook, G } = loadGame({ noLose: true });
    hook.setSeed(1);
    hook.startGame();
    G.materials = 1000;
    if(withBuoy) assert.ok(hook.place('buoy', 29, 6));
    G.wave = 0; G.timer = 0;
    hook.update(DT);
    for(let i = 0; i < 60 * 5; i++) hook.update(DT);
    return Array.from({ length: hook.COLS }, (_, x) => G.water[6 * hook.COLS + x]);
  };
  const a = run(true), b = run(false);
  assert.deepEqual(a, b, 'water on the buoy row is identical with and without the buoy');
  assert.ok(a[30] > 0.5 && a[20] > 0.05, 'water passes the buoy and reaches inland');
});

test('buoy: survives a full run of waves untouched, even with water covering it', () => {
  const { hook, G } = loadGame({ noLose: true });
  hook.setSeed(3);
  hook.startGame();
  G.materials = 1e6;
  assert.ok(hook.place('buoy', 28, 8));
  const buoy = G.structures[0];
  let sawWater = false;
  for(let t = 0; t < 1200 && G.phase !== 'win'; t += DT){
    hook.update(DT);
    if(G.water[8 * hook.COLS + 28] > 0.3) sawWater = true;
  }
  assert.equal(G.phase, 'win');
  assert.ok(sawWater);
  assert.equal(buoy.hp, buoy.maxHp);
  assert.ok(G.structures.includes(buoy));
});

test('buoy: a wall behind it takes the same damage as without a buoy', () => {
  const hp = withBuoy => {
    const { hook, G } = loadGame({ noLose: true });
    hook.setSeed(1); hook.startGame(); G.materials = 1e6;
    hook.place('wall', 22, 8);
    if(withBuoy) hook.place('buoy', 30, 8);
    G.wave = 0; G.timer = 0; hook.update(DT);
    for(let i = 0; i < 60 * 12; i++) hook.update(DT);
    return G.grid[22][8].hp;
  };
  assert.equal(hp(true), hp(false));
});

// ── Forecast levels ──
const levelOf = m => m < 0.9 ? 'low' : m > 1.15 ? 'high' : 'medium';

test('forecast: none without a buoy; with one, each row\'s level matches the thresholds on every wave', () => {
  const { hook, G } = loadGame();
  hook.setSeed(42);
  hook.startGame();
  G.materials = 1000;
  assert.equal(hook.forecast(), null);
  hook.place('buoy', 27, 0);
  G.revised = true;  // true values; the early understatement is covered below
  for(let n = 0; n < hook.WAVES.length; n++){
    G.wave = n;
    const f = hook.forecast();
    const p = hook.rowProfile(n);
    assert.equal(f.rows.length, hook.ROWS);
    f.rows.forEach((r, y) => {
      assert.equal(r.mult, p[y]);
      assert.equal(r.level, levelOf(p[y]), `wave ${n + 1} row ${y} x${p[y].toFixed(3)}`);
    });
  }
  assert.equal(hook.LEVEL_LOW, 0.9);
  assert.equal(hook.LEVEL_HIGH, 1.15);
});

test('forecast: a buoy built during wave 1 shows every row as medium x1.0', () => {
  const { hook, G } = loadGame();
  hook.setSeed(5);
  hook.startGame();
  G.materials = 1000;
  hook.place('buoy', 29, 3);
  assert.ok(hook.forecast().rows.every(r => r.level === 'medium' && r.mult === 1));
  G.timer = 0; hook.update(DT);
  assert.equal(G.phase, 'tsunami');
  assert.ok(hook.forecast().rows.every(r => r.level === 'medium' && r.mult === 1));
});

test('forecast: covers the next wave in prep and the current wave in tsunami and drain', () => {
  const { hook, G } = loadGame({ noLose: true });
  hook.setSeed(9);
  hook.startGame();
  G.materials = 1000;
  hook.place('buoy', 29, 3);
  const seen = [];
  let last = '';
  for(let t = 0; t < 1200 && G.phase !== 'win'; t += DT){
    hook.update(DT);
    if(G.phase === 'win') break;
    const key = G.phase + G.wave;
    if(key !== last){ last = key; seen.push([G.phase, G.wave, hook.forecast().wave]); }
  }
  for(const [, wave, fw] of seen) assert.equal(fw, wave);
  assert.ok(seen.some(s => s[0] === 'prep' && s[1] === 1), 'saw prep of wave 2');
  assert.ok(seen.some(s => s[0] === 'drain'));
});

test('forecast: each row lists every surge\'s strength (raw surge power)', () => {
  const { hook, G } = loadGame();
  hook.setSeed(42); hook.startGame(); G.materials = 1000;
  hook.place('buoy', 27, 0);
  G.wave = 3; G.revised = true;
  const f = hook.forecast(), p = hook.rowProfile(3);
  f.rows.forEach((r, y) => {
    assert.equal(r.surges.length, hook.WAVES[3].pulses.length);
    r.surges.forEach((s, k) => assert.equal(s, hook.WAVES[3].pulses[k].power));
  });
});

test('marker tooltip: shows the row multiplier and each raw surge, in both languages', () => {
  for(const [lang, word] of [['en', 'Surges'], ['zh-Hant', '湧浪']]){
    const { hook, G } = loadGame({ lang });
    hook.setSeed(42); hook.startGame(); G.materials = 1000;
    assert.equal(hook.markerTip(3), '', 'no buoy, no marker tooltip');
    hook.place('buoy', 27, 0);
    G.wave = 3;
    const f = hook.forecast();
    const tip = hook.markerTip(5);
    assert.ok(tip.includes('×' + f.rows[5].mult.toFixed(1)), tip);
    assert.ok(tip.includes(word), tip);
    for(const s of f.rows[5].surges) assert.ok(tip.includes('×' + s.toFixed(1)), tip);
  }
});

test('marker tooltips work while running; other map tooltips stay paused-only', () => {
  const { hook, G } = loadGame();
  hook.setSeed(42); hook.startGame(); G.materials = 1000;
  hook.place('buoy', 27, 0);
  assert.equal(G.paused, false);
  assert.ok(hook.hoverTip(31, 4) !== '', 'marker cell while running');
  assert.equal(hook.hoverTip(10, 4), '', 'plain cell while running');
  hook.place('wall', 10, 4);
  assert.equal(hook.hoverTip(10, 4), '', 'structure tooltip while running stays hidden');
  G.paused = true;
  assert.ok(hook.hoverTip(10, 4).includes('900'), 'structure tooltip while paused');
});

// ── Early forecast and revision (warning-buoy ticket 03) ──
const startPrep = (seed, n, opts = {}) => {
  const game = loadGame(opts);
  const { hook, G } = game;
  hook.setSeed(seed); hook.startGame(); G.materials = 1000;
  G.wave = n; G.phase = 'prep'; G.timer = hook.WAVES[n].prep; G.revised = false;
  return game;
};
const centreOf = p => p.indexOf(Math.max(...p));
const rank = l => ({ low: 0, medium: 1, high: 2 })[l];
const SEEDS = [1, 2, 3, 4, 5, 42, 1234, 99, 7, 2024];

test('early forecast: understates only 1-2 rows beside the centre, by exactly one level, never overstates', () => {
  for(const seed of SEEDS) for(let n = 1; n < 5; n++){
    const { hook } = startPrep(seed, n);
    hook.place('buoy', 27, 0);
    const p = hook.rowProfile(n), c = centreOf(p), f = hook.forecast();
    const low = f.rows.map((r, y) => y).filter(y => f.rows[y].mult !== p[y]);
    const tag = `seed ${seed} wave ${n + 1}`;
    assert.ok(low.length >= 1 && low.length <= 2, `${tag}: ${low.length} rows understated`);
    for(const y of low){
      assert.equal(Math.abs(y - c), 1, `${tag}: row ${y} is not beside centre ${c}`);
      assert.ok(f.rows[y].mult < p[y]);
      assert.equal(rank(f.rows[y].level), rank(levelOf(p[y])) - 1, `${tag}: row ${y} not exactly one level down`);
      assert.equal(f.rows[y].level, levelOf(f.rows[y].mult), 'hover number matches the lowered level');
      f.rows[y].surges.forEach((sv, k) => assert.equal(sv, hook.WAVES[n].pulses[k].power));
    }
    f.rows.forEach((r, y) => { assert.ok(r.mult <= p[y]); if(!low.includes(y)) assert.equal(r.mult, p[y]); });
    assert.equal(f.rows[c].mult, p[c], 'centre is never understated');
  }
});

test('early forecast: deterministic from the seed, and varies between seeds', () => {
  const sig = seed => { const { hook } = startPrep(seed, 2); hook.place('buoy', 27, 0);
    return JSON.stringify(hook.forecast().rows.map(r => r.mult)); };
  assert.equal(sig(42), sig(42));
  assert.ok(new Set(SEEDS.map(sig)).size > 1);
});

test('revision: fires exactly once per prep at 10 s left, then the forecast is the true profile', () => {
  for(const lang of ['en', 'zh-Hant']){
    const game = loadGame({ lang, noLose: true });
    const { hook, G } = game;
    hook.setSeed(42); hook.startGame(); G.materials = 1000;
    hook.place('buoy', 27, 0);
    const toastEl = game.document.getElementById('toast');
    const toasts = [];
    let wave = -1, revisions = 0;
    for(let t = 0; t < 1200 && G.phase !== 'win'; t += DT){
      const before = toastEl.textContent, wasRevised = G.revised, ph = G.phase, w = G.wave;
      hook.update(DT);
      if(G.phase === 'win') break;
      if(!wasRevised && G.revised && G.phase === 'prep'){
        revisions++;
        assert.ok(G.timer <= 10 && G.timer > 10 - 2 * DT, `fired at ${G.timer}`);
        assert.equal(w, G.wave);
        const raised = G.raisedRows.map(y => y + 1);
        const want = lang === 'en' ? `Forecast revised: row${raised.length > 1 ? 's' : ''} ${raised.join(', ')}` : `預警修正：第 ${raised.join('、')} 列`;
        assert.ok(toastEl.textContent.includes(want), toastEl.textContent);
        const p = hook.rowProfile(G.wave);
        hook.forecast().rows.forEach((r, y) => assert.equal(r.mult, p[y]));
        assert.ok(G.raisedRows.length >= 1 && G.raisedRows.length <= 2);
      }
      if(G.phase === 'prep' && G.wave !== wave){ wave = G.wave; }
    }
    assert.equal(revisions, 4, 'once in each of the preps of waves 2-5');
  }
});

test('revision: only raises, and never fires before 10 s left', () => {
  const { hook, G } = startPrep(42, 2);
  hook.place('buoy', 27, 0);
  const early = hook.forecast().rows.map(r => r.mult);
  G.timer = 10.5; hook.update(DT);
  assert.equal(G.revised, false);
  const p = hook.rowProfile(2);
  G.timer = 10.01; hook.update(DT);
  assert.equal(G.revised, true);
  hook.forecast().rows.forEach((r, y) => assert.ok(r.mult >= early[y] && r.mult === p[y]));
});

test('revision: a buoy built after the revision shows true values and no toast', () => {
  const game = startPrep(42, 2);
  const { hook, G } = game;
  G.timer = 10.01; hook.update(DT);
  assert.equal(G.revised, true);
  const toastEl = game.document.getElementById('toast');
  toastEl.textContent = '';
  hook.place('buoy', 27, 0);
  const p = hook.rowProfile(2);
  hook.forecast().rows.forEach((r, y) => assert.equal(r.mult, p[y]));
  hook.update(DT);
  assert.ok(!/revised|修正/.test(toastEl.textContent.replace(/.*(?=Wave|第)/, '')), toastEl.textContent);
  assert.equal(G.reviseFlash, 0);
});

test('revision: no buoy, no revision toast; wave 1 has no revision', () => {
  const a = startPrep(42, 2), ta = a.document.getElementById('toast');
  ta.textContent = '';
  a.G.timer = 10.01; a.hook.update(DT);
  assert.equal(ta.textContent, '');
  const b = loadGame(); b.hook.setSeed(42); b.hook.startGame(); b.G.materials = 1000;
  b.hook.place('buoy', 27, 0);
  const tb = b.document.getElementById('toast');
  for(let t = 0; t < 40 && b.G.phase === 'prep'; t += DT){
    b.hook.update(DT);
    assert.ok(!/revised|修正/.test(tb.textContent));
  }
  assert.equal(b.G.revised, false);
  assert.ok(b.hook.forecast().rows.every(r => r.mult === 1));
});

test('revision strings exist in both languages', () => {
  for(const lang of ['en', 'zh-Hant']){
    const { window } = loadGame({ lang });
    const T = window.TSUNAMI_LANGS[lang]({ SUPER: {}, WAVES: [], BASE_INCOME: 0, MAX_TRUCKS: 0, LOSE_DEPTH: 0 });
    assert.ok(T.tRevised([3, 4]).includes('3') && T.tRevised([3, 4]).includes('4'));
  }
});

// ── No buoy, no change ──
// Golden digests of every HUD pill and the toast, recorded before the buoy
// existed: seed 7, no structures, dt = 1/60, one full run.
const HUD_DIGESTS = {
  en: 'c2b4387783d04af6db6450b8908731b587383ab56322dae54d36078374037dc6',
  'zh-Hant': '963e654ced89cd1ce208e50fb8a39b3cb9fee7f4a61ef311ebc5c05072912c72',
};
test('without a buoy, HUD and toast output across a full run is unchanged', () => {
  for(const lang of ['en', 'zh-Hant']){
    const game = loadGame({ noLose: true, lang });
    const { hook, G } = game;
    hook.setSeed(7); hook.startGame();
    const ids = ['mats', 'powerTxt', 'unitTxt', 'phaseTxt', 'timerTxt', 'waveTxt', 'toast'];
    const last = {}, trace = [];
    for(let t = 0; t < 1200 && G.phase !== 'win'; t += DT){
      hook.update(DT);
      for(const id of ids){
        const v = game.document.getElementById(id).textContent;
        if(last[id] !== v){ last[id] = v; trace.push(`${Math.round(t / DT)}|${id}|${v}`); }
      }
    }
    assert.equal(createHash('sha256').update(trace.join('\n')).digest('hex'), HUD_DIGESTS[lang], lang);
  }
});

test('buoy strings exist in both languages', () => {
  for(const lang of ['en', 'zh-Hant']){
    const { window } = loadGame({ lang });
    const T = window.TSUNAMI_LANGS[lang]({ SUPER: {}, WAVES: [], BASE_INCOME: 0, MAX_TRUCKS: 0, LOSE_DEPTH: 0 });
    assert.ok(T.names.buoy && T.role.buoy && T.tipMarker && T.levels.low && T.levels.medium && T.levels.high);
  }
});

// ── Warning buoy review fixes ──
test('buoy: a 2x2 structure cannot cover the buoy through any of its cells', () => {
  const { hook, G } = loadGame();
  hook.setSeed(1); hook.startGame(); G.materials = 1000;
  assert.ok(hook.place('buoy', 28, 5));
  for(const [x, y] of [[27, 4], [28, 4], [27, 5], [28, 5]])
    assert.equal(hook.place('recycle', x, y), false, `recycler at ${x},${y} overlaps the buoy`);
  assert.equal(hook.place('recycle', 29, 5), true, 'a non-overlapping recycler is fine');
});

test('marker tooltip: Surges lists raw surge strengths, not multiplied by the row', () => {
  const { hook, G } = loadGame();
  hook.setSeed(42); hook.startGame(); G.materials = 1000;
  hook.place('buoy', 27, 0);
  G.wave = 3; G.revised = true;
  const m = hook.rowProfile(3)[5];
  assert.notEqual(m, 1);
  const raw = hook.WAVES[3].pulses.map(p => '×' + p.power.toFixed(1)).join(' · ');
  assert.ok(hook.markerTip(5).includes('Surges: ' + raw), hook.markerTip(5));
});

test('hover: a buoy on the sea-edge column shows its own tooltip while paused', () => {
  const { hook, G } = loadGame();
  hook.setSeed(42); hook.startGame(); G.materials = 1000;
  assert.ok(hook.place('buoy', hook.COLS - 1, 5));
  const marker = hook.hoverTip(hook.COLS - 1, 5);
  assert.ok(marker.includes('Forecast'), marker);
  G.paused = true;
  assert.ok(hook.hoverTip(hook.COLS - 1, 5).includes('Warning Buoy') || hook.hoverTip(hook.COLS - 1, 5).includes('Beach only'));
  assert.ok(hook.hoverTip(hook.COLS - 1, 6).includes('Forecast'), 'other edge cells still show markers');
});
