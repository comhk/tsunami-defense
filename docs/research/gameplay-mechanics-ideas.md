# Gameplay mechanics ideas: 海嘯：最後防線 / Tsunami: Last Line of Defense

Sources: games with fluid or terrain simulation, tower-defense design writing, and real tsunami science and defence reports, all cited inline. The baseline is the current `index.html` (1809 lines; `DEFS` at `index.html:147`, `WAVES` at `index.html:165`, `updateWater` at `index.html:371`, `flowStep` at `index.html:411`) and `docs/research/game-overview.md`.

**How the sources were read.** At first the sandbox firewall blocked every direct page fetch, so the claims were gathered from search-engine excerpts of the cited pages. After the network policy was widened, these pages were **fetched and checked in full**, marked ✔ below:

- NOAA JetStream and NOAA Education
- the NOAA PMEL transcript
- JMA
- GDC Vault (Noita)
- the Rogue Tower Steam page
- Wikipedia (Creeper World)

Every other URL is the page the search excerpt came from. Its host was still blocked when this note was written (see Open questions). Fan wikis (Fandom, wiki.gg) are marked *(fan wiki)*. Re-check any number before it goes into tooltips or in-game text.

## Summary

The game already has a strong core: a left-flowing per-cell water field (`index.html:411-467`), walls that erode and make water spill diagonally, towers that clear water, and a prep → tsunami → drain loop. Depth is limited by three things. Every wave behaves the same apart from length (`WAVES[].energy` only scales `inflowEnd`, `index.html:342-351`). The map is flat and identical every run. And the only stake is a single depth check on the home (`index.html:731-743`). Real tsunamis supply a lot of mechanics that fit this sim directly:

- Tsunamis arrive as **several waves**, and the first is often not the largest ([NOAA](https://www.noaa.gov/education/resource-collections/ocean-coasts/tsunamis), [USGS](https://www.usgs.gov/centers/pcmsc/life-tsunami)).
- They are sometimes preceded by **drawback** ([NOAA JetStream](https://www.noaa.gov/jetstream/tsunamis/tsunami-inundation)).
- They carry **debris** that does much of the damage ([USGS](https://www.usgs.gov/centers/pcmsc/life-tsunami)).
- They destroy seawalls mostly by **scour behind the wall** ([Natural Hazards review](https://link.springer.com/article/10.1007/s11069-022-05367-y)) and by **return flow** ([Yeh et al.](https://ir.library.oregonstate.edu/downloads/j3860c68b)).
- Real defence after 2011 is explicitly **layered**: structures for frequent events, evacuation for extreme ones ([IUGG 2015](https://www.czech-in.org/cmdownload/IUGG2015/presentations/IUGG-0473.pdf)).

On the game side, the best-fitting lessons are:

- Player-controlled flow gates ([Timberborn dev deep dive](https://www.gamedeveloper.com/design/deep-dive-timberborn-s-water-mechanics)).
- Elevation-limited weapons ([Creeper World Blaster](https://knucklecracker.fandom.com/wiki/Blaster) *(fan wiki)*).
- Telegraphed threats ([Into the Breach, Game Developer](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)).
- Push-your-luck prep phases ([Dome Keeper, Game Developer](https://www.gamedeveloper.com/business/how-dome-keeper-focuses-on-systems-that-feed-into-one-another)).
- Opt-in difficulty modifiers ([Hades Pact of Punishment](https://hades.fandom.com/wiki/Pact_of_Punishment) *(fan wiki)*).

The ranked shortlist is at the end. The top picks are wave trains, early warning with a per-row forecast, floodgates, drawback salvage, and debris.

Cost scale for this single-file Canvas codebase: **S** is under about 80 lines and touches one system. **M** is about 80–250 lines, or touches the flow step plus UI. **L** means changing the flow model or adding a new entity class with AI or pathing, plus new UI and language strings.

## What already exists (do not re-propose)

| Area | Existing mechanic | Source |
|---|---|---|
| Water | Per-cell depth, left/diagonal-left flow, frozen cells block, column 0 drains off-map | `index.html:411-467` |
| Walls | Sandbag / tree / wall / dike; water does `h*1.6` damage per step on contact | `index.html:147-151`, `index.html:446-448` |
| Towers | MG, rocket (AoE), freeze ray (freezes + clears) | `index.html:152-154`, `index.html:526` |
| Economy | Base income, recycler, supply boxes, dump → garbage trucks | `index.html:155-157`, `index.html:613`, `index.html:779` |
| Power | Plants vs consumers; a shortage halves recycler income and stops trucks | `index.html:767-776` |
| Tech | Tech center → superbase → ion cannon (radius 6, CD 45 s) | `index.html:158-162`, `index.html:975` |
| Waves | 5 waves; `energy` scales the inflow time, `speed` scales injection and progress | `index.html:165-171`, `index.html:342-351` |

## Research findings that drive the proposals

### Real tsunami behaviour

- **Wave trains.** Part of a tsunami's energy reflects and scatters, and it can create edge waves, so "the tsunami reaches a given point on the coast many times", and "the first surge is often not the largest" ([USGS Life of a Tsunami](https://www.usgs.gov/centers/pcmsc/life-tsunami)). NOAA: "The first wave in a tsunami may not be the last, the largest, or the most damaging … the danger may last for hours or days" ([NOAA Education](https://www.noaa.gov/education/resource-collections/ocean-coasts/tsunamis) ✔). The time between crests is "typically ranging from approximately five minutes to two hours", and "dangerous tsunami currents can last for days" ([NOAA JetStream](https://www.noaa.gov/jetstream/tsunamis/tsunami-inundation) ✔). The next wave can arrive before the previous one recedes, which raises water levels further ([NOAA PMEL transcript](https://www.pmel.noaa.gov/sites/default/files/atoms/files/tsunami_basics_captioning.txt) ✔).
- **Drawback.** If the trough arrives first, the sea suddenly recedes and exposes the seabed. In Phuket in 2004, "many people ventured out to explore the newly exposed ocean bottom" ([NOAA JetStream](https://www.noaa.gov/jetstream/tsunamis/tsunami-inundation) ✔). After seeing the ocean withdraw, you may have "less than a minute to get to safety" ([NOAA PMEL](https://www.pmel.noaa.gov/sites/default/files/atoms/files/tsunami_basics_captioning.txt) ✔). NOAA also lists "a sudden rise or fall of the sea level that is not related to the tide" as a natural warning ([NOAA Education](https://www.noaa.gov/education/resource-collections/ocean-coasts/tsunamis) ✔).
- **Not a breaking wall.** Most tsunamis arrive "like very strong, fast tides". Strong currents and floating debris cause much of the damage. Waves that do break often form turbulent **bores** ([USGS](https://www.usgs.gov/centers/pcmsc/life-tsunami)).
- **Rivers.** In 2011 the tsunami went about 50 km up the Kitakami River as a train of bores, and most of its energy reflected off a weir at 17 km ([Tolkova & Tanaka, arXiv](https://arxiv.org/abs/1712.10094); [NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/effects-of-the-tohoku-tsunami-on-the-kitakami-river-77379/)).
- **Debris.** Field surveys after 2004 and 2011 identified debris loading as a critical design load for ASCE 7 Chapter 6 ([Chock, ATC](https://www.atcouncil.org/files/ATC-15-13/Papers/06_CHOCKpaper.pdf)). Debris acts on structures during both inflow and outflow, and debris damming is a separate load ([Chock, PWRI](https://www.pwri.go.jp/eng/ujnr/joint/43/paper/9_Chock.pdf)).
- **Return flow.** The return-flow phase pushed seawall parts seaward. In one case the damage was on the ocean-facing side, which suggests failure during return flow ([Yeh et al., OSU](https://ir.library.oregonstate.edu/downloads/j3860c68b)). Some concrete gravity seawalls were overturned by return flow ([EERI report](https://lfestorage.s3.us-east-2.amazonaws.com/images/2011_03_11_tohoku_japan/pdfs/Japan-Tohoku-report-tsunami-bldgs.pdf)).
- **Scour.** The most common seawall and dike failure in 2011 was scour at the **landward (leeward) toe** from overtopping flow. Seaward toe scour was rare ([Natural Hazards review](https://link.springer.com/article/10.1007/s11069-022-05367-y)). The Kamaishi breakwater, the world's largest, was largely destroyed. Proposed mechanisms are overtopping-jet scour and foundation failure, and the literature disagrees on their relative weight ([ICCE / Arikawa](https://icce-ojs-tamu.tdl.org/icce/index.php/icce/article/download/6845/pdf/)).
- **Subsidence.** The 2011 earthquake lowered the Pacific coast by up to about 1.2 m (GEONET GPS) ([Earth, Planets and Space](https://earth-planets-space.springeropen.com/articles/10.5047/eps.2011.06.025)).

### Real tsunami defence

- **Two design levels.** After 2011, Japanese reconstruction guidelines adopted "multiple-defense". **L1** (about once a century) tsunamis are handled by structures. **L2** (hundreds to a thousand years) tsunamis need comprehensive measures that include evacuation ([IUGG 2015 presentation](https://www.czech-in.org/cmdownload/IUGG2015/presentations/IUGG-0473.pdf)). An MLIT document promotes "multiple protection with breakwaters and levees" ([MLIT via PIANC Japan](https://pianc-jp.org/news/859a4ea4c706fd8ca96d438e63341e3bd419aabd.pdf)).
- **Hybrid embankment + forest.** Research and an installation at Onbetsu, Hokkaido combine an embankment, a moat and a coastal forest. The embankment covers L1, and the forest is added to reduce house destruction in L2 ([Geosciences 2019](https://doi.org/10.3390/geosciences9060247); [Ocean Engineering 2024](https://www.sciencedirect.com/science/article/pii/S0029801824023473)).
- **Forests cut both ways.** Control forests could not stop the 2011 tsunami and "may also cause more damage when the trees become floating debris", as seen in Ofunato and Rikuzentakata. At Ishinomaki (about 6 m wave) the forest survived and **trapped debris such as cars** ([Pure and Applied Geophysics](https://link.springer.com/article/10.1007/s00024-012-0511-7)). Forest **density** matters more than tree rigidity for reducing onshore energy flux ([arXiv 2207.13304](https://arxiv.org/abs/2207.13304)).
- **Floodgates work even when overtopped.** The 15.5 m Fudai floodgate was closed after the quake. The roughly 20 m tsunami overtopped it, but the gate greatly reduced inundation behind it, and there were no confirmed deaths in the protected area. The exposed port outside it was wrecked ([AP via NBC News](https://www.nbcnews.com/news/amp/wbna43018489)).
- **Early warning.** JMA "issues a Tsunami Warning/Advisory for each region within around two to three minutes of the quake" ([JMA](https://www.jma.go.jp/jma/en/Activities/earthquake.html) ✔). In 2011 the first estimate (3–6 m) was raised to over 10 m about 45 minutes later. The fast JMA magnitude is less accurate for very large quakes ([GFDRR Knowledge Note 2-5](https://www.gfdrr.org/sites/default/files/publication/knowledge-note-japan-earthquake-2-5_0.pdf)). DART buoys detect deep-ocean pressure changes and feed forecast models that predict height, arrival time and affected coast ([NOAA NDBC](https://www.ndbc.noaa.gov/dart/system.shtml); [NOAA PMEL NCTR](https://nctr.pmel.noaa.gov/tda_documentation.html)).
- **Evacuation.**
  - In Kamaishi, 5 of about 2,900 schoolchildren died, and none who were at school. This is credited to drills and the *tendenko* tradition of evacuating to high ground on your own ([GFDRR Knowledge Note 2-3](https://www.gfdrr.org/sites/default/files/publication/knowledge-note-japan-earthquake-2-3.pdf); [J. Disaster Research](https://www.jstage.jst.go.jp/article/jdr/11/5/11_845/_pdf)).
  - Vertical evacuation structures are designed under FEMA P-646 ([FEMA](https://www.fema.gov/sites/default/files/documents/fema_rsl_guidelines-for-design-of-structures-for-vertical-evacuation-from-tsunamis_050925.pdf)).
  - Shizuoka Prefecture had 139 evacuation towers and artificial mounds. One tower at Oigawa Port is about 11 m tall and holds about 470 people ([FPCJ press tour notice](https://fpcj.jp/en/assistance-en/tours_notice-en/p=34181/)).

### Games with fluid or terrain simulation

- **Timberborn.** Levees block all water, dams regulate how much passes between tiles, and floodgates are player-set from solid to partly open. Droughts get harsher each cycle and switch off water sources ([Game Developer deep dive](https://www.gamedeveloper.com/design/deep-dive-timberborn-s-water-mechanics)).
- **Creeper World.** Creeper flows downhill and pools. Blasters cannot fire at higher terrain and can only clear creeper down to a fixed depth. Mortars fire over walls and clear any depth ([Knuckle Cracker Blaster](https://knucklecracker.fandom.com/wiki/Blaster) *(fan wiki)*). Creeper "must gather before rising to higher ground, like a liquid", so players build choke-points, and Creeper World 3 adds "the ability to terraform, raising and lowering the elevation of the ground" ([Wikipedia](https://en.wikipedia.org/wiki/Creeper_World) ✔).
- **From Dust (Éric Chahi).** Terrain, water and vegetation are simulated together, and players defend villages against a tsunami by reshaping land. Chahi said the malleable simulation "drove us to direct interaction with the terrain" ([Game Developer](https://www.gamedeveloper.com/game-platforms/chahi-god-game-i-from-dust-i-s-tech-determined-game-s-direction); [Destructoid](https://www.destructoid.com/the-return-of-a-master-eric-chahis-from-dust/)).
- **Noita (GDC 2019).** A falling-sand simulation of liquids and solids, with emergent gameplay. The abstract covers "scaling up the falling sand simulation to support large continuous worlds" ([GDC Vault](https://www.gdcvault.com/play/1025695/Exploring-the-Tech-and-Design) ✔). Making simulation-caused deaths readable comes from community notes on the talk ([Zhihu notes](https://zhuanlan.zhihu.com/p/521689873)), not the abstract.
- **Dwarf Fortress.** Water has seven depth levels. Floodgates linked to levers or pressure plates act as walls when closed, and moving water can carry objects that jam them ([DF Wiki: Floodgate](https://dwarffortresswiki.org/index.php/Floodgate); [DF Wiki: Pressure](http://dwarffortresswiki.org/index.php/pressure)).
- **Cities: Skylines – Natural Disasters.** Players redirect tsunamis with trenches or defences and get early warning from a Tsunami Warning Buoy ([Paradox](https://www.paradoxinteractive.com/games/cities-skylines/add-ons/cities-skylines-natural-disasters)).

### Tower-defense design

- **Mazing.** In Desktop Tower Defense, towers form the path. Creeps re-route whenever the layout changes, and the official guide suggests opening and closing paths to force backtracking ([Hand Drawn Games guide](https://www.handdrawngames.com/DesktopTD/Instructions.asp)).
- **Blockers and exposure.** Kingdom Rush barracks stop enemies so ranged towers get more time on them ([Game Developer](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design)).
- **Enemy properties that need specific counters.** BTD6 lead bloons resist sharp, energy and most ice damage ([Blooncyclopedia](https://www.bloonswiki.com/Lead_Bloon_(BTD6)) *(fan wiki)*).
- **Telegraphing.** Into the Breach made telegraphed enemy attacks "a core mechanic". Even with a known threat, avoiding it can cost something more valuable ([Game Developer](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)).
- **Push-your-luck prep.** Dome Keeper splits into mining and defending. The designer wanted "a real gameplay reason and motivation to actually go mining" ([Game Developer](https://www.gamedeveloper.com/business/how-dome-keeper-focuses-on-systems-that-feed-into-one-another)).
- **Roguelite structure.**
  - Rogue Tower: "Every level of the game you must choose a direction to expand the path". Towers improve "through card draws and cash", and experience after each game unlocks towers and permanent upgrades ([Steam](https://store.steampowered.com/app/1843760/Rogue_Tower/) ✔).
  - BTD6 Monkey Knowledge is persistent incremental upgrades in skill trees ([Blooncyclopedia](https://www.bloonswiki.com/Monkey_Knowledge_(BTD6)) *(fan wiki)*).
  - Hades' Pact of Punishment uses opt-in conditions that sum to "Heat", with rewards tied to raising it ([Hades Wiki](https://hades.fandom.com/wiki/Pact_of_Punishment) *(fan wiki)*).
  - Slay the Spire's Ascension stacks modifiers in order, starting with stat increases and later changing behaviour ([StS Wiki](https://slay-the-spire.fandom.com/wiki/Ascension) *(fan wiki)*).

## Proposals

### A. Terrain and elevation

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| A1 | **Ground height layer ("elevation-lite").** Add a `G.ground` Float32Array. A cell accepts water only when the incoming surface (`ground+water`) is above its own surface. Water can also move **up/down in the same column** toward a lower surface. | `flowStep` (`index.html:411`) compares surfaces instead of `!left`. The vertical move gives the "spill" a real basin shape, so water can be routed and **mazed** along low channels past towers. Walls keep blocking. | Maps stop being flat. High ground becomes valuable building land and channels become kill zones (water is held in tower range longer, like Kingdom Rush exposure). | **L** (flow rewrite, rendering of height, balancing) | [Creeper World](https://en.wikipedia.org/wiki/Creeper_World), [From Dust](https://www.gamedeveloper.com/game-platforms/chahi-god-game-i-from-dust-i-s-tech-determined-game-s-direction), [Timberborn](https://www.gamedeveloper.com/design/deep-dive-timberborn-s-water-mechanics), [DTD mazing](https://www.handdrawngames.com/DesktopTD/Instructions.asp) |
| A2 | **Elevation-gated towers.** With A1, the MG and freeze ray can only target cells at or below their own ground height, and the MG clears only down to a minimum depth. The rocket ignores both limits. | Uses the existing `range` check in `updateTowers` (`index.html:526`) plus one height comparison. | Gives each tower a distinct job (MG for skimming surface water, rocket for deep pools) and makes tower placement on high ground a choice. | **S** (after A1) | [Creeper World Blaster/Mortar](https://knucklecracker.fandom.com/wiki/Blaster) *(fan wiki)* |
| A3 | **Dig a moat / raise a mound.** Prep-phase tools that lower or raise `G.ground` on a cell for materials. A moat stores water, and a mound is a cheap partial wall that water can overtop. | With A1, a moat is a sink that delays the front. Pairs with the hybrid-defence bonus (C2). | A non-structure way to shape flow that cannot be destroyed by water but fills up. | **S** (after A1) | [Onbetsu hybrid defence: embankment + moat + forest](https://www.sciencedirect.com/science/article/pii/S0029801824023473), [Cities: Skylines trenches](https://www.paradoxinteractive.com/games/cities-skylines/add-ons/cities-skylines-natural-disasters) |
| A4 | **River inlet row.** One map row is a river. The tsunami enters it at a higher flow rate (`FLOW_RATE` × k) and travels far inland as **bore pulses**. A buildable **weir** across the river reflects most of the pulse. | Per-row multiplier on the flow transfer in `flowStep`. The weir is a wall variant with high HP and a damage-reflection flag. | A predictable "fast lane" the player must plug. It pairs with civilians (E1). | **M** | [Kitakami River bores and weir, arXiv](https://arxiv.org/abs/1712.10094); [NASA](https://science.nasa.gov/earth/earth-observatory/effects-of-the-tohoku-tsunami-on-the-kitakami-river-77379/) |

### B. Wave and hazard variety

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| B1 | **Wave trains.** Each `WAVES[i]` becomes a list of pulses `{at, dur, power}`, and **the biggest pulse is often the 2nd or 3rd**. Inflow switches on and off by pulse. A later pulse may arrive before the earlier water drains. | Replaces the single `waveProgress <= inflowEnd` gate in `updateWater` (`index.html:373`). Walls weakened by pulse 1 face pulse 2, so repairing mid-wave (C6) matters. | Breaks the identical shape of every wave. It creates "it's not over" tension and rewards keeping materials back. | **S** | [USGS](https://www.usgs.gov/centers/pcmsc/life-tsunami), [NOAA Education](https://www.noaa.gov/education/resource-collections/ocean-coasts/tsunamis), [NOAA PMEL](https://www.pmel.noaa.gov/sites/default/files/atoms/files/tsunami_basics_captioning.txt) |
| B2 | **Drawback event.** Some waves start with a drawback: the beach band (x ≥ 27) is exposed for a few seconds and **rare supply boxes spawn on the exposed seabed**, then the pulse hits. | Reuses `spawnBox` (`index.html:779`) with a beach-only rule and the existing box click and truck pickup. Trucks that are still on the beach when water arrives are lost (D2). | A push-your-luck moment: grab the loot or pull back. It also teaches the real warning sign. | **S** | [NOAA JetStream (Phuket 2004)](https://www.noaa.gov/jetstream/tsunamis/tsunami-inundation), [Dome Keeper](https://www.gamedeveloper.com/business/how-dome-keeper-focuses-on-systems-that-feed-into-one-another) |
| B3 | **Backwash phase.** During `drain`, water flows **right (seaward)** for a few seconds instead of only decaying. It damages the **landward face** of walls and drags debris (B4) back toward the sea. | `flowStep` gets a direction parameter (mirror the x loop). The drain decay (`decayWater`, `index.html:402`) is shortened accordingly. | The drain stops being dead time. Walls with water pooled behind them are at risk, so "seal everything" becomes a trade-off. | **M** | [Yeh et al. return flow](https://ir.library.oregonstate.edu/downloads/j3860c68b), [EERI report](https://lfestorage.s3.us-east-2.amazonaws.com/images/2011_03_11_tohoku_japan/pdfs/Japan-Tohoku-report-tsunami-bldgs.pdf) |
| B4 | **Debris.** Destroyed structures (and city blocks, if they become flood-destructible) spawn **debris** entities that move with the local flow and deal **impact damage** to the next structure. Debris piles up against walls and **dams** (counts as a temporary obstacle). | New small array driven by `G.water` gradients. Uses `destroyEntity` (`index.html:507`) as the spawner. The rocket AoE can destroy debris. | One breach cascades into more damage, which makes losing a wall a real event. Towers get a second target type besides water, like BTD's enemy properties. | **M** | [USGS (debris causes much damage)](https://www.usgs.gov/centers/pcmsc/life-tsunami), [ASCE 7 debris loads, Chock](https://www.atcouncil.org/files/ATC-15-13/Papers/06_CHOCKpaper.pdf), [Chock PWRI (inflow + outflow, damming)](https://www.pwri.go.jp/eng/ujnr/joint/43/paper/9_Chock.pdf), [BTD6 lead](https://www.bloonswiki.com/Lead_Bloon_(BTD6)) *(fan wiki)* |
| B5 | **Leeward scour.** When water overtops or spills past a wall, the wall takes **extra damage from water sitting directly behind it** (the cell at x−1). A cheap **apron** tile behind a wall cancels this. | One extra damage term in `flowStep`'s structure branch. The apron is a new 1x1 `DEFS` entry with no blocking. | Adds a placement rule ("armour the back of your dike") and a cheap support piece. | **S** | [Natural Hazards review: leeward toe scour dominant](https://link.springer.com/article/10.1007/s11069-022-05367-y), [Kamaishi breakwater, ICCE](https://icce-ojs-tamu.tdl.org/icce/index.php/icce/article/download/6845/pdf/) |
| B6 | **Aftershock / subsidence.** Random event in prep: the screen shakes, a few walls lose HP, and (with A1) a coastal strip's ground drops slightly, permanently. | Hooks into the prep branch of `update` (`index.html:705`). It uses the existing `G.shake`. | Changes the map between waves and creates repair-versus-expand decisions. | **S** | [GEONET subsidence ~1.2 m](https://earth-planets-space.springeropen.com/articles/10.5047/eps.2011.06.025) |
| B7 | **Per-row inflow profile.** Each wave has an inflow multiplier per row (a "bay" focuses water onto a few rows), rolled when the wave is created and shown via the forecast (E3). | Inflow loop in `updateWater` multiplies `injectRate` by `profile[y]`. | Different waves stress different parts of the line, so a perfect symmetric wall is no longer optimal. | **S** | [USGS (coastline scattering, edge waves)](https://www.usgs.gov/centers/pcmsc/life-tsunami) |

### C. New structures and synergies

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| C1 | **Floodgate.** A 1x1 wall with a click toggle. **Closed** it is a dike-strength wall; **open** it lets water and trucks through. A powered **auto** mode closes it when the adjacent depth passes a threshold. | `G.grid` cell is null when open (flow passes), so it works with the existing flow. Auto mode needs power (`calcPower`, `index.html:767`). | Real-time decisions during a wave: open to drain a pool behind the wall toward a tower kill zone, then close. Creates mazing-style path toggling. | **S/M** | [Fudai floodgate (AP)](https://www.nbcnews.com/news/amp/wbna43018489), [Timberborn floodgates](https://www.gamedeveloper.com/design/deep-dive-timberborn-s-water-mechanics), [DF floodgate + pressure plate](https://dwarffortresswiki.org/index.php/Floodgate), [DTD path toggling](https://www.handdrawngames.com/DesktopTD/Instructions.asp) |
| C2 | **Hybrid-defence bonus for trees.** A tree **behind** a wall/dike (landward) gets a damage-reduction aura and **catches debris** (B4). A tree **in front** (seaward), with no wall behind it, becomes **debris when destroyed**. Dense clusters (3+ adjacent trees) reduce the flow transfer through them. | Neighbour check at placement and in `flowStep`. Trees already exist (`index.html:148`), so this gives them a distinct identity instead of being a mid-tier wall. | Turns the "sandbag/tree/wall/dike" HP ladder into a layout puzzle. | **S** | [Hybrid embankment + forest](https://doi.org/10.3390/geosciences9060247), [PAGEOPH: forests as debris vs. Ishinomaki trapping cars](https://link.springer.com/article/10.1007/s00024-012-0511-7), [arXiv: density > rigidity](https://arxiv.org/abs/2207.13304) |
| C3 | **Offshore breakwater.** Buildable only on the beach band (x ≥ 27). It **reduces the inflow on its rows** and **delays** the pulse, but water hammers it at full strength and it is expensive. | Lowers `injectRate` for its rows in `updateWater`. It decays like other structures. | A front-line investment that weakens every wave until it breaks, a clear alternative to stacking dikes near home. | **S** | [MLIT multiple protection with breakwaters](https://pianc-jp.org/news/859a4ea4c706fd8ca96d438e63341e3bd419aabd.pdf), [Kamaishi breakwater](https://icce-ojs-tamu.tdl.org/icce/index.php/icce/article/download/6845/pdf/) |
| C4 | **Pump station.** A 2x2 powered building that removes water from cells in a small radius and **dumps it into a chosen outlet cell** (e.g. a moat or the river). | Moves volume rather than deleting it, so it interacts with A3 moats and C1 floodgates. Power-gated. | A "routing" tower rather than a "killing" tower. Combined with freeze it holds the front. | **M** | [Timberborn water management](https://www.gamedeveloper.com/design/deep-dive-timberborn-s-water-mechanics), [DF pumps pressurise water](http://dwarffortresswiki.org/index.php/pressure) |
| C5 | **Repair crew / sell.** Click a damaged structure to repair it at cost (prep at full speed, tsunami at reduced speed), or sell it for a partial refund. | `ent.hp` / `ent.maxHp` already exist (`index.html:491`). The overview notes there is no repair or sell code. | Makes B1 wave trains and B6 aftershocks into interesting economic choices instead of pure losses. | **S** | [Kingdom Rush: upgrade-vs-damage money trade-off](https://www.gamedeveloper.com/design/kingdom-rush---the-wonderful-campaign-level-design) |

### D. Economy and logistics

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| D1 | **Salvage from debris.** After drain, stranded debris (B4) becomes salvage that **garbage trucks** collect for materials, and the recycler converts it at a bonus. | Reuses truck seeking (`updateTrucks`, `index.html:613`) and the `income` path. | Losses partly feed back into economy, and trucks gain a second job. | **S** (after B4) | [Chock (debris types from small items to ships)](https://www.pwri.go.jp/eng/ujnr/joint/43/paper/9_Chock.pdf) |
| D2 | **Trucks respect water.** Trucks slow in shallow water and are **swept away** (lost) in deep water. They currently ignore terrain and water. | One depth lookup in `updateTrucks`. | Drawback salvage (B2) and mid-wave pickup become risky, and trucks stop being "free forever". | **S** | [NOAA: dangerous currents for days](https://www.noaa.gov/jetstream/tsunamis/tsunami-inundation), [Dome Keeper risk timing](https://www.gamedeveloper.com/business/how-dome-keeper-focuses-on-systems-that-feed-into-one-another) |
| D3 | **Flood-vulnerable power.** A plant standing in water above a threshold **trips offline** until drained. The existing shortage effects then apply (recycler halved, dumps stop). Optionally the shortage also stops towers. | `calcPower` (`index.html:767`) skips flooded producers. | Power placement starts to matter. The overview notes that towers currently ignore power, so this makes power a real defence concern. | **S** | (Design extrapolation; no primary source found for a specific game.) |

### E. Civilians and evacuation

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| E1 | **Villagers.** City blocks (`G.city`, `index.html:267`; currently decoration) house villagers. When the warning sounds they walk toward the home or an evacuation structure. **Villagers caught in deep water are lost.** Lose condition: home flooded **or** too many villagers lost. Score: villagers saved. | Villagers read `G.water` like trucks would (D2). City blocks become real stakes. | A second, spatial objective. The best wall line is no longer just "protect the home rectangle". | **L** (agents, pathing around structures, UI, strings) | [Kamaishi: drills and tendenko, GFDRR](https://www.gfdrr.org/sites/default/files/publication/knowledge-note-japan-earthquake-2-3.pdf), [J. Disaster Research](https://www.jstage.jst.go.jp/article/jdr/11/5/11_845/_pdf) |
| E2 | **Evacuation tower.** A 1x1 tall structure with **capacity** (e.g. 10). Villagers inside are safe if it survives. It blocks water like any structure. | New `DEFS` entry with `capacity`. Works with E1. | Adds a "protect people, not property" build choice. Placement within walking distance matters. | **M** (with E1) | [FEMA P-646 vertical evacuation](https://www.fema.gov/sites/default/files/documents/fema_rsl_guidelines-for-design-of-structures-for-vertical-evacuation-from-tsunamis_050925.pdf), [Shizuoka towers (139 facilities, ~470 per tower)](https://fpcj.jp/en/assistance-en/tours_notice-en/p=34181/) |
| E3 | **Warning buoy and forecast.** A buildable **buoy** on the beach. With it, the HUD shows the next wave's pulse count, per-row profile (B7) and an **estimated height that is refined** as the wave approaches; the first estimate can be low. Without it you only get a short alert. | Pure UI on top of B1/B7. One new `DEFS` entry. | Information becomes a resource to buy. Makes B1 and B7 learnable instead of random. | **S** | [JMA 2–3 min warning](https://www.jma.go.jp/jma/en/Activities/earthquake.html) ✔, [GFDRR 2-5 (2011 estimate raised from 3–6 m to >10 m)](https://www.gfdrr.org/sites/default/files/publication/knowledge-note-japan-earthquake-2-5_0.pdf), [NOAA DART](https://www.ndbc.noaa.gov/dart/system.shtml), [Cities: Skylines warning buoy](https://www.paradoxinteractive.com/games/cities-skylines/add-ons/cities-skylines-natural-disasters), [Into the Breach telegraphing](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) |
| E4 | **Evacuation drill.** A prep-phase action costing time or materials that permanently raises villager speed for the run. | Modifier on E1 movement. | A non-building investment that competes with walls for the same budget. | **S** (with E1) | [GFDRR 2-3 (education program)](https://www.gfdrr.org/sites/default/files/publication/knowledge-note-japan-earthquake-2-3.pdf) |

### F. Meta-progression and maps

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| F1 | **Score.** Combine leftover materials, intact structures and villagers saved (if E1). Store the best score in `localStorage` next to `tsunami.lang`. | `endGame` (`index.html:354`) and a few strings in `lang/*.js`. | Gives a reason to replay a won run. Most other meta ideas need it first. | **S** | [Hades Heat rewards](https://hades.fandom.com/wiki/Pact_of_Punishment) *(fan wiki)* |
| F2 | **"Sea state" modifiers.** Before a run, toggle opt-in hazards (more pulses, drawback-only waves, aftershocks, debris ×2, shorter prep, no ion cannon), each worth points that multiply the score. | Each modifier is a flag read by B1–B7. | Self-set difficulty, very cheap once the hazards exist. | **S** | [Hades Pact of Punishment](https://hades.fandom.com/wiki/Pact_of_Punishment) *(fan wiki)*, [Slay the Spire Ascension](https://slay-the-spire.fandom.com/wiki/Ascension) *(fan wiki)* |
| F3 | **Between-wave draft.** After each drain, pick 1 of 3 cards (e.g. "MG range +15%", "trees in clusters of 4+ grow 50% denser", "floodgates cost 0", "+1 truck cap"). | Modifies `DEFS` and `MAX_TRUCKS` at runtime (they are plain objects/consts; `MAX_TRUCKS` would need to be a `let`). | Every run becomes different. It pushes builds toward synergies. | **M** | [Rogue Tower card draws](https://store.steampowered.com/app/1843760/Rogue_Tower/) |
| F4 | **Coast maps.** Hand-built ground layouts (needs A1): a bay, a river delta (A4), a cliff town with high ground near home, a flat plain. Each has its own `HOME` position. | `init` (`index.html:256`) loads a map preset. | Big variety for small data. | **M** (after A1) | [Rogue Tower path variety](https://store.steampowered.com/app/1843760/Rogue_Tower/), [Cities: Skylines tsunami maps need a sea connection](https://www.paradoxinteractive.com/games/cities-skylines/add-ons/cities-skylines-natural-disasters) |
| F5 | **Persistent unlocks.** Score unlocks new structures across runs (e.g. breakwater, pump, floodgate), so new players are not overwhelmed. | `localStorage` plus a gate in `buildUI` (`index.html:1679`). | A long-term goal and an onboarding curve. | **S/M** | [BTD6 Monkey Knowledge](https://www.bloonswiki.com/Monkey_Knowledge_(BTD6)) *(fan wiki)* |

### G. Player decision pressure

| # | Proposal | Interaction with existing systems | Variety added | Cost | Inspired by |
|---|---|---|---|---|---|
| G1 | **L1 / L2 waves.** Mark some waves as **L2** in the forecast (E3): too big to stop with walls alone. The goal shifts to "home survives **and** X villagers evacuated", and some city loss is accepted. | Builds on B1, E1, E3. Changes the lose check in `update` (`index.html:731`). | Changes the question from "can I stop it?" to "what do I give up?". This matches the real post-2011 policy. | **M** | [IUGG 2015 L1/L2](https://www.czech-in.org/cmdownload/IUGG2015/presentations/IUGG-0473.pdf), [Fudai: protected area vs. exposed port](https://www.nbcnews.com/news/amp/wbna43018489) |
| G2 | **Early-start bonus.** Let the player call the wave early for bonus materials scaled by the prep time left. | Prep timer in `update` (`index.html:705`). | A risk-for-reward lever on the existing timer. | **S** | [Dome Keeper mine-or-return decision](https://www.gamedeveloper.com/business/how-dome-keeper-focuses-on-systems-that-feed-into-one-another) |
| G3 | **Readable failure.** Before a wall breaks, show cracks, highlight the cell where water will next overflow, and show a home-depth gauge in the HUD. | Rendering only (`drawEntity3D` at `index.html:1213`, `drawWaterLayer` at `index.html:1067`). | Makes sim-driven losses feel fair, which every proposal above needs. | **S** | [Noita GDC talk](https://www.gdcvault.com/play/1025695/Exploring-the-Tech-and-Design) ✔ / [notes on readability](https://zhuanlan.zhihu.com/p/521689873), [Into the Breach](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) |

## Ranked shortlist (value for effort)

| Rank | Idea | Cost | Why |
|---|---|---|---|
| 1 | **B1 Wave trains** | S | It makes every wave a different shape. Wave 2–5 tension rises at once, it puts the existing `energy` field to fuller use, and it is strongly grounded in USGS/NOAA. |
| 2 | **E3 Warning buoy + B7 per-row profile** | S | Turns randomness into readable information to plan around, Into-the-Breach style. It is mostly UI, and it pays off B1. |
| 3 | **C1 Floodgate** | S/M | The first mid-wave interactive structure. It drives real-time routing and toggling and has a strong real-world story (Fudai). |
| 4 | **B2 Drawback salvage + D2 trucks respect water** | S | A cheap push-your-luck moment that teaches a real warning sign and gives trucks some risk. |
| 5 | **C2 Hybrid-defence trees + B5 leeward scour** | S | Turns the wall HP ladder into layering rules ("forest behind dike, apron behind wall") with only a few neighbour checks. |
| 6 | **C5 Repair / sell** | S | Fills a known gap (overview) and is needed for B1/B6 to be fair. |
| 7 | **B4 Debris (+ D1 salvage)** | M | The richest new hazard: cascading breaches, a second tower target, and economy feedback. |
| 8 | **F1 Score + F2 Sea-state modifiers** | S | Once 1–7 exist, these give replay value almost for free. |
| Later | A1 Elevation, E1 Villagers, F4 Maps | L | Highest ceiling (mazing, evacuation, map variety) but each one is close to a rework of flow or agents. Prototype A1 first, since F4, A2 and A3 depend on it. |

## Design analysis: fun, difficulty, real-world lessons, depth

This section is design judgement, not sourced research. Nothing here has been playtested, and the cited games show these mechanics working elsewhere, not in this game. It scores the shortlisted ideas on four questions:

- **Fun:** is it enjoyable moment to moment?
- **Difficulty:** what does it do to challenge and fairness?
- **Real-world lesson:** does playing it teach a correct lesson about real tsunamis?
- **Depth:** does it create new decisions?

| Idea | Fun | Difficulty | Real-world lesson | Depth |
|---|---|---|---|---|
| **B1 Wave trains** | High. "It's over" becomes "is it over?" | Fair only when telegraphed. A surprise 3rd pulse feels cheap. | **Strong.** "The first wave is not the biggest; don't go back down" is a real lifesaving rule. | Holding materials back becomes a decision instead of spending everything in prep. |
| **E3 Warning buoy + B7 per-row forecast** | Medium. It is information, not action. | Lowers difficulty and adds fairness. | **Strong.** Warnings are estimates and get revised, as in 2011. | Pairs with B1: without the buoy B1 feels random, with it B1 becomes a puzzle to plan around. |
| **C1 Floodgate** | **Highest.** The only idea that gives the player something to do *during* the wave. | Adds skill: good timing beats more walls. | Good. Fudai was overtopped but still protected the town behind it. | Opening a gate to steer water into tower range is the active routing the game lacks. |
| **B2 Drawback salvage** | High push-your-luck moment. | Medium. | ⚠ **Teaches the wrong lesson as proposed.** In Phuket 2004, people died walking onto the exposed seabed. | Needs a redesign (see design rules below). |
| **D2 Trucks swept away** | Low on its own. It is a penalty. | Slightly harder. | Good. Currents stay deadly long after the wave. | Only matters together with B2 or B4. |
| **C2 Hybrid trees + B5 scour** | Medium. A satisfying layout puzzle once the rules are known. | Harder to learn: the rules are invisible unless shown. | **Strong.** Layered defence works, and a lone forest becomes debris. | Gives trees a real role instead of being a mid-HP wall. |
| **C5 Repair / sell** | Low, but basic quality of life. | Easier. | None. | Required before B1 and B6 can be fair. |
| **B4 Debris** | High. Cascading breaches are dramatic. | **Risky.** It snowballs hard and is hard to read. | Strong. Debris does much of the real damage. | Gives towers a second kind of target. Needs G3. |
| **B3 Backwash, B6 Aftershock/subsidence** | Low. Mostly penalties the player can't respond to. | Harder. | Good. | Weak without a counter-move. Better as F2 modifiers. |
| **G1 L1 / L2 waves** | High stakes. | Very hard. Only fair late in a run. | **Strongest.** After 2011, Japan's policy is that some waves can't be stopped, so you evacuate. | Changes the question from "can I stop it?" to "what am I willing to lose?". Needs E1 (L). |

### Design rules that follow

1. **Make the realistic choice the winning choice.** The game teaches whatever it rewards.
   - Rework B2 so drawback is a **warning sign that pays off if you react**: pulling trucks back and closing gates when the sea withdraws earns a bonus.
   - Boxes left on the exposed beach then become a deliberate greed trap. Losing trucks to it (D2) should feel like a mistake you were warned about.
   - Likewise, allow mid-wave repair (C5) only on structures that are out of the water.
2. **Every hazard needs a warning and a counter.**
   - pulses → buoy (E3)
   - debris → rockets and trees behind walls (C2)
   - scour → apron (B5)

   Hazards with no counter, such as B3 backwash and B6 subsidence, only raise difficulty. Keep them as opt-in F2 modifiers.
3. **Show the hidden rules.** Scour, forest bonuses and debris all happen inside the water sim. Without G3 (cracks, overflow highlights, tooltips), losses will feel arbitrary. Build G3 alongside them. The pause-time map tooltips already exist and are the natural place to explain this.
4. **The floodgate and pause.** Building is blocked while paused. Toggling a floodgate while paused would make it a planning tool; blocking it makes it a timing skill. The recommendation is to **block it**, for consistency with the build restriction.
5. **Teach through play, not text.** Repeated pulses, revised forecasts and "forest behind the dike" all come through mechanics. A one-line "real fact" on the end screen, tied to what just happened, costs little and reinforces the lesson.

### Recommended first batch

Build these together, about 4–6 S-sized changes:

- **B1** wave trains
- **E3** buoy and forecast
- **C1** floodgate
- reworked **B2** (rewards pulling back)
- **C5** repair/sell
- **G3** readable failure

Together they form a learnable loop: read the forecast, prepare, react with gates during the pulses, then repair between them. Each core piece also teaches a real tsunami lesson.

## Open questions

- Should power gate towers (D3)? The overview flagged that towers ignore power. This decides whether power is a defence concern or only an economy one.
- ~~Is wave-train variance (B1) seeded per run, or fixed per wave for learnability?~~ Resolved: surge timing is fixed per wave (`.scratch/wave-trains/spec.md`), and bay location (B7) is seeded per run (`.scratch/warning-buoy/spec.md`).
- Does an elevation model (A1) fit the half-3D renderer (`drawEntity3D`), or is a coloured height tint enough?
- Claims not marked ✔ come from search excerpts. These hosts were still blocked when this note was written: usgs.gov, gfdrr.org, gamedeveloper.com, link.springer.com, ir.library.oregonstate.edu, nbcnews.com, czech-in.org, arxiv.org, ndbc.noaa.gov, *.fandom.com, dwarffortresswiki.org, handdrawngames.com, paradoxinteractive.com, fpcj.jp, earth-planets-space.springeropen.com, jstage.jst.go.jp, atcouncil.org, pwri.go.jp, pianc-jp.org, icce-ojs-tamu.tdl.org, science.nasa.gov, bloonswiki.com, doi.org, sciencedirect.com, lfestorage.s3.us-east-2.amazonaws.com, destructoid.com. fema.gov was reachable, but the P-646 PDF was too large to fetch. Verify the Kamaishi, GEONET 1.2 m, Fudai and Shizuoka figures before using them in game text.
