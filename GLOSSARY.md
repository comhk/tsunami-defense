# Glossary

**Surge**: One period when water pours in from the right edge during a wave, with its own start, length and strength. A wave has one or more surges. Called a *pulse* in the wave data (`pulses: [{ at, dur, power }]`).

**Bay**: The per-row focus of a wave's inflow. Rows near the bay's centre pour faster and fill higher, rows far away pour less, and the total stays the same. Each wave from wave 2 on has one bay, located from the run's seed. Its per-row values are the **row multipliers**.

**Buoy**: The warning buoy structure. Built on the beach, at most one per game. It reveals the bay through the forecast.

**Forecast**: What the buoy shows: each row's strength level (low / medium / high) as a sea-edge marker, plus the row multiplier and surge strengths on hover.

**Forecast revision**: The single update, with 10 s of prep left, from the early forecast (which may understate rows beside the bay's centre) to the true values. Revisions only go up.
