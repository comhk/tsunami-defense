# 03: The early forecast is revised late in prep

**What to build:** At the start of each prep from wave 2 on, the buoy's forecast understates 1–2 rows just beside the bay's centre by one level, never the centre itself, and their hover numbers are lowered to match. With 10 s of prep left, the forecast switches to the true values. A toast names the raised rows ("Forecast revised: rows …"), and those markers flash briefly. Revisions only ever go up. A buoy built after the revision shows the true values straight away. Wave 1 has no revision. New strings are in both languages, and the README explains the revision. See the spec's Implementation Decisions (Early forecast and revision).

**Blocked by:** 02

**Status:** resolved

- [x] Tests: the early forecast understates only rows beside the centre, by one level, and never overstates
- [x] Tests: the revision fires exactly once per prep at 10 s left, with the right toast text in both `zh-Hant` and `en`, and afterwards the forecast equals the true profile
- [x] Tests: a buoy built after the revision shows the true values with no toast
- [x] Tests: wave 1 has no revision
- [ ] Marker flashing checked by playing
- [x] README explains the forecast revision
