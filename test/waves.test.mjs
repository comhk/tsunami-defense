// Headless tests for the wave/water simulation.
// Run: node test/waves.test.mjs   (no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, playAllWaves, watchInflow, DT } from './harness.mjs';

// "Before" baseline: total water poured in per wave with no structures,
// recorded from the single-pulse waves (energy multiplier) by ticket 01.
// Wave-train work must keep each wave within ±15% of these.
// Measured at DT = 1/60 (the inflow adds water per update call, not per second).
// Peak home depth at that time was 0.903 for every wave (info only).
const BASELINE_INFLOW = [870.7, 1260.1, 1657.3, 1983.5, 2325.2];
const TOLERANCE = 0.15;

test('the test hook exists only when the test flag is set', () => {
  assert.equal(loadGame({ testFlag: false }).window.__tsunami, undefined);
  const game = loadGame();
  assert.equal(typeof game.hook.update, 'function');
  assert.equal(game.hook.G.phase, 'menu');
});

test('balance: total inflow per wave with no structures stays within ±15% of baseline', () => {
  const rows = playAllWaves(loadGame({ noLose: true }));
  console.log('# wave  inflow   peak home depth (info only)');
  for(const r of rows)
    console.log(`#  ${r.wave}   ${r.inflow.toFixed(1).padStart(7)}   ${r.peakHome.toFixed(3)}`);
  rows.forEach((r, i) => {
    const base = BASELINE_INFLOW[i];
    assert.ok(Math.abs(r.inflow - base) <= TOLERANCE * base,
      `wave ${r.wave}: inflow ${r.inflow.toFixed(1)} is outside ±${TOLERANCE * 100}% of baseline ${base}`);
  });
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
