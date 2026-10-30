# 02: Waves arrive as several surges

**What to build:** In play, waves 2–5 arrive as several surges following the pattern table in the spec. Wave 1 stays a single surge. The per-wave `energy` multiplier is replaced by a surge list `{ at, dur, power }`. A stronger surge raises the inflow rate and, for power above 1, the right-edge fill cap (up to max depth). Water keeps seeping between surges. A wave can't move to drain before its last surge ends, and the early-end and time-limit checks count from the end of the last surge. There's no income or truck production during gaps (the phase stays `tsunami`). The wave tooltip shows the surge count and total inflow length in both languages. The README parameter reference is updated. The HUD phase label is unchanged in this ticket (ticket 03 adds the counter). See the spec's Implementation Decisions.

**Blocked by:** 01

**Status:** resolved

- [x] Tests: inflow switches on and off at each surge's `at`/`dur`, and each wave has the expected surge count (wave 1 has exactly 1)
- [x] Tests: a wave stays in `tsunami` until its last surge ends, even when all water is removed during a gap
- [x] Tests: after the last surge, the existing early-end and time-limit rules still move the wave to `drain`
- [x] Tests: materials don't increase during gaps
- [x] Tests: with no structures, total inflow per wave is within ±15% of the ticket-01 baseline; peak home depth is printed for information
- [x] The wave tooltip strings in `lang/zh-Hant.js` and `lang/en.js` no longer reference `energy`
- [x] README parameter reference describes the surge list in place of `energy`
