# 04: Strong bay rows hit structures harder

**What to build:** Water hitting a structure deals damage scaled by that row's bay multiplier for the current wave. A ×1.4 row deals 40% more and a ×0.7 row deals 30% less. This is what makes a bay matter inland: ticket 01 found that the flow rule settles every open cell at about 0.90 whatever the edge strength, so bays don't change depth past the edge cell. Only the row multiplier is applied, not surge power. Wave 1 is flat, so its damage is unchanged. The change sits where water damage is applied today (the blocked-flow branch of `flowStep`). The README explains that strong rows wear walls down faster. See the spec's Implementation Decisions (Row damage).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Tests: in the same wave, a wall on a high row loses HP faster than an identical wall on a low row, roughly in proportion to their multipliers
- [ ] Tests: on wave 1 (flat), wall damage matches today's
- [ ] Tests: with no structures, total inflow per wave is unchanged (the existing balance test still passes)
- [ ] README explains that strong rows damage structures faster
