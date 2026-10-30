# Wave trains: each tsunami arrives as several surges

Status: ready-for-agent

## Problem Statement

Every wave in the game has the same shape. Water pours in from the right edge in one continuous block, then seeps away. The only differences between waves 1 and 5 are how long the water pours and how fast it flows. Once the water stops pouring, the player knows the danger is over and can relax, and the wave often ends early as soon as the towers clear the map.

This makes waves predictable and samey, and it removes any reason to keep materials back during a wave. It also teaches the opposite of a real lifesaving rule. Real tsunamis arrive as a train of several waves, the first is often not the largest, and the danger can last for hours (see `docs/research/gameplay-mechanics-ideas.md`, B1 and the design analysis).

## Solution

Each wave becomes a fixed, hand-written sequence of **surges**. A surge is a period when water pours in from the right edge, with its own start time, length and strength. Between surges, inflow stops and water keeps flowing and seeping as it does today after inflow ends. Then the next surge hits, possibly before the previous water has drained.

- Wave 1 stays a single surge, so new players learn the basics first.
- Wave 2 introduces a smaller second surge.
- Waves 3–5 have two or three surges, and the biggest one is the second or third, not the first.
- Total water per wave stays about the same as today. The challenge changes shape rather than growing.
- A wave can't end before its last surge has finished, even if the player clears the map during a gap.
- Gaps between surges give no income. The player can build or react with materials held back from prep.
- The HUD always shows which surge is pouring ("⚠ Surge 2 / 3") or counts down to the next one ("Next surge" + seconds). A warning toast appears shortly before each later surge, and the screen shakes when it hits.

The patterns are the same every run, so players can learn them ("wave 4's last surge is the big one").

## User Stories

1. As a new player, I want wave 1 to be a single surge, so that I can learn how water flows before the game adds surprises.
2. As a player, I want wave 2 to bring a second, smaller surge, so that I learn safely that a tsunami is not over after the first hit.
3. As a player, I want the biggest surge in later waves to come second or third, so that I can't win by surviving only the first hit.
4. As a player, I want the same wave to have the same surge pattern every run, so that I can learn and plan for it.
5. As a player, I want the HUD to show "Surge n / N" while water is pouring in, so that I always know how many surges are left.
6. As a player, I want the HUD to show "Next surge" and a countdown during a gap, so that I know how long I have to react.
7. As a player, I want a warning toast about 3 seconds before each later surge, so that I'm not caught off guard.
8. As a player, I want the screen to shake when each surge hits, so that each surge feels like a distinct impact.
9. As a player, I want a stronger surge to visibly push more water into the map, so that "big surge" means something I can see.
10. As a player, I want water left over from one surge to still be there when the next arrives, so that clearing water between surges is worth doing.
11. As a player, I want water to keep flowing and seeping during a gap, so that gaps give real relief when they are long.
12. As a player, I want the wave not to end early while surges are still to come, so that clearing the map during a gap doesn't skip the big surge.
13. As a player, I want the early end (map nearly dry) to still work after the last surge, so that clearing water fast is still rewarded.
14. As a player, I want the wave's time limit to count from the end of its last surge, so that long surge patterns aren't cut short.
15. As a player, I want no materials income during gaps, so that keeping materials back from prep is a real decision.
16. As a player, I want garbage trucks not to be produced during gaps, so that the economy behaves the same as during the rest of the tsunami phase.
17. As a player, I want to be able to build during a gap with materials I held back, so that I can patch my line between surges.
18. As a player, I want pausing during a gap to freeze the countdown, so that pausing never costs me time.
19. As a player, I want building to stay blocked while paused, including during gaps, so that pause can't be used to plan the next surge for free.
20. As a player, I want the wave tooltip to show the number of surges and total inflow, so that I can see what's coming before it starts.
21. As a player, I want the phase tooltip to explain that a tsunami comes in several surges, so that the rules are clear without reading the README.
22. As a Traditional Chinese player, I want all new HUD text, toasts and tooltips in Traditional Chinese, so that the game stays fully localised.
23. As an English player, I want all new HUD text, toasts and tooltips in English, so that the game stays fully localised.
24. As a returning player, I want overall wave difficulty to feel close to the current balance, so that the recent rebalance of waves, walls and towers still holds.
25. As a maintainer, I want each wave's surges defined as data in the wave table, so that I can tune patterns without touching simulation code.
26. As a maintainer, I want a single source of truth for wave length, so that the old per-wave inflow multiplier and the surge list can't disagree.
27. As a maintainer, I want an automated test that runs the real game script headlessly, so that I can change surge patterns and know the rules still hold.
28. As a maintainer, I want the test to report total water per wave against today's numbers, so that I can see the balance impact of a change.
29. As a reader of the README, I want the wave-flow description to mention surges, so that the docs match the game.

## Implementation Decisions

- **Scope.** This change covers surges plus a minimal on-screen counter only. The warning buoy, per-row forecast and end-screen "real fact" are separate later changes.
- **Wave data.** Each wave entry becomes `{ speed, prep, pulses: [{ at, dur, power }] }`. A pulse is the data name for a surge. `at` and `dur` use the existing wave-progress units (game time × wave speed). The old `energy` field is removed. The surge list is the single source of truth for how long water pours in.
- **Starting patterns** (first pass; tune by playtesting). Each tuple is `[at, dur, power]`:

  | Wave | Today's inflow length | Surges |
  |---|---|---|
  | 1 | 8 | `[0, 8, 1.0]` |
  | 2 | 12.8 | `[0, 7, 1.1]`, `[12, 5, 0.8]` |
  | 3 | 18.4 | `[0, 5, 0.8]`, `[9, 8, 1.3]`, `[22, 5, 0.8]` |
  | 4 | 24 | `[0, 6, 0.9]`, `[10, 6, 1.0]`, `[20, 10, 1.3]` |
  | 5 | 30.4 | `[0, 7, 1.0]`, `[11, 12, 1.4]`, `[27, 9, 0.9]` |

  Gaps shrink in later waves, so water piles up between surges more often.
- **Inflow strength.** During a surge, the right-edge inflow rate is the current rate × wave speed × surge power. Today, inflow only tops up an edge cell while it is below 92% of max depth. For surges with power above 1, that cap rises with power, up to the full max depth, so a strong surge visibly carries more water. Surges at power 1 or below keep the 92% cap.
- **Between surges.** No inflow. Water keeps flowing and seeps away at the existing post-inflow seep rate, so a long gap gives relief and a short one lets water pile up.
- **Ending a wave.** The two existing tsunami-to-drain conditions are "map nearly dry" and "time limit after inflow ends". Both are measured from the end of the **last** surge. Before that point the wave can't move to drain.
- **Economy.** The phase stays `tsunami` for the whole wave, including gaps. So income, trucks and building keep today's tsunami-phase behaviour (no income, no truck production, building allowed), and the pause rules are unchanged.
- **HUD.** While a surge is pouring, the phase label shows "⚠ Surge n / N". During a gap it shows "Next surge" and the timer shows the seconds until the next surge (in real seconds, from progress ÷ wave speed). After the last surge it keeps today's tsunami label and the "——" timer.
- **Surge warnings.** About 3 seconds of real time before each surge after the first, show a warning toast. When each surge after the first begins, apply the same screen shake the first surge gets today.
- **Strings.** New and changed strings go in both language files with matching keys: the surge label, the next-surge label, the surge-warning toast, the updated wave tooltip (surge count and total inflow length instead of the inflow multiplier), and the updated phase tooltip.
- **Docs.** Update the README's wave-flow description in its Chinese text, and the parameter reference where it describes the wave table's `energy`.
- **Test hook.** The game exposes one read-only handle for tests, `window.__tsunami = { G, update, startGame, … }`, set only when a test flag is present before the script runs. Normal play is unaffected.

## Testing Decisions

- **One seam, at the top.** A Node test script loads the real language files and the real game script into a `vm` context. The context has a minimal fake browser (document elements, 2D canvas context, `localStorage`, `requestAnimationFrame`). The test starts a game and steps `update` with a fixed time step. It uses no dependencies, keeping the repo's zero-dependency rule. Run it with `node` on the test file.
- **Test only what a player could observe:** game state (`G.phase`, water totals, materials) and HUD text. Don't test internal variable names or helper functions.
- **What the test covers:**
  - Inflow switches on and off at each surge's start and length, and each wave has the expected number of surges.
  - Wave 1 has exactly one surge.
  - A wave never moves from `tsunami` to `drain` before its last surge ends, even when all water is removed during a gap.
  - After the last surge, the existing early-end and time-limit rules still move the wave to drain.
  - Materials don't increase during gaps.
  - The HUD phase label and timer show the surge counter during a surge and the next-surge countdown during a gap, in both languages.
  - **Balance:** with no structures built, total water poured in per wave is within ±15% of today's. Record the "before" numbers from the current code first and keep them in the test as constants. Also report peak home water depth per wave, for information only.
- **Prior art.** There are no automated tests in the repo yet. Earlier water-balance work (`.scratch/water-balance/`) used one-off headless runs of the simulation. This test makes that approach permanent.
- **Not covered by tests.** How the surges feel and whether the difficulty curve is right. The maintainer judges that by playing.

## Out of Scope

- Warning buoy and per-row forecast (E3/B7).
- Randomised or seeded surge patterns, and difficulty modifiers (F2).
- End-screen "real fact" lines.
- Drawback, backwash, debris, scour, floodgates, repair/sell, and the other proposals in the research note.
- Changes to tower, wall or economy balance beyond keeping total water per wave close to today's.
- Setting up CI to run the test (it is run by hand for now).

## Further Notes

- The design was settled in a grilling session. The rationale (fixed patterns for learnability, the same total water, no early end, no income in gaps) is recorded in `docs/research/gameplay-mechanics-ideas.md` under "Design analysis".
- Real-world grounding: NOAA and USGS state that a tsunami reaches the coast many times and that the first wave is often not the largest. NOAA also notes the next wave can arrive before the previous one recedes.
- The surge patterns are a first pass. Expect to retune `at`, `dur` and `power` after playtesting. The balance test makes retuning safe.
