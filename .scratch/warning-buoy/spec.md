# Warning buoy: bays and a revised forecast

Status: ready-for-agent

## Problem Statement

Wave trains made every wave a different shape over time, but every wave still hits every row the same way. Inflow at the right edge is identical on all 16 rows, so where to build is solved once and never changes. There is also no information worth buying: the wave tooltip already gives everyone the surge count and the biggest surge, and a height number on its own changes no decision.

Real warning systems exist because the sea doesn't hit a coast evenly and the first estimate is often wrong. In 2011 the first JMA estimate (3–6 m) was raised to over 10 m about 45 minutes later (see `docs/research/gameplay-mechanics-ideas.md`, E3 and B7).

## Solution

Two linked changes:

- **Bays.** From wave 2 on, each wave focuses its water onto a few rows. One **bay** per wave is centred on a random row. Rows near it pour faster and fill higher, rows far from it pour less. Total water per wave stays about the same. The bay is re-rolled every wave from a seed chosen once per run. Surge timing and strength stay fixed, so players still learn those by playing, and the location is what changes from run to run. Wave 1 stays flat.
- **Warning buoy.** A cheap 1×1 structure, at most one per game, built only on the beach. With a buoy, every row gets a coloured marker at the sea edge showing its expected strength (low / medium / high). Hovering a marker shows the row's exact multiplier and the strength of each surge in the wave. The first forecast of each prep understates one or two rows beside the bay's centre. With 10 s of prep left it is **revised** to the true values: a toast names the rows that were raised, and their markers flash.

Without a buoy the game behaves exactly as it does today, and the bay is only discovered when the water hits. The buoy adds information and takes nothing away.

The loop it creates: buy the buoy, read the early forecast, build on the obvious rows, keep materials back, then cover the rows the revision raises.

## User Stories

1. As a player, I want some rows to hit my structures harder than others, so that where I build matters and changes from wave to wave.
2. As a new player, I want wave 1 to hit every row evenly, so that I learn the basics before bays appear.
3. As a returning player, I want the bay's location to change between runs while surge timing stays the same, so that I can't memorise everything and the buoy stays worth buying.
4. As a player, I want water on a strong row to wear down my walls faster, so that "high" means something I feel.
5. As a returning player, I want total water per wave to stay close to today's, so that bays change where the danger is, not how much there is.
6. As a player, I want to buy a warning buoy with materials, so that information competes with walls for my budget.
7. As a player, I want the buoy to be buildable only on the beach, so that it feels like a real offshore warning buoy.
8. As a player, I want to be limited to one buoy, so that I don't waste materials on a second one that adds nothing.
9. As a player, I want the buoy not to block water and not to be destroyed by it, so that it can't be used as a wall and I don't lose my investment in this version.
10. As a player without a buoy, I want the game to behave exactly as it does today, so that the buoy is a bonus, not a penalty for skipping it.
11. As a player with a buoy, I want a coloured marker on each row at the sea edge, so that I can see at a glance which rows will be hit hardest.
12. As a player, I want to hover a marker and see the row's exact multiplier and each surge's strength, so that I can make precise tactical choices.
13. As a player, I want marker tooltips to work while the game is running, so that I don't have to pause to plan.
14. As a player, I want the markers to stay visible during the tsunami, so that I know which rows the next surge will hit hardest.
15. As a player, I want the early forecast to sometimes understate rows next to the bay's centre, so that keeping materials back is rewarded.
16. As a player, I want the forecast revised with 10 s of prep left, with a toast naming the raised rows and the markers flashing, so that I notice the change and can react in time.
17. As a player, I want revisions to only ever go up, so that the forecast never tricks me into overbuilding.
18. As a player who builds the buoy late, I want to see the true forecast straight away, so that a late buoy isn't worse than an early one.
19. As a player who builds a buoy during wave 1, I want to see every row at medium ×1.0, so that I learn the forecast is real.
20. As a Traditional Chinese player, I want all new text in Traditional Chinese, so that the game stays fully localised.
21. As an English player, I want all new text in English, so that the game stays fully localised.
22. As a maintainer, I want the bay shape, strength levels and buoy cost to be single constants, so that I can retune them after playtesting.
23. As a maintainer, I want bays to come from a seed I can set in tests, so that tests are repeatable.
24. As a maintainer, I want the balance test to check total water per wave with bays, so that I know bays didn't change the difficulty.
25. As a reader of the README, I want the buoy, bays and forecast described, so that the docs match the game.

## Implementation Decisions

- **Scope.** Bays (B7) and the warning buoy with its forecast (E3). Bays ship first as their own ticket so the balance test can check them alone.
- **Run seed.** Chosen once when a run starts. A small seeded RNG (not `Math.random`) derives every wave's bay from it. Tests can set the seed through the test hook before the run starts.
- **Bay shape.** One smooth bump per wave, centred on a random row. Rows near the centre reach about ×1.5, rows far away drop to about ×0.7. The profile is then scaled so its mean across rows is 1, so total inflow per wave is unchanged. The peak, floor and width are single constants. Wave 1 is flat (every row ×1.0).
- **Row multiplier in the water sim.** At the right edge, a row's effective strength is surge power × row multiplier. It feeds both the inflow rate and the fill cap, using the existing rule for surge power (92% of max depth at strength ≤ 1, rising toward full max depth above 1). This only changes depth at the edge cell: the flow rule settles all open cells inland at about 0.90 whatever the edge strength (found while building ticket 01).
- **Buoy.** A new `DEFS` entry with cost about 30 (a single constant), 1×1 and no power use. It can only be placed on the beach band (x ≥ 27), and at most one can exist. It doesn't block water, so it doesn't cut inflow on its row, and water never damages it. It can be built in any phase where building is allowed today.
- **Row damage.** Water hitting a structure deals damage scaled by that row's multiplier for the current wave (a ×1.4 row deals 40% more, a ×0.7 row 30% less). This is how a bay matters inland. It applies only during the tsunami phase and only to the row multiplier, not to surge power. Wave 1 is flat, so its damage is unchanged. Added as ticket 04 after ticket 01 showed bays don't change depth inland.
- **Strength levels.** Low below ×0.9, medium from ×0.9 to ×1.15, high above ×1.15. The thresholds are single constants.
- **Markers.** With a buoy, each row gets a short arrow at the sea edge, coloured by level, for the next wave during prep and for the current wave during the tsunami and drain. Hovering a marker shows the row multiplier (for example "×1.4") and each surge's strength (for example "Surges: ×1.0 · ×1.4 · ×0.9"), while the game is running as well as when paused. Other map tooltips keep today's paused-only behaviour.
- **Early forecast and revision.** At the start of each prep from wave 2 on, the forecast understates 1–2 rows just beside the bay's centre by one level, never the centre itself. Their hover numbers are lowered to match. With 10 s of prep left (prep is never shorter than 30 s), the forecast switches to the true values. A toast names the raised rows, and those markers flash briefly. Revisions only go up. If the buoy is built after the revision, it shows the true values straight away. Wave 1 is flat and has no revision.
- **Strings.** All new strings (buoy name and tooltip, marker tooltip, revision toast, level names) go in both language files with matching keys.
- **Docs.** The README describes the buoy, bays and the forecast, and its parameter reference covers the new constants.
- **Test hook.** The existing `window.__tsunami` hook gains whatever read-only access tests need: the run seed (settable before the run), each wave's row profile, the current forecast, and a way to place a structure.

## Testing Decisions

- Same seam as wave trains: `test/harness.mjs` loads the real game in `node:vm`, and tests drive `update` with a fixed time step and assert on state and HUD/toast text.
- **What the tests cover:**
  - The same seed gives the same bays, and different seeds give different bays.
  - A wall on a high row loses HP faster than an identical wall on a low row in the same wave, in proportion to the row multipliers.
  - Wave 1 is flat. Every later wave's profile has a mean of 1 within rounding, and its peak and floor are within the constants.
  - With no structures, total inflow per wave stays within ±15% of the ticket-01 baseline across several seeds. Peak home depth is printed for information.
  - The buoy can only be placed on the beach, only once, doesn't block water and survives a full wave.
  - Without a buoy, HUD and toast output across a full run matches today's.
  - With a buoy, the forecast levels match the thresholds, the early forecast understates only rows beside the centre and only downward, the revision fires once at 10 s of prep left with the right toast text in both languages, and a buoy built after the revision shows true values.
  - Both language files define the same set of keys.
- **Not covered by tests:** marker drawing, flashing and hover tooltips (the harness can't dispatch hover events). Check these by playing.

## Out of Scope

- Losing the buoy to waves, or more than one buoy (possible F2 modifiers later).
- A predicted depth number per row (it would need running the water sim ahead of time).
- More than one bay per wave, or bays that change during a wave.
- Changing surge timing or strength, or seeding them.
- Reworking the flow rule so strength changes depth inland. Today the flow settles all open cells at about 0.90, so neither bays nor surge power change inland depth. That is a separate, larger change.
- Floodgates, repair/sell, drawback, readable failure, and the rest of the first batch.
- Setting up CI to run the test.

## Further Notes

- Settled in a grilling session on 2026-10-31. The key choice: the buoy is only worth buying if its information changes what you build, which is why B7 bays ship with it.
- This resolves the research note's open question on seeding: surge timing is fixed for learnability, and bay location is seeded per run.
- The bay constants, strength thresholds and buoy cost are a first pass. Expect to retune them after playtesting.
