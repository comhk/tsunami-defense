# Game overview: 海嘯：最後防線 · 半3D版 ("Tsunami: Last Line of Defense · Half-3D Edition")

Sources: `index.html` (1643 lines, all game logic, the authority) and `README.md` (50 lines, Chinese). Every line was read. Citations use `file:LINE`.

## Summary

This is a single-file, dependency-free HTML5 Canvas 2D **tower-defense / base-building** game (`README.md:3`, `index.html:117-1640`). It is played on a 32 x 16 tile grid (`index.html:122`). Water from a tsunami enters from the right edge and flows left toward the player's home (`我的家`, "My Home") on the left edge (`index.html:130`, `index.html:309-319`, `index.html:343-363`). During a timed preparation phase you gather materials (`材料`). You spend them on blocking structures, economy and power buildings, water-removing towers and a late-game super weapon. You win by surviving 5 waves (`index.html:150-156`, `index.html:672-674`). You lose when the water depth on any home tile goes above 0.55 (`index.html:131`, `index.html:646-658`). There is no score, no enemy units and no upgrade system. The only "enemy" is the water field. **Likely bug:** water injection never stops during a tsunami, so a wave apparently cannot end through normal play (see Core mechanics → Wave end).

## Premise

- Theme: "巨浪將至" ("A giant wave is coming"). Prepare, build defences, and keep the tsunami from swallowing your village and home (`index.html:104-112`).
- The map has three bands, all of them cosmetic. Green home lawn at x ≤ 4, grey city asphalt with road stripes at x 5–26, and a sandy beach at x ≥ 27 with a sea-tint gradient at x 26–28 (`index.html:213-237`).
- The home is a fixed 3 x 4 tile house at (1, 8), labelled `🏠 我的家` (`index.html:130`, `index.html:984-1030`).
- Win screen: "守住了 / 村莊平安" ("Held the line / the village is safe"). Lose screen: "家園已毀 / 海嘯吞沒了一切" ("Home destroyed / the tsunami swallowed everything") (`index.html:293-303`).

## Objective & win/lose

| Outcome | Condition | Source |
|---|---|---|
| **Lose** | During the `tsunami` phase, the max water depth over the home rectangle (x 1–3, y 8–11) is above `LOSE_DEPTH` = 0.55. The phase becomes `lose`, the screen shakes at 30, and the end screen appears after 800 ms. | `index.html:130-131`, `index.html:645-658` |
| **Wave cleared** | `tsunami` → `drain` when `waveProgress > 8` **and** total water on the map < 3. `drain` → next wave when total water < 0.6 or the drain has run longer than 6 s. | `index.html:660-665`, `index.html:667-683` |
| **Win** | After the 5th wave's drain completes (`G.wave >= WAVES.length`), the win screen shows after 500 ms with the materials you have left. | `index.html:671-675`, `index.html:293-297` |

- The home check runs only in the `tsunami` phase. It does not run during `drain` (`index.html:645-667`).
- The lose screen reports the wave you fell on (`index.html:301`). The win screen reports materials left. Nothing else is tallied, so there is no score (`index.html:296`).

## Controls

| Input | Effect | Source |
|---|---|---|
| Left click (pointerdown) | Checked in this priority order: (1) pick up a supply box on that tile; (2) if aiming the super weapon, fire it there; (3) if a build is selected, place it. Ignored on menu, win and lose screens. | `index.html:750-788` |
| Right click | Clear the build selection and super-weapon aim | `index.html:790-795` |
| `1`–`9`, `0`, `T`, `Y` | Toggle the build selection (key in `DEFS[*].key`). `Y` (superbase) is refused with the toast "需要先建造科技中心" ("Build the Tech Center first") until a Tech Center exists. | `index.html:133-146`, `index.html:797-807` |
| `R` | Enter super-weapon aim mode. Does nothing if it is locked or on cooldown. | `index.html:808-812` |
| `Esc` | Cancel selection and aim | `index.html:813-817` |
| Toolbar buttons | Same as the hotkeys. The 🛰️ 軌道離子炮 (Orbital Ion Cannon) button toggles aim mode. | `index.html:1511-1557` |
| `開始遊戲` ("Start game") / `再玩一次` ("Play again") / `重新挑戰` ("Retry") | Start or restart the game | `index.html:113`, `index.html:304`, `index.html:1636` |

You can build in **any** active phase, including during a tsunami. `placeEntity` has no phase check (`index.html:405-426`, `index.html:783-787`). Placement fails if you lack materials, if any covered tile is off-grid or occupied, or if it overlaps the home (`index.html:395-403`, `index.html:408-409`). Structures cannot be sold or repaired. No code exists for either.

## Game objects

### Buildable structures (`DEFS`, `index.html:133-146`)

Every structure occupies grid tiles and therefore blocks water (`index.html:417-420`, `index.html:353-364`). Their HP is damaged by water (`index.html:366-367`). `h` is only the visual extrusion height (`index.html:1051-1063`).

| Key | Name (中文 / English) | Cost | HP | Size | Role / special | Power draw |
|---|---|---|---|---|---|---|
| 1 | 沙包 / Sandbag | 8 | 80 | 1x1 | Cheap blocker | 0 |
| 2 | 防護林 / Shelter-belt forest | 15 | 140 | 1x1 | Blocker | 0 |
| 3 | 石牆 / Stone wall | 30 | 260 | 1x1 | Blocker | 0 |
| 4 | 堤壩 / Dike | 60 | 600 | 1x1 | Strongest blocker | 0 |
| 5 | 機槍塔 / Machine-gun tower | 40 | 150 | 1x1 | Range 3.6. Fires every 0.14 s. Removes 0.09 water from the target tile per shot (`index.html:455`, `index.html:471-486`) | 3 (`index.html:706`) |
| 6 | 火箭炮塔 / Rocket tower | 80 | 180 | 1x1 | Range 4.5. Fires every 2.4 s. 0.55 s flight. AoE radius 1.7 removes 0.18 per tile (`index.html:455`, `index.html:487-498`, `index.html:515-528`) | 3 |
| 7 | 冷凍光線塔 / Freeze-ray tower | 70 | 140 | 1x1 | Range 3.2. Continuous beam: freezes the target tile for 1.4 s and removes 0.3 water/s (`index.html:455`, `index.html:500-506`) | 3 |
| 8 | 垃圾場 / Garbage dump | 50 | 200 | 2x2 | Spawns garbage trucks (`producer`) (`index.html:536-556`) | 5 |
| 9 | 發電廠 / Power plant | 70 | 220 | 2x2 | +30 power (`power:30`, `index.html:705`) | — |
| 0 | 回收站 / Recycling station | 40 | 160 | 2x2 | +2 materials/s in prep, or +1 if power is short (`income:2`, `index.html:630-632`) | 5 |
| T | 科技中心 / Tech center | 150 | 400 | 2x2 | Unlocks building the superbase (`index.html:440-444`, `index.html:801`) | 10 |
| Y | 超級武器基地 / Super-weapon base | 300 | 500 | 2x2 | Unlocks the Orbital Ion Cannon (`index.html:442`, `index.html:808-811`) | 15 |

### Other entities

| Name | Role | Key properties | Source |
|---|---|---|---|
| 海嘯 / Tsunami water (`G.water`) | The only antagonist. A per-tile scalar depth field. | Max 1.4 per tile. Injected on column x = 31. Flows left. Damages structures it hits. | `index.html:128`, `index.html:162`, `index.html:307-388` |
| Freeze field (`G.freeze`) | Per-tile freeze timer | A frozen tile neither emits nor accepts flow | `index.html:163`, `index.html:327-330`, `index.html:346`, `index.html:356`, `index.html:375` |
| 我的家 / Home | The thing you must protect | Fixed rect x 1–3, y 8–11. You cannot build on it. It is **not** on the grid, so water flows straight through it. | `index.html:130`, `index.html:391-393`, `index.html:400` |
| 物資箱 / Supply box | Pickup | Spawns every 1.2 s in prep on a random free non-home tile (24 tries). Life is 18 s and it blinks in the last 4 s. Gives 10–17 materials. All boxes are cleared when a wave starts. | `index.html:636-641`, `index.html:718-728`, `index.html:764-768`, `index.html:1347`, `index.html:283` |
| 垃圾車 / Garbage truck | Auto-collector | Spawned only in prep, only while power is OK. Each dump spawns one every 14 s, the first after 8 s (`prodTimer:8`). Global cap is 5 (`MAX_TRUCKS`). Speed 130 px/s, straight-line movement that ignores terrain and water. It seeks the nearest box and collects it for 10–17 materials. Trucks are never destroyed and persist across waves. | `index.html:415`, `index.html:534-591` |
| City buildings (`G.city`) | Pure decoration | Up to 55 random blocks in x 5–26. Not on the grid, so they have no collision or effect. `destroyed` is never set to true. | `index.html:252-259`, `index.html:955-981` |
| Projectiles / effects / particles | Visuals, plus the rocket's delayed AoE | Bullet (0.06 s), rocket (0.55 s arc), explosion, super beam | `index.html:478-498`, `index.html:509-530`, `index.html:1378-1461` |

## Levels & progression

There is one fixed map with randomised city decoration and boxes. Progression consists of 5 waves (`WAVES`, `index.html:150-156`):

| Wave | `energy` | `speed` | `prep` (s) |
|---|---|---|---|
| 1 | 1.0 | 1.0 | 45 |
| 2 | 1.4 | 1.1 | 38 |
| 3 | 1.9 | 1.2 | 34 |
| 4 | 2.5 | 1.3 | 32 |
| 5 | 3.2 | 1.4 | 30 |

- `speed` scales the per-frame injection amount (`0.55 * speed`) and the rate of `waveProgress` (`index.html:311`, `index.html:318`). Injection already tops a tile up to near `WATER_MAX` in a single frame (0.55 is above the 0.112 gap from the 0.92 x 1.4 threshold), so `speed` changes the incoming flow very little. Its main effect is making `waveProgress > 8` arrive sooner.
- `energy` is **never read** (grep: only `index.html:151-155`).
- Prep time shrinks from 45 to 30 s. Structures, trucks and materials carry over between waves. Water and freeze fields are reset (`index.html:676-681`).
- Tech progression: Tech Center → Super-weapon Base → Orbital Ion Cannon (`index.html:440-444`, `index.html:801`, `index.html:1549-1555`). Unlocks are re-evaluated whenever a tech or superbase is built or destroyed (`index.html:424`, `index.html:437`). Losing the Tech Center does **not** disable an already-built superbase, because `superUnlocked` only checks that the superbase exists (`index.html:442`).

## Core mechanics

### Phase state machine
`menu` → `prep` → `tsunami` → `drain` → (`prep` again, or `win`), or `tsunami` → `lose` (`index.html:160`, `index.html:263-305`, `index.html:623-684`). The main loop uses `requestAnimationFrame` with `dt` capped at 0.05 s (`index.html:1620-1627`).

### Water simulation (`index.html:307-388`)
- **Injection:** each frame of `tsunami`, every tile in column x = 31 that is below 0.92 x 1.4 is raised by `0.55*speed`, capped at 1.4. This is applied **per frame, not scaled by dt**, so injection depends on frame rate (`index.html:310-317`).
- **Flow step:** runs every `FLOW_INTERVAL` = 0.075 s using a double buffer (`index.html:331-342`, `index.html:387`). It scans x from 31 down to 1. For each unfrozen tile with depth h ≥ 0.02 it moves `transfer = 0.55*h`:
  - If the left neighbour is empty and unfrozen, it moves `min(transfer, room)` left (`index.html:356-363`).
  - If the left neighbour is a structure, the structure loses `h*1.6` HP. At ≤ 0 HP it is destroyed. The water then spills diagonally to the free, unfrozen tiles at (x-1, y±1), each getting 55% of the remainder (`index.html:364-384`).
  - If the left neighbour is an empty but frozen tile, nothing moves (`index.html:356`, `index.html:364`).
- Water only moves left or diagonally-left. Water at x = 0 never moves, so it pools at the left edge where the home is (`index.html:343`).
- Damage rate: a full tile (1.4) deals 2.24 HP per step, about 30 HP/s. A sandbag facing full water lasts about 2.7 s and a dike about 20 s (my arithmetic from `index.html:128-129`, `index.html:366`).
- **Drain:** in `drain`, every tile decays by a factor of `0.35^dt` and snaps to 0 below 0.008 (`index.html:321-326`).

### Towers (`index.html:447-531`)
Each tower picks the **deepest** water tile within its Euclidean range, with a minimum depth of 0.08 (`index.html:458-466`). Towers work in any phase and are **not** gated by power (no `power.ok` check in `updateTowers`). The frost tower's freeze also stops inflow, so a frozen tile acts as a temporary ice wall (`index.html:356`, `index.html:375`).

### Super weapon: 軌道離子炮 / Orbital Ion Cannon (`index.html:820-842`)
It requires an existing superbase and a cooldown of 0. Clicking sets water to 0 and freezes for 2.5 s every tile within radius 6, then starts the 45 s cooldown. The cooldown ticks in every phase (`index.html:597`). It is not gated by power.

### Economy / resources
- Start with 80 materials (`index.html:267`).
- Prep-only income: 3/s base, plus `income` per recycling station (x0.5 if power is short) (`index.html:626-634`). No passive income during the tsunami or drain phases.
- Supply boxes: click or truck pickup for 10–17 each (`index.html:578-579`, `index.html:764-765`).

### Power (`index.html:689-715`)
- Production = 30 per power plant. Consumption = 3 per tower, 5 per dump, 5 per recycler, 10 per tech center, 15 per superbase (`index.html:704-711`). `ok = cons <= prod` (`index.html:714`).
- Effects of a power shortage: recycler income is halved (`index.html:631`) and dumps stop producing trucks (`index.html:538`). Nothing else is affected.
- The HUD shows `cons/prod`, and the pill turns red when power is short (`index.html:1561-1563`).
- The first loop in `calcPower` (`index.html:690-701`) computes `prod`/`cons` that are never used. It is dead code.

### Wave end (likely bug)
Injection is unconditional for the whole `tsunami` phase (`index.html:310-319`). Nothing stops it when `waveProgress > 8`. The phase can only advance when total map water drops below 3 (`index.html:662`). Column 31 alone holds about 16 x 1.29+ ≈ 20 units every frame. I ran a headless re-implementation of the flow code (scratchpad, not committed):
- No defences: the home floods in about 3.8 s.
- An indestructible full-height wall at x = 10: the home never floods, and total water stays around 470 indefinitely, so the wave never ends.

Towers remove far less than this (MG about 0.64/s, rocket about 0.08 x tiles/s, frost 0.3/s), and the ion cannon's cleared tiles on the edge are refilled the very next frame. As written, it appears the game cannot reach `drain` or `win`. This needs confirming in a browser.

### Rendering ("半3D" / half-3D)
Structures are drawn as flat extruded boxes: a darker front face of height `h`, a top face shifted up by `h`, a shadow, and an HP bar when HP < 95% (`index.html:1045-1099`). Painter's sort is by bottom row (`index.html:1033-1043`). There is screen shake (`index.html:869`), an animated water colour/foam/ice overlay (`index.html:899-952`), and the canvas scales to the window with a cap of 1.3x (`index.html:1613-1616`).

## Gameplay loop

1. **Prep** (45→30 s, countdown in the HUD): collect boxes by clicking or with trucks, earn passive income, and build. The usual pattern is economy (dump, recycler, power plant) followed by a sealed defensive line and towers. Higher tiers are Tech Center → Superbase (`index.html:624-643`).
2. **Tsunami** (`⚠ 海嘯來襲`, "Tsunami incoming"): boxes vanish and water floods in from the right. Structures erode, gaps get flanked by diagonal spill, and towers remove water. You can keep building and fire the ion cannon (`index.html:278-287`, `index.html:645-666`).
3. **Drain** (`海水退去…`, "Water receding"): water decays exponentially for up to 6 s (`index.html:667-670`).
4. Repeat with a shorter prep time until wave 5 is cleared, or lose when the home floods.

## Tunable parameters

| Constant | Value | Source |
|---|---|---|
| `COLS`, `ROWS` | 32, 16 | `index.html:122` |
| `TX`, `TY` (tile px) | 30, 24 | `index.html:123` |
| `WORLD_X`, `WORLD_Y` | 0, 56 | `index.html:124` |
| `WATER_MAX` | 1.4 | `index.html:128` |
| `FLOW_INTERVAL` | 0.075 s | `index.html:129` |
| `HOME` | {x:1, y:8, w:3, h:4} | `index.html:130` |
| `LOSE_DEPTH` | 0.55 | `index.html:131` |
| `DEFS` | see table above | `index.html:133-146` |
| `SUPER` | cd 45 s, radius 6 | `index.html:148` |
| `WAVES` | see table above | `index.html:150-156` |
| `MAX_TRUCKS` | 5 | `index.html:534` |
| Starting materials | 80 | `index.html:161`, `index.html:267` |
| Base prep income | 3/s | `index.html:629` |
| Box spawn interval / life / value | 1.2 s / 18 s / 10–17 | `index.html:637`, `index.html:725`, `index.html:578`, `index.html:764` |
| Truck speed / dump spawn interval / first spawn | 130 px/s / 14 s / 8 s | `index.html:548`, `index.html:543`, `index.html:415` |
| Injection | `0.55*speed` per frame, threshold 0.92 x max | `index.html:311-316` |
| Flow transfer / spill fraction | 0.55 x h / 0.55 of remainder | `index.html:350`, `index.html:377` |
| Water→structure damage | h x 1.6 per flow step | `index.html:366` |
| Tower ranges (mg/rocket/frost) | 3.6 / 4.5 / 3.2 | `index.html:455` |
| MG fire rate / removal | 0.14 s / 0.09 | `index.html:474-476` |
| Rocket CD / flight / AoE / removal | 2.4 s / 0.55 s / r 1.7 / 0.18 | `index.html:490-495`, `index.html:517-523` |
| Frost freeze / removal | 1.4 s / 0.3 per s | `index.html:504-505` |
| Super freeze | 2.5 s | `index.html:831` |
| Wave end thresholds | progress > 8 and total < 3; drain total < 0.6 or 6 s | `index.html:662`, `index.html:670` |
| Drain decay | x0.35 per second | `index.html:323` |
| Power costs | tower 3, dump 5, recycler 5, tech 10, superbase 15; plant +30 | `index.html:142`, `index.html:704-711` |

## README vs code discrepancies

1. `README.md:46` says `WAVES` holds "能量 / 速度 / 準備秒數" ("energy / speed / prep seconds"). `energy` exists (`index.html:151-155`) but is **never used**.
2. `README.md:45` says `DEFS` includes "阻水" ("water blocking"). Every def has `block:true` (`index.html:134-145`), but `block` is **never read**. Blocking comes from grid occupancy, so every structure blocks, including towers and buildings.
3. `README.md:11` says "電力不足收益減半" ("income halves when power is short"). In the code only the recycler bonus is halved; the base 3/s is unaffected (`index.html:629-631`). A shortage also **stops truck production** (`index.html:538`), which the README doesn't mention. Towers, the Tech Center and the Superbase keep working with no power, although the README lists them as power consumers (`README.md:11`).
4. `README.md:5` and the intro text (`index.html:111`) say "撐過 5 波即勝利" ("survive 5 waves to win"). By the analysis above, a wave may never end in practice (`index.html:310-319`, `index.html:662`).
5. `README.md:9` says water spreads "向兩側" ("to both sides"). In the code the spill is to the diagonal-left tiles (x-1, y±1), never straight up or down in the same column (`index.html:370-374`).
6. `README.md:12` says the Tech Center unlocks the super base. That is accurate, but once built the superbase keeps working even if the Tech Center is destroyed (`index.html:442`). Minor.
7. `README.md:21` maps `1`–`0`, `T`, `Y` to the buildings in order, which matches `index.html:134-145`.

## Open questions

- Is the never-ending wave (unconditional injection) a real bug in the browser, or did I miss a stopping rule? Nothing in the code stops injection. Fixing it probably means gating injection on `waveProgress < N` or using `energy`. Needs a manual playtest.
- What was `energy` meant to do? Total volume, duration or damage? (`index.html:151-155`)
- Should towers, the Tech Center and the Superbase need power? They only add to consumption (`index.html:706-710`).
- Water flows through the home and pools at x = 0 because the home is not a grid obstacle and x = 0 never flows out (`index.html:343`, `index.html:391-393`). Is that intended?
- Injection is per frame rather than per second, so behaviour varies with refresh rate (`index.html:312-316`, `index.html:1622`).
- `G.city[].destroyed` and `G.toastTimer` are never used (`index.html:176`, `index.html:257`, `index.html:845`). Were city buildings once meant to take flood damage?
- The `canvas` click handler ignores the `drain` phase only in the sense that it allows everything. Is building or firing during drain intended? (`index.html:758`)
