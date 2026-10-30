# Tsunami inflow depends on frame rate

Status: needs-triage

## Problem

`updateWater` adds `0.55 * G.waveSpeed` to each right-edge tile once per frame, with no `× dt`. A 144 Hz screen gets about 2.4× the water of a 60 Hz screen, so difficulty changes with the player's monitor.

## Fix direction

Make the rate per-second (`× dt`) and retune the constant so 60 Hz play feels the same. This changes balance, so play-test every wave.
