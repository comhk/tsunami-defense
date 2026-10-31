# 02: Warning buoy and row markers

**What to build:** Players can buy a warning buoy: a new `DEFS` entry costing about 30 (a single constant), 1×1, with no power use. It can only be placed on the beach band (x ≥ 27), at most one can exist, it doesn't block water and water never damages it. With a buoy, each row gets an arrow at the sea edge coloured low / medium / high (thresholds ×0.9 and ×1.15). It shows the next wave during prep and the current wave during the tsunami and drain. Hovering a marker shows the row multiplier and each surge's strength, while the game is running as well as when paused. Other map tooltips stay paused-only. In this ticket the forecast always shows the true values (ticket 03 adds the early understatement and the revision). Without a buoy nothing changes. All new strings are in both languages, and the README describes the buoy. See the spec's Implementation Decisions (Buoy, Strength levels, Markers).

**Blocked by:** 01, 04

**Status:** resolved

- [x] Tests: the buoy can only be placed on the beach and only once, doesn't block inflow on its row, and survives a full wave
- [x] Tests: the forecast levels for each row match the thresholds; a buoy built during wave 1 shows every row as medium ×1.0
- [x] Tests: without a buoy, HUD and toast output across a full run is unchanged
- [x] Tests: both language files define the same set of keys
- [x] Buoy cost and level thresholds are single constants
- [ ] Markers, colours and running hover tooltips checked by playing
- [x] README describes the buoy and the markers
