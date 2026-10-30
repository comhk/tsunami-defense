# 01: Headless test harness with the current balance recorded

**What to build:** A maintainer can run `node test/waves.test.mjs` and have the *current* game script run headlessly in Node and pass. The script loads the real `lang/*.js` files and the real game `<script>` from `index.html` into a `vm` context with a minimal fake browser (document elements, 2D canvas context, `localStorage`, `requestAnimationFrame`). It starts a game and steps `update` with a fixed time step. The game exposes a read-only test handle (`window.__tsunami`) only when a test flag is set before the script runs, so normal play is unchanged. With no structures built, the test measures total water poured in and peak home water depth per wave, and records those as the "before" baseline constants for later tickets. No dependencies (keep the zero-dependency rule). See the spec's Testing Decisions.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `node test/waves.test.mjs` exits 0 on the current game, and exits non-zero with a clear message when an assertion fails
- [x] The test hook is only exposed when the test flag is set; opening `index.html` in a browser behaves exactly as before
- [x] The test plays all 5 waves with no structures (the home may be lost; the harness must still be able to measure each wave, e.g. by disabling the lose check through the hook or by measuring waves one at a time)
- [x] Per-wave total inflow and peak home depth from the current code are printed and stored as baseline constants in the test
- [x] No npm dependencies or `package.json` needed
