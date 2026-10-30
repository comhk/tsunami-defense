# Water pools at the left edge and behind walls

Status: resolved

## Problem

During the tsunami phase, water on the map has no way to leave except tower fire:

- `flowStep` loops `x>=1`, so water that reaches column 0 can never flow out.
- Water that hits a structure spills sideways or stays. The structure takes damage but absorbs nothing.
- Only the drain phase removes water by itself.

Result: after inflow stops (`INFLOW_END`), total water stays far above the "< 3" end check. In a headless run, a full row of towers still left about 100–125 units each wave, so every wave ended by the `TSUNAMI_MAX` timeout, not by clearing. Towers can't end a wave early in practice.

## Ideas

- Let water drain out of column 0 (the sea floods past the home and leaves the map).
- Make the "< 3" threshold relative to the map, or lower the bar.
- Slow per-tile decay during the tsunami phase after inflow stops.

## Related

See `02-inflow-depends-on-frame-rate.md`.
