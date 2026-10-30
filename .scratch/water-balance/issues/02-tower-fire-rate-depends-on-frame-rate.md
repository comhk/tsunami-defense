# Tower fire rate depends on frame rate

Status: resolved

## Problem

The machine gun and rocket tower reset their cooldown with `s.cd = 0.14` / `s.cd = 2.4` after each shot. The time left over in that frame is lost, so the real gap between shots rounds up to a whole frame. A machine gun fires every 0.146 s at 144 Hz, 0.150 s at 60 Hz and 0.167 s at 30 Hz: about 12% weaker on a 30 Hz device.

## Fix

Carry the leftover time: `s.cd += 0.14` / `s.cd += 2.4`. The game caps a frame at 0.05 s, which is less than either cooldown, so a tower still fires at most once per frame.

## Note

This ticket first claimed the tsunami inflow depended on frame rate. Headless runs at 20–144 Hz showed it does not: the inflow only refills the right edge to near full, and one frame between 75 ms flow steps is always enough to do that.
