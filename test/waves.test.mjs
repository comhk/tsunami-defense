// Headless tests for the wave/water simulation.
// Run: node test/waves.test.mjs   (no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadGame, playAllWaves } from './harness.mjs';

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
