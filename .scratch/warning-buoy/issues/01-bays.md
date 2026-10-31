# 01: Bays focus each wave onto a few rows

**What to build:** From wave 2 on, each wave's inflow is focused by a **bay**: a smooth per-row multiplier centred on a random row (about ×1.5 at the centre, about ×0.7 far away, scaled to a mean of 1). Each wave gets a new bay, derived from a seed chosen once per run using a small seeded RNG. Wave 1 is flat. At the right edge, a row's effective strength is surge power × row multiplier, and it feeds both the inflow rate and the fill cap through the existing surge-power rule. Nothing about the bay is shown to the player yet (ticket 02 adds the buoy). The test hook lets tests set the seed before a run and read each wave's profile. See the spec's Implementation Decisions (Run seed, Bay shape, Row multiplier).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Tests: the same seed gives the same profiles, and different seeds give different profiles
- [x] Tests: wave 1 is flat; every later wave's profile has a mean of 1 (within rounding) and stays within the peak and floor constants
- [x] Tests: with no structures, total inflow per wave stays within ±15% of the ticket-01 baseline across several seeds; peak home depth is printed for information
- [x] Tests: a high row reaches a higher edge depth than a low row during a strong surge
- [x] Bay peak, floor and width are single constants
- [x] README parameter reference describes bays and their constants
