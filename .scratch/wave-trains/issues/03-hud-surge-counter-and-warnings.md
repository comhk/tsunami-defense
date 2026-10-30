# 03: On-screen surge counter and warnings

**What to build:** Players can read the surges. While a surge pours, the HUD phase label shows "⚠ Surge n / N". During a gap it shows "Next surge" and the timer counts down the real seconds to the next surge (progress ÷ wave speed). After the last surge it keeps today's tsunami label and "——" timer. About 3 real seconds before each surge after the first, a warning toast appears, and each later surge applies the same screen shake the first one does. The phase tooltip and the README wave-flow text explain that a tsunami comes in several surges. All new strings exist in both language files with matching keys. See the spec's Implementation Decisions (HUD, Surge warnings, Strings, Docs).

**Blocked by:** 02

**Status:** resolved

- [x] Tests: HUD phase label and timer show the surge counter during a surge and the next-surge countdown during a gap, in both `zh-Hant` and `en`
- [x] Tests: the warning toast fires once, about 3 s before each surge after the first, and not for the first surge
- [x] Tests: both language files define the same set of keys
- [x] Pausing during a gap freezes the countdown (no `update` while paused)
- [x] The phase tooltip and README wave-flow text mention multiple surges
