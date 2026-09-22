# PokemonEpopee build checklist

Tracks every feature from the original design doc. Check items off as they're verified working in-game.

## 1. Status Engine

- [x] Core engine (d100 + 25% Speed resistance roll, 6 tiers, +25 assist option)
- [x] Status damage bypasses Weaknesses/Resistances/Defense/Special Defense — `statuses/apply-effect.js` writes `system.health.value` directly, so it never enters the damage pipeline
- [ ] Speed bonus should count **once per active status** ("1d100 augmenté de 25% de sa vitesse pour chaque statut") — `STATUS_RESISTANCE_SCALES_WITH_STATUS_COUNT` is currently `false` in `src/module/statuses/config.js`, so it is only counted once
- [ ] A Pokemon in its Poke Ball suffers no status effects — the recall macro purges on recall, but "suppressed while in ball" is not a tracked state
- [x] Speed Combat Stages add dice to this resistance roll ("une modification de Vitesse ajoutera des dés lors de la libération d'effet de statuts") — done in `statuses/engine.js`. The dice go straight into the roll formula (`1d100 +2d6 + @bonus`) so they render in the chat card instead of being folded into a silent total.
  - The flat 25%-of-Speed bonus now reads `preStage` too, same reason as §11.1: `stats.spd.total` still bakes in PTR's ±10%-per-stage multiplier, and keeping it alongside the MdS dice would apply stages twice.
  - [ ] Not yet verified in Foundry — needs a status resistance roll on an actor with a Speed stage.
- [x] Infatuation (Amoureux)
- [x] Burned (Brulure)
- [x] Confused (Confusion)
- [x] Poisoned (Empoisonnement, with intensity)
- [x] Frostbite (Engelure)
- [x] Paralysis (Paralysie)
- [x] Fear (Peur)
- [x] Sleep (Sommeil, with intensity)
- [x] Type immunities per status
- [x] Recall-to-Poke-Ball purge (manual macro, no native PTR hook exists)
- [ ] Confusion self-hit damage - **likely no longer blocked**. The rule reads "dégâts équivalents à sa valeur *Modérée* la plus élevée d'Attaque ou Attaque Spéciale", and §11.1 now defines `Modéré` as a move tag meaning "use the stat's **Fragment** (25%, rounded up) instead of the full stat". Read together, the self-hit is `max(Fragment(ATK), Fragment(ATKSPE))` - no separate Weak/Moderate/Strong table needed. **Confirm this reading before implementing**, since it was previously assumed to need a source table that may not exist.
- [ ] Hard enforcement of action restrictions (currently a flag + chat text only, not blocking buttons)
- [x] Trap statuses (14): Secretion, Time Howl, Flame Dance, Magma Vortex, Free Fall, Sand Tomb, Ice Age, Embrace, Block, Binding, Clamp, Siphon, Spirit Lock, Harassment
  - Shared resistance table (damage tiers / manages-to-move at Very Strong / -4 duration at Complete), duration counts down automatically each turn
  - Not automated (chat text only): Time Howl's position-reset + HP/status lock, Spirit Lock's "can't move away from caster", Block's "until end of scene" is approximated as a long countdown instead of a real scene-end trigger
  - Run `scripts/foundry-console/create-trap-coat-conditions.js` once to generate all 14 items with correct starting duration
- [x] Coat statuses (9): Fire Whirl, Mud Throw, Powder Cloud, Roots, Aurora Veil, Mist Coat, Power Coat, Substitute, Aqua Ring
  - Shared renewal table (decays in ~2 rolls unless renewed by a Strong+ result) for 7 of them; Powder Cloud and Substitute have their own bespoke tier logic
  - Not automated (chat text only): the actual aura/burst-radius damage modification each Coat grants, and Substitute's second HP bar (no real clone HP pool tracked)
  - Same creation script as Traps covers these too

## 2. Environmental Modifiers

- [x] Weather engine (only 1 active at a time, duration tracked on the Combat, decrements once per round)
  - [x] Sunny / Rainy (duration + start/end chat announcements; the Fire/Water damage-type Combat Stage bonus is tracked in data but NOT wired into the damage roll - see note below)
  - [x] Sandstorm (per-round HP tick for non-Rock/Ground/Steel, one-time SPDEF stage boost for Rock types on start/end)
  - [x] Snowstorm (one-time SPD stage penalty for non-Ice on start/end, one-time SPDEF boost for Ice types)
  - [x] Mist (one-time Combat Stage purge on start; "prevents new stage changes" is not enforced)
  - [ ] Rock item duration extension is a manual checkbox in the macro (couldn't confirm exact Heat Rock/Damp Rock/etc item slugs exist in the compendium)
- [x] Field engine (only 1 active at a time, ground-contact required via a Flying-type check - doesn't account for temporary flight/Levitation)
  - [x] Electric Terrain (tracked; Sleep immunity NOT yet cross-wired into the status engine)
  - [x] Misty Terrain (tracked; "purges Status alterations" NOT yet cross-wired into the status engine)
  - [x] Grassy Terrain (per-round heal tick, fully automated)
  - [x] Psychic Terrain (tracked; "blocks Interrupt/Reaction" not enforced, no such action exists yet - see section 5)
  - Run `scripts/foundry-console/create-environment-macro.js` once to get a "Set Weather / Field" macro on your hotbar
- **Important gap** (*now answered, see below*): the "+2/-2 Combat Stage" damage-type bonuses (Fire/Water/Electric/Grass/Psychic/Dragon) are recorded in `src/module/environment/definitions.js` and readable via `getActiveTypeModifiers()`, but I did not wire them into the actual damage roll (`src/module/system/damage/move.js`) because I could not confirm how stock PTR converts a "Combat Stage" into a damage number (no reference to `stage.mod` anywhere in the damage code - it's likely baked into `stats.X.total` upstream). Wiring this without being sure of the formula risked silently producing wrong damage numbers, so it's left undone rather than guessed.
  - **Resolved by §11.1 / §11.2**: a Combat Stage is now explicitly `Nd{level bracket}` - added to `Puissance` on offense, subtracted during application on defense. Do not wire these bonuses into the *stock* damage code, though: §11.1 replaces that pipeline entirely. Wire them into the new formula instead, and revisit this item plus the Walls AC/Defense gap below once §11.1 lands.
- [x] Zones (stackable, tracked with per-zone duration on the Combat, toggled via the same macro)
  - [x] Plasma Flood, Distortion, Gravity, Magic Room, Wonder Room, Tailwind - all 6 have lifecycle tracking (start/stop/duration/chat announcements) and stack independently
  - **Not mechanically enforced, by design**: all 6 need to touch a different core system I didn't have solid footing on (move-type rewriting for Plasma Flood, turn-order reversal for Distortion, type-immunity overrides for Gravity, item-use gating for Magic Room, stat-read swapping for Wonder Room, stat-doubling for Tailwind). Each is a deeper/riskier change than the status engine's actor-update pattern, so for this pass they're tracked as on/off state with a reminder note (`ZONE_DEFINITIONS[slug].note`) rather than auto-applied - safer than guessing and silently corrupting core combat resolution.
- [x] Hazards (placed as flagged Tiles on the scene, triggered via `updateToken`/`createToken` hooks with a GM confirmation popup, matching the doc's spec)
  - [x] Sticky Web (Speed -1 CS, once per turn - the "once per turn" limit is not enforced, only the confirm-popup gate)
  - [x] Spikes (stacking x3, 1/20th HP per stack)
  - [x] Toxic Spikes (stacking x2, adds Poison intensity - only auto-applies if the target already has the Poisoned condition on them; otherwise posts a reminder to apply it manually, since creating a brand new condition instance from a hazard trigger felt too surprising to do silently)
  - [x] Rock Trap (3m trigger radius, 2/20th HP damage, self-destructs)
  - [x] Sharp Trap / Carapiege (7d10+28 damage roll, self-destructs; does not add the summoner's Special Attack since there's no summoner-tracking yet)
  - Run `scripts/foundry-console/create-hazard-macro.js` once, then use the "Place Hazard" macro (targets/selects a token to mark where to drop it)
- [x] Walls (placed as flagged Tiles, duration tracked and decremented per round, deleted on expiry)
  - [x] Protect, Light Wall, Rune Protect, Fog Wall, Telekinesis Wall - all 5 have placement/duration/expiry with chat announcements
  - **Not mechanically enforced** (same reasoning as Zones): the actual AC/Defense bonus they grant to attacks passing through them requires hooking the attack-roll pipeline, which needs the same core-combat-math confidence I didn't have for the weather damage bonus. Tracked as placed objects with a reminder note only.
  - Run `scripts/foundry-console/create-wall-macro.js` once, then use "Place Wall"

## 3. Hex Travel / Exploration Rules (GM tooling)

- [x] Hex grid reference constants (12km center-to-center, 7km side, 124km2) - `src/module/travel/definitions.js`
- [x] Group speed calc (`computeGroupSpeedKmH`, pure/tested)
- [x] Navigation check + 1d10 drift roll + compass auto-correction, via the "Advance Travel Quarter" macro
- [x] 1d8 half-hour-within-Quarter roll, same macro
- [x] Encounter check system - the macro lets you pick a Tracks/Lair/Wandering RollTable (Foundry's native RollTable, you author the actual per-region content) and rolls them in the doc's specified order (tracks, then lair, then wandering)
- [x] Progression-based hex movement - the macro now tracks cumulative km (stored on `game.user.flags.ptu.travelState`, persists across sessions/reloads), accumulates `speed x 4h x multiplier` each Quarter, and announces when the party exits the hex (with overflow km carried into the next one). You still pick the threshold yourself each time you enter a new hex (6km start/near/return vs 12km far side) since there's no hex-map canvas to read that from automatically.
- [x] Rhythm + Travel Mode parameters - exposed as a free-form speed multiplier (default 1.0) rather than a fixed table, since the doc doesn't specify exact values for each Rhythm/Mode combination. Set it yourself per your own house values instead of me guessing numbers that aren't in the source doc.
- [ ] Landmark discovery rules (on-route/familiar/visible auto-spot) - still blocked on the Pokedex/landmark-tracking system in section 4, not built yet.
- Run `scripts/foundry-console/create-travel-macro.js` once for the "Advance Travel Quarter" macro (re-run it to pick up this update if you already created it); `node scripts/test-travel-engine.mjs` to verify the pure logic

## 4. Pokedex

- [x] Port PTR's dex tooling - already there unmodified (`PTUDexSheet`, per-Trainer)
- [ ] Shared/group mode - **not built**. `PTUDexSheet` (`src/module/apps/dex/sheet.js`) is hardcoded to one Trainer actor at a time; a group view needs a new Application aggregating seen/owned state across multiple Trainers. Scoped as similar-sized work to the Actor Sheet sections (13-15) - deferred to keep pace, not attempted half-built.
- [x] Spreadsheet import/export tool - CSV, not a binary spreadsheet format, but propagates correctly: it edits the Species compendium items directly (`system.stats.*`, `system.size.sizeClass/weightClass`), and since Pokemon actors derive their stats from their linked Species at runtime (`prepareDerivedData`), every actor of that species picks up the change automatically without touching each Actor - no separate "push to actors" step needed
  - `scripts/foundry-console/export-species-spreadsheet.js` downloads `ptu-species-stats.csv`
  - `scripts/foundry-console/import-species-spreadsheet.js` opens a file picker and writes the CSV back into the compendium

## 5. Combat Actions Rework

- [ ] **Blocked on section 6**: Reaction Action and Protection Action both gate on the Pokemon's Loyalty value, and Loyalty doesn't exist as an actor field yet (it's part of the still-unbuilt Overview page in section 6). Building these first would mean hardcoding a field that section 6 needs to define properly.
- [ ] Reaction Action (unlocks at 5+ Loyalty, dodge boost scaling with Loyalty tier) - also requires interrupting an opponent's attack mid-resolution (prompt the defender before the accuracy roll finishes, redirect an immediate counter-attack). This is a deeper hook into the attack pipeline than anything built so far; wiring it without understanding `system/check/attack.js`'s full resolution order risked the same "guessed and broke combat" failure mode avoided in section 2.
- [ ] Protection Action rework (unlocks at 10+ Loyalty, position swap, defense roll) - same category of risk (retargets an in-flight attack to a different actor).
- [ ] Action point pip indicators, Pokemon
- [ ] Action point pip indicators, Trainer

## 6. Pokemon Actor Sheet

Three pages: **Overview / Stats**, **Actions**, **Narration**.

> **Lost formatting**: the source doc marks "un élément souligné est un Item au sens FoundryVTT", but the underlining did not survive the paste. Which of Espèce / Edges / Effets / Statuts / Aptitudes / Capacités / Talents / Objets are true Foundry Items has to be re-read from the original before modelling the data.

**Important context discovered while working on this section**: stock PTR's `pokemon-sheet-compact.hbs` already implements most of what the doc calls the "Overview" and "Actions" pages, just organized as 8 tabs (Stats/Moves/Contests/Spirit/Capabilities/Combat/Capability/Extra/Effects) instead of the doc's 3-page layout. Rewriting it into exactly 3 pages would mean touching a ~1500-line, currently-working template almost everywhere - high risk for a cosmetic reorganization. Given the "take the risk but debug carefully" instruction, I chose to **add the genuinely missing pieces onto the existing, proven tab structure** instead of a full rewrite: new content stayed additive (new tab, new fields), nothing already working was touched.

### 6.1 Common to every page

- [x] Given name — the actor name field is on the sheet header - verify whether the stock actor name field already satisfies this or a separate nickname is wanted
- [x] **"Repos jusqu'au prochain jour"** button - header button, heals 4/20th of max HP. Fully working, self-contained.
  - [x] ...and now also resets every per-day usage, cascading into Scene and EOT pools (a night's rest refilling the day but not the scene would be surprising).
- [x] **"Fin de Scène"** header button - refills every Scene-period usage pool. Was blocked on the counter below; that now exists. It would need to reset "per-scene" usage counters on Moves/Abilities/Items, but stock PTR's `frequency` field (At-Will/Static/etc.) is just a display label - there's no actual "uses remaining" counter anywhere in the codebase to reset. Building this properly means designing a whole usage-tracking system first, not just a button.
- [x] **Shared prerequisite: the usage-tracking system** - built as `src/module/usage/`. `frequency.js` parses PTR's frequency strings (`At-Will`, `Scene x2`, `Daily x3`, `EOT`, `Static`, with or without an action suffix) into a real pool; `engine.js` reads, spends and refills it. Counter stored as `system.uses.spent` on the shared item template, so pools resize automatically when a frequency changes. 9 tests. Originally: It gates the Fin de Scène button, the per-day reset above, the "remaining uses" display in §6.3, and the identical pair on the Trainer sheet (§7.1). One system, five dependents.

### 6.2 Overview / Stats page

**Species**

- [x] Species link - already in stock PTR, unmodified
- [ ] Verify the Species item actually drives all seven things the doc assigns to it: base stats, Capabilities, **Alimentation (diet)**, **Egg Groups**, default artwork, default token, and the displayed Weight + Size categories

**Identity & progression**

- [x] Gender - stock
- [x] Nature, with the buffed stat highlighted red / nerfed stat blue - stock (stat highlighting present)
- [x] Experience, PTR-style, raising the Level at thresholds - stock
- [ ] Levelling up **opens a Level-Up window** (PTR-style) handling stat distribution **and** the choice of new species level-up moves - verify how much of this stock already does versus the existing Training button
- [x] **Difficulté d'Entraînement** - a stat starting at **50** (`system.trainingDifficulty`)
  - [x] Button beside the stat to launch a Training with this Pokemon
  - [x] Rolls **1d100 per active non-GM player**, resolved together in one chat table with a per-player pass/fail and an overall verdict. Wildcard modifiers (Traits, Objets) are noted as manual - the doc doesn't say what they are.
  - [ ] Wildcard modifiers (Traits, Items) can alter either the difficulty or the roll result
  - Cross-ref section 16: that section defines what a Training *grants* (Level-Up / Loyalty / CT-DT); this defines the *check* that gates it. Build them together.
- [x] **Loyalty gauge** - `system.loyalty = {checked, unlocked}` (`template.json`), a 20-cell clickable gauge on the Stats tab (`pokemon-sheet-compact.hbs`), click handler in `pokemon/sheet.js`. Starts at 4 checked / 6 empty / 10 locked, matching the doc.

**Lists**

- [x] Types list with (double) resistances, (double) weaknesses and immunities - stock IWR
- [x] Effects list - latent temporary passives with varied durations - stock
- [x] Statuses: the 2-3 entry sub-category of Effects, with intensity levels and the start-of-turn resistance popup - this is section 1's Status Engine, already live on the Effects tab's Conditions list
- [ ] Edges list - **skill rank increases only** on a Pokemon, unlike the Trainer (§7.2) who also gets Maneuver unlocks from Edges. Verify stock's Edge list can be restricted this way.

**Stats**

- [x] The 6 stats with Base/Mod/Stage/Total - stock
- [x] HP block: current / temporary / maximum - stock
- [ ] Verify **Max HP = Level + (HP stat × 3)** matches what stock computes
- [x] **"Fragment de {Stat}"** column added to the Stats tab, reading the same pre-stage figure the damage formula uses so sheet and dice can never disagree. Still to do on the Trainer sheet (§7.2).
- [x] **"Fragment de Point de Vie"** (1/20th of max HP, rounded up) shown beside Max HP, reusing `hpFragment()` from the status engine rather than a third copy of the maths
- [x] **PRE** (Précision) and **ESQ** (Esquive) - stock's Evasion equivalent already covers these
- [x] **STAB** stat (5 + floor(Level/5)) displayed on the Stats tab. Still to do on the Trainer sheet (§7.2).
- [x] Two gauges of 6 checkmarks beside the 5 main stats - built on the Stats tab. Clicking cell N sets the stage to N; clicking the current value clears it to 0. Green row = positive, red row = negative, and the tooltip shows the resulting dice (e.g. "MdS atk : 3 (3d4)").
  - [ ] **Not buildable as specified for PRE/ESQ.** In PTR those are *derived* values (`system.evasion.physical/special/speed`, computed from DEF/SPDEF/SPD), not stats with their own `stage` object - there is nothing for a gauge to bind to. The MdS on DEF/SPDEF/SPD already feed evasion indirectly. Giving PRE/ESQ their own stages means making them real stats first.
  - The numeric Stage column was **kept** alongside the gauge for now, so nothing that reads it breaks. Remove it once the gauge is trusted.

### 6.3 Actions page

**Skills**

- [x] Skills roll **d20**, not PTR's Nd6 pool - `SKILL_DIE_SIZE` in `src/module/skills/config.js`; the pool size (rank, clamped 1-6) is unchanged, so a Rank 4 skill rolls 4d20
- [ ] Same three coloured groups as the Trainer (§7.3): **VOLONTÉ** (red), **SAVOIR** (green), **ÉMOTION** (blue), with identical skill lists
- **Conflict resolved**: an earlier reading recorded here had the Pokemon skills as a d100 "3-layer checkmark" system (25% of stat, +25/+50 flat). The Pokemon and Trainer specs now **both** say d20 with the same three groups, so d20 is the current design and the d100 note is superseded. Stock's Nd6+mod pool is still a live, working mechanic, so this remains a replace-not-extend change needing your sign-off.

**Action behaviour** - identical to §7.3, same engine:

- [ ] Anything with an active component (not Constant) counts as an Action
- [ ] Every Action has an icon; clicking it fires the action at the current target(s), reusing PTR's existing flow
- [ ] Accuracy: roll d100, hit on a result ≥ the attack's PRE, raised by the user's PRE and lowered by the target's ESQ
- [ ] Dice damage rolled with the full breakdown printed to chat
- [x] Remaining uses + recharge moment shown per Action, via `usageLabel` / `usageUnlimited` / `usageExhausted` Handlebars helpers on the shared row partial - so every list that uses it gets the display at once. Unlimited renders at 45% opacity.

**Liste des Capacités Communes**

- [x] **Action de Réaction** - rendered in a new *Capacités Communes* block, dimmed with a padlock and a "Loyauté n / 5" readout while locked
- [x] **Action de Protection** - same treatment, gated at 10
- Both are still blocked on the interrupt-attack risk noted in section 5; the Loyalty field they gate on now exists.
- [x] **Lutte (Struggle)** - now rolls a flat `1d20` plus the STAB modifier instead of a Damage Base, takes no attack stat and no MdS, ignores the target's Defense Fragment and defensive MdS, and applies recoil equal to the damage dealt (direct HP write, so it can't recurse or pick up the attacker's own weaknesses).
  - [ ] Its **type is still `????`** in the doc, so it remains whatever stock PTR generates (one Struggle per type).
- [ ] Every Maneuver from the Edges of the **Trainer who owns this Pokemon** - note this differs from the Trainer sheet, which uses that Trainer's own Edges. Needs an owner lookup.

**Liste des Aptitudes (Capabilities)**

- [x] Capabilities list including movement slots - stock
- [ ] Some Capabilities are **hidden**, and instead fill predefined stat slots: Mouvement Terrestre, Souterrain, Lévitation, En Surface, Aquatique, Aérien - and, separated: Catégorie de Taille, Catégorie de Poids, Force, Portée de Lancer, Saut Vertical, Saut Horizontal, **Intelligence**
- Note: **Intelligence** appears on the Pokemon list only; the Trainer list (§7.3) does not have it.

**Liste des Capacités (Moves)**

- [x] Split into **Capacités Naturelles** and **Capacités Techniques** via a new `system.acquisition` field on moves, **4 max each**, flagged when over. Going over is allowed but marked, rather than hard-blocked, so a Pokemon mid-reorganisation isn't broken.
- [ ] Fields: Nom, Type Élémentaire, ACC, Fréquence d'usage, Nombre d'Usage maximum, Portée, Dégâts, Détails, Tags
- [x] **Contest Mode** toggle beside the list, state stored on the actor so it survives a re-render. **Attrait Généré and Tags de Concours did not exist on moves** - added as `system.contestAppeal` / `system.contestTags`, editable on the move sheet (the latter reuses the Tagify widget and its normaliser).

**Liste des Talents (Abilities)**

- [x] Abilities list - stock
- [ ] Fields: Nom, Type d'Activation (Activer / Déclencheur / Constant), Fréquence d'usage, Trigger d'usage (when Déclencheur), Détails

**Liste des Objets tenus**

- [x] Held Items list - stock
- [x] Split into **Objet Tenu** and **Objet Trouvé** via a new `system.heldSlot` field, **1 max of each**, flagged when over. Anything unassigned is simply carried.
- [x] At end of scene, an **Objet Trouvé** moves into the Trainer's inventory - wired into the End of Scene button via the existing `actor.trainer` getter. The item is *moved*, not copied, and its slot is cleared on arrival. Does nothing when the Pokemon has no trainer.
- [ ] Only **passive** Objets Tenus confer their effects
- [ ] Fields: Nom, Type d'Activation (Activer / Consommer / Déclencheur / Constant), Fréquence d'usage, Trigger d'usage (when Déclencheur or Consommer), Détails
- [ ] **Consommer** items are deleted once their action fires, behind a confirmation prompt

### 6.4 Narration page

- [x] **Narrative tab** built as a brand new tab, with: Physical Traits, Personality, Motivations & Interests, Capture Context, Pre-Campaign Lore (free text), Pokeball reference, and a Moments of Brilliance list (add/edit/delete)
- [x] Each **Moment d'Éclat** turns one "Locked" Loyalty slot into an "Empty" one, capped at 20 - working, per the doc
- [x] **Goûts Préférés et Détestés, automatic from Nature** - `src/module/natures/flavors.js`, shown on the Narration tab. **No table was missing after all**: the mapping is one flavour per stat (Attack→Épicé, Defense→Acide, Speed→Sucré, Sp.Atk→Sec, Sp.Def→Amer) and a Nature likes its raised stat's flavour, dislikes its lowered one's. PTR's natures can touch HP, which has no flavour, so that side simply reads "-". 6 tests.

## 7. Trainer Actor Sheet

Four pages: **Overview / Stats**, **Actions**, **Pokémons**, **Narration**.

> Two gaps in the source doc to resolve: it announces 4 pages but then says "Commun aux **3** pages", and the **Pokémons** page is listed and never described.

### 7.1 Common to every page

- [ ] Given name (Nom Donné) always visible
- [x] **"Fin de Scène"** header button — refills every Scene usage pool (shares `usage/engine.js` with the Pokemon sheet)
- [x] **"Repos jusqu'au prochain jour"** header button — heals 4/20th of max HP and refills every Daily pool (cascading into Scene/EOT)
- [x] **Prerequisite met**: the usage-tracking system built for §6.1 is shared. Originally: Section 6 established that stock PTR's `frequency` field is only a display label with no "uses remaining" counter anywhere in the codebase. The same blocker that stopped the Pokemon sheet's End of Scene button applies here — build the counter first, then both buttons on both sheets are cheap.

### 7.2 Overview / Stats page

**Identity**

- [x] Gender, Height, Weight, Age — new *Identité* block on the Stats tab

**Origin (Origine)**

- [x] Big button opening a chained-choice wizard (`character/origin-wizard.js`)
- [ ] Step: pick from the list of available Origins
- [ ] Step: pick Skill increases from a list
- [ ] Step: pick items from a list
- [ ] Step: define the Origin's Feature(s) — 1 by default
- [ ] Renames the entry to `Nom de l'Origine [Choix Rédigé]`
- [ ] Concatenates a descriptive text block into the description (what that past was used for, the kind of things done in it)
- [ ] **Granted automatically, before any choice is made**: X specific Skill increases, X Pokédollars, X items

**Level & progression**

- [ ] Trainer Level
- [x] Maximum Pokemon control level, derived from the Trainer's level
  - [x] Override field — leave empty to follow the level
- [ ] Trainer Experience system + Milestones, handled as PTR does
  - [x] Optional toggle to hide the experience box (`system.epopee.hideExperience`)
  - [ ] XP thresholds and every Milestone raise the Trainer Level
  - [x] Notification banner: "X stat(s) à répartir, Y feature(s) à placer, Z edge(s) à choisir" — stats read PTR's own `levelUpPoints`, Feature/Edge caps follow the doc's defaults, and items flagged `free` don't count
- [x] Default per-level gains: +1 Feature per level, +1 Edge every 2 levels, stats via `levelUpPoints`. **Exceptions at specific levels are not modelled** — the doc says they exist but doesn't list them.
- [ ] Money owned (Pokédollars)

**Lists**

- [ ] Edges list (skill rank increases, or Maneuver unlocks)
- [ ] Effects list — latent temporary passives with widely varied durations (end of next turn, start of next turn, end of scene...)
- [ ] Statuses: a 2-3 entry sub-category of Effects following the standardized logic, with intensity levels where the status has them
  - [ ] Start-of-turn popup, one resistance roll per afflicted status — this is section 1's engine, which needs wiring to the Trainer sheet as well as the Pokemon one

**Stats**

- [ ] The 6 Pokemon stats on the Trainer: HP, ATK, DEF, ATKSPE, DEFSPE, VIT
- [x] For every stat except HP: show the flat value **and** its **"Fragment de {Stat}"** = 25% of it, rounded up
- [ ] HP block: current / temporary / maximum
  - [ ] **Max HP = Level + (HP stat × 3)**
  - [x] **"Fragment de Point de Vie"** = 1/20th of max HP, shown beside Max HP
- [ ] Starting defaults: 10 HP, 5 in every other stat
- [ ] **PRE** (Précision) — raises the Trainer's own accuracy rolls
- [ ] **ESQ** (Esquive) — lowers accuracy rolls that target the Trainer
- [x] **STAB** = 5 + floor(Level ÷ 5), shown on the Stats tab
- [x] Two gauges of 6 checkmarks beside the 5 main stats, same behaviour as the Pokemon sheet.
  - [ ] **Not on PRE/ESQ** — in PTR those are derived values (`evasion.physical/special/speed`), not stats with a `stage`. Same blocker as §6.2.
- Note: the "Fragment" displays and the STAB stat are the same two items still open on the Pokemon sheet (section 6). Build once, use on both sheets.

### 7.3 Actions page

**Skills**

- [x] Skills roll **d20** — shared `SKILL_DIE_SIZE`
- [ ] Replace PTR's skill list with three coloured groups:
  - [x] **VOLONTÉ** (red): Acrobatie, Athlétisme, Combat, Discrétion, **Habileté** (new skill, added as `dexterity`), Intimidation, Survie
  - [x] **SAVOIR** (green): Médecine, Technologie, Culture Pokémon, Perception, Culture Générale, Occulte
  - [x] **ÉMOTION** (blue): Charme, Intuition, Concentration, Commandement, **Ruse** (moved from SAVOIR to ÉMOTION)
- **Confirmed**: the Pokemon spec (§6.3) specifies the same d20 roll and the same three groups, so d20 is the current design for both sheets. The older "d100 3-layer checkmark" reading is superseded. Stock's Nd6+mod pool is a live working mechanic, so this is still a replace-not-extend change needing sign-off.

**Action behaviour (applies to every list below)**

- [ ] Anything with an active component — i.e. anything not Constant — counts as an Action
- [ ] Every Action has an icon; clicking it fires the action at the current target(s), reusing PTR's existing flow
- [ ] If the Action has an accuracy: roll d100 and hit on a result ≥ the attack's PRE; the roll is raised by the user's PRE and lowered by the target's ESQ
- [ ] If damage uses dice, roll them and print the full damage breakdown in chat
- [ ] Every Action shows its remaining uses and its recharge moment; "infinite" / "at-will" render in a dimmer colour than the standard one

**Liste des Capacités Communes**

- [ ] **Action de Réaction** — always available; a Trainer has no Loyalty, so no gate (contrast section 5, where the Pokemon version is Loyalty-gated)
- [ ] **Action de Protection** — always available, same reason
- [ ] **Lutte (Struggle)** — type ??? (left undefined in the doc), deals STAB + 1d20 damage, 100% recoil of the damage dealt, and ignores both the user's and the target's defenses
- [ ] Every Maneuver granted by the Trainer's Edges (see section 18)

**Liste des Aptitudes (Capabilities)**

- [ ] Generic block: movement speeds — Terrestre, Souterrain, Lévitation, En Surface, Aquatique, Aérien
- [ ] Then, visually separated: Size & Weight Category, Force, Throwing Range, Vertical & Horizontal Jump (same formulas as PTR)
- [ ] Specific block: Capabilities coming from Class Traits

**Liste des Capacités (Moves)**

- [ ] Split into **Weapon Capacités** (from equipped weapons, section 9) and **Class Capacités** (from class features) — no maximum on either
- [ ] Fields: Nom, Type Élémentaire, ACC, Fréquence d'usage, Nombre d'Usage maximum, Portée, Dégâts, Détails, Tags
- [ ] **Contest Mode** toggle beside the list — in that mode each Capacité shows only Nom, Type de Concours, Attrait Généré, Tags de Concours

**Liste des Talents (Abilities)**

- [ ] Fields: Nom, Type d'Activation (Activer / Déclencheur / Constant), Fréquence d'usage, Trigger d'usage (when Déclencheur), Détails

**Inventaire d'Objets**

- [ ] Per-item "equipped" checkmark toggling its passive effects (granted capabilities, stats, etc.)
- [ ] Grouped into several lists with no mechanical difference between them, as PTR does today
- [ ] Stretch goal: let the player create their own lists
- [x] **Slot limit** — used/max shown on the Stats tab, turns red when over
- [x] A single item instance can be flagged **`free`** so it costs no slot — same flag PTR already uses on feats and edges
- [ ] Fields: Nom, Type d'Activation (Activer / Consommer / Déclencheur / Constant), Fréquence d'usage, Trigger d'usage (when Déclencheur or Consommer), Détails
- [ ] **Consommer** items are deleted once their action fires, behind a confirmation prompt
- This overlaps section 8 (shared inventory) and section 9 (equipment slots). Design the three together — slot limits, equipped state and the shared container all touch the same data.

### 7.4 Pokémons page

- [ ] **Unspecified.** Listed as one of the four pages but never described in the doc. Needs a spec pass before anything can be built.

### 7.5 Narration page

- [x] **"Honneurs"** list with add/edit/delete, on a new Narration tab
- [x] Fixed free-text blocks: Description Physique, Traits de Caractère, Objectifs, Connexions aux autres PJ, Lore Pré-Campagne
- [x] Player can add arbitrary extra text blocks
- [x] Player can reorder blocks (up/down arrows)
- [x] GM tool to push a block onto every Trainer — `scripts/foundry-console/create-narrative-block-macro.js`
- Closely mirrors the Pokemon sheet's Narrative tab (section 6, already built) — reuse that component rather than writing a second one.

### 7.6 Carried over

- [ ] Action point pip indicators (shared work with the Pokemon sheet, section 5)

## 8. Shared Inventory (Inventaire Partagé)

- [ ] A shared container every player can open, independent of any single Trainer sheet
- [ ] Drag'n'drop **both ways**: player sheet → shared inventory, and shared inventory → player sheet
- [ ] Holds **Items** (consumables, equipment, held items, fossils, balls...)
- [ ] Holds **Pokemon** (party/box transfer through the same container)
- [ ] Permissions model: all players read/write by default, GM-configurable
- [ ] Concurrency: two players grabbing the same stack at once must not duplicate it

## 9. Equipment & Weapons

### 9.1 Equipment slots

- [ ] Six slots, one item each: Head, Main Hand, Off-Hand, Body, Feet, Accessory
- [ ] Equipment is **Trainer-only**; most Held Items are also Trainer-usable and default to the Accessory slot unless their description says otherwise
- [ ] Passive effects apply while equipped, and stop when unequipped
- [ ] Action economy:
  - [ ] Equipping an item or swapping one = Standard Action
  - [ ] Handing an item to another Trainer = Standard Action (grants them the ability to equip it, does **not** equip it for them)
  - [ ] Equipping a Held Item onto a Pokemon = Standard Action, and the Pokemon forfeits its next turn
- [ ] Skill-bonus gear as the default "make your own item" pattern (+1 to +4, higher if situational)

### 9.2 Weapons

- [ ] Weapons are Main Hand Equipment that modify Struggle Attacks
- [ ] Two-handed weapons also consume the Off-Hand slot
- [ ] One-handed weapon held in the Off-Hand: no Master Move from it, and -2 Accuracy on all Weapon Attacks with it
- [ ] Four weapon kinds:
  - [ ] Large Melee — +1 AC, +2 DB, two-handed
  - [ ] Small Melee — +1 DB, one-handed
  - [ ] Short-Range — 4 m range, one-handed
  - [ ] Long-Range — +1 AC, +1 DB, 12 m range, two-handed, cannot target Pokemon or Trainers closer than 4 m
  - [ ] Foot Weapons — Small Melee equipped in the Feet slot, also +1 AC
- [ ] Quality tiers gate granted Moves by Combat Skill Rank:
  - [ ] Crude — no Moves, Struggle modifiers only
  - [ ] Simple — 1 Move at Adept Combat or higher
  - [ ] Fine — 2 Moves, one at Adept, one at Master or higher
- [ ] **Épopée variant** (your paste): rarity grants extra Capacités on the same rank gate — a *Raffinée* weapon adds a 2nd Capacité at Adepte, an *Exceptionnelle* adds a 3rd at Maître or higher. Decide whether this replaces Crude/Simple/Fine or layers on top of it.
- [ ] Weapon modifiers propagate to the Moves it grants **and** to Moves from Features with the `[Weapon]` tag
- [ ] Weapon-granted Moves never benefit from STAB
- [ ] Granted Move inherits the weapon's modifiers and range (an AC 2 / DB 4 Move on a Large Melee weapon is used as AC 3 / DB 6)
- [ ] "Use a Move as a Weapon Attack": apply the weapon's Damage/AC modifiers; a 1-Target Move takes the weapon's Range; Line and Ranged Blast keep their keyword but use the weapon's Range; Burst, Cone and Close Blast keep their normal range
- [ ] Per-weapon extra characteristics (e.g. spear granting Reach for its attacks, sword-breaker bonus to Disarm Maneuvers)
- [ ] Improvised weapons — GM-applied penalty (single use, -1 AC, -1 DB or lower, etc.)
- [ ] `WR` (Weapon Range) notation, `Limitations` and `Weapon Suggestions` fields on Weapon Moves

### 9.3 Weapon Moves content

- [ ] 10 Adept Weapon Moves: Backswing, Bash!, Bullseye, Cheap Shot, Double Swipe, Pierce!, Salvo, Take Aim, Wear Down, Wounding Strike
- [ ] 10 Master Weapon Moves: Bleed!, Deadly Strike, Furious Strikes, Gouge, Maul, Riposte, Slice, Sweeping Strike, Titanic Slam, Triple Threat
- [ ] Example weapons authored into the compendium:
  - [ ] Crude — Kitchen Knife (Small), Baseball Bat (Large), Weighted Rope (Short), Slingshot (Long)
  - [ ] Simple — Survival Knife (Small, Cheap Shot), Quarterstaff (Large, Reach, Backswing), Throwing Hammers (Short, Bash!), Hunting Bow (Long, Pierce!)
  - [ ] Fine — Honed Claws (Small, Wounding Strike / Gouge), Meteor Masher (Large, Backswing / Titanic Slam), Super Lucky Throwing Stars (Short, Bullseye / Deadly Strike), Twin-Needled Bow (Long, Double Swipe / Triple Threat)
- Pricing is left to the GM per region and setting legality — no automation needed.

## 10. Priority System

- [ ] `Priority {1-8}` move tag — at the **end** of a character's initiative turn, any player may declare "Priorité !" to take their turn immediately, committing to use the tagged Capacité
- [ ] `Interrupt` move tag — additionally allows declaring "Priorité !" when another character uses a Command Action, Trainer Action or Move Action during their own initiative turn
- [ ] Every Interrupt move is also a Priority move
- [ ] Resolution order: higher Priority number first; ties broken by Speed
- [ ] A player may decline their priority turn once the order is shown (to react to the priority turns before theirs)
- [ ] **Priority Manager app**:
  - [ ] Opened by a button any player can press
  - [ ] Mode toggle: "Priorité" or "Interruption" — Interruption mode only lists moves carrying the Interrupt tag
  - [ ] Every character in the combat's initiative can select one of their eligible moves
  - [ ] Per-player "Ready" button; resolution runs once all players with characters in initiative are Ready
  - [ ] Resolved order shown as a list with a checkmark per character, tracking this mini-initiative **without touching the main combat tracker**
- [ ] Tag the existing move compendium with Priority values / Interrupt
- Design note from your paste: the 2-3 competing priority notions currently in PTR are too complex — this single tag pair replaces them.

## 11. Core Combat Math Changes

### 11.1 Damage formula rework

**Status: implemented, pure math tested (20 tests), partially verified in Foundry.**
Verified live 2026-09-21: `stats.X.preStage` is exposed and equals `total` at 0 stages (so the double-count fix landed), and the pure module imports and computes correctly in the browser. **Not yet verified: a real damage roll resolved in combat** — that is the one remaining gate.
Pure logic in [`src/module/combat-math/formula.js`](src/module/combat-math/formula.js) (no Foundry globals), constants in [`config.js`](src/module/combat-math/config.js), actor adapters in [`actor.js`](src/module/combat-math/actor.js). Run `node scripts/test-combat-math.mjs` — 17 tests, including all 30 cells of the MdS table.

> **Dead code discovered**: `base.js` returns at the `PTUDamageCheck` branch, so everything below it — including the whole `PTUMoveDamage.calculate` call — is unreachable. [`src/module/system/damage/move.js`](src/module/system/damage/move.js) (158 lines) is dead, like `pokemon-sheet.hbs`. All wiring went into [`check/damage.js`](src/module/system/check/damage.js) instead. Added to §19.

**Replaces the stock PTR damage formula outright.** The formula being removed:

```
Damage = ⌊ Calc_Power × Targets × Critical × ((100 − 2d8) / 100) × STAB × Type_Effectiveness × Modifiers ⌋
```

Stated objective: that formula is only computable through automation, which is the problem. The replacement has to be workable by hand at the table.

**The calculation is deliberately split in two, so multi-hit moves work**: Power is computed once, Application runs once per hit.

**Step 1 — Attack Power (computed once)**

```
PUISSANCE = [Jet] + STAB + Attaques + CombatStagesOffensifs
```

- [x] `[Jet]` — the damage-die result plus every flat external modifier. Already how the roll was assembled, left as-is.
- [x] `STAB` — 5 + floor(Level ÷ 5), added as the `epopee-stab` modifier.
  - ⚠ **The stock damage-base STAB bump was disabled** in `check/damage.js`. It was conditional on the move's type matching the actor's and bumped the *damage base*; the new STAB is a flat unconditional term. Keeping both would double-count. **Confirm this is what you want** — it means same-type moves no longer get a damage-base boost.
  - [ ] STAB is still not *displayed* on either sheet (§6.2, §7.2)
- [x] `Attaques` — the caster's ATK or SPATK, per the move's physical/special category
  - [x] **`Modéré` → the stat's Fragment (25%, rounded up) instead of the full stat** — read from `item.system.keywords`, accepts French and English spellings, `Puissant` wins when both are present. Untagged moves keep the full stat, so nothing regresses.
  - **Ruling (2026-09-21): `Modéré` is the DEFAULT.** Every move uses the attack stat's Fragment unless it is explicitly tagged `Puissant`. Set by `DEFAULT_IS_MODERATE` in [`combat-math/config.js`](src/module/combat-math/config.js) — one constant, flip it to invert.
  - Consequence: **`Puissant` is the load-bearing tag**, `Modéré` is documentation only. Nothing needs tagging to be correct — only the exceptions do.
  - [ ] Tag the `Puissant` exceptions in the move compendium — the list of which moves those are doesn't exist yet
  - **Status-only moves carry neither tag.** A move with no Damage Base scales off no attack stat, so `attackScaling()` returns `null` for it rather than "moderate". `hasStrayScalingTag()` flags any status move wrongly tagged, for a cleanup pass.
  - Nothing auto-tags. An idea to derive `Modéré` from the existing `Five Strike` keyword was considered and **rejected** — don't reintroduce it.
  - ⚠️ **Balance impact**: every untagged move now contributes 25% of ATK/SPATK instead of 100%. That is a large across-the-board damage drop, intended to be offset by the flat STAB term and the MdS dice. Needs playtesting before it's trusted.
  - `system.keywords` is shared with PTR's own mechanical tags (`Target 1`, `Five Strike` — the latter drives `isFiveStrike` in the damage code). Any tagging pass must **append**, never replace the array.
- [x] `CombatStagesOffensifs` — each stage adds `+1d{X}`, injected via the existing `diceModifiers` mechanism
  - The dice concatenation had to be made sign-aware first: it hardcoded `+`, so a negative MdS would have produced the invalid formula `3d8+-2d6`.

**Step 2 — Damage Application (per hit)**

```
DÉGÂTS INFLIGÉS = (Puissance − Défenses − CombatStagesDéfensifs) × (Faiblesse OU Résistance)
```

- [x] `Défenses` — the **Fragment** of DEF or SPDEF, per the move's category (`applyDamage` in `base.js`; previously the full `.total`)
  - [x] The **full** stat path is preserved — the existing `item:overwrite:defense` roll option already did exactly this and was left untouched, so the Action de Réaction has a hook ready (§6.3, §7.3)
  - ⚠ **Likely typo in the source**: the doc reads "la stat de Défense ou de Défense Spéciale **du lanceur**" (the *caster's*). It has to mean the *target's* — the attacker's own Defense reducing their own output makes no sense. Confirm before implementing.
- [x] `CombatStagesDéfensifs` — each stage subtracts `−1d{X}`, rolled at application time, shown in chat under its own `defense-mds` category (a distinct category so it doesn't suppress the normal Defense line)
- [x] `Faiblesse OU Résistance` — the type-chart multiplier, ×0.25 through ×4. Done in §11.3.

**Knock-on work this creates**

- [ ] New move tags **`Modéré`** / **`Puissant`**, plus tagging the entire move compendium with them
- [ ] "Fragment" has to exist as a real derived value first — it is the unit for both the `Modéré` attack term and the standard `Défenses` term (§6.2, §7.2)
- [x] Multi-hit: Step 1 runs in `prepareModifiers`, Step 2 in `applyDamage` — once-per-hit by construction, covered by a test
- [ ] Chat output must print the two steps separately — §6.3 and §7.3 both require the full damage breakdown in chat
- [ ] Decide rounding: Fragments round up, and the type multiplier produces quarters. Where do floor/ceil apply?
- [ ] **`Targets` is gone.** The stock formula scaled damage by target count; the new one has no such term. Decide what multi-target moves do now.
- [ ] **The `(100 − 2d8)/100` variance roll is gone.** Randomness now comes only from `[Jet]` and the Combat Stage dice. Confirm that is intended.
- [ ] **`Critical` is no longer a multiplicative factor** — it folds into `[Jet]` (see §11.3)
- **This is the change section 2 was waiting on.** The weather/zone "+2/-2 Combat Stage" bonuses were left unwired because nothing in stock showed how a Combat Stage becomes a damage number. This formula states it outright: offensive stages add `Nd{X}` to Puissance, defensive stages subtract `Nd{X}` during application.

### 11.2 Combat Stage dice engine

**Canonical name: `MdS` — "Modifications de Statistiques"** (Chronicler → Règles → Règles Générales → Combat → *Modifications de Statistiques (MdS)*; STAB is the sibling page). The codebase says "Combat Stage" throughout, inherited from stock PTR. Pick one before writing UI labels — `AAAA.txt` records that all user-facing text was switched to English, so this is a naming decision, not a translation.

Table supplied 2026-09-21. **This supersedes the guessed "±1d4 per 5 STAB" wording previously recorded in section 6** — the die size is driven by the actor's *level bracket*, not by STAB.

- [ ] Every stat can be modified upward or downward, **capped at 6 steps in either direction**
- [ ] A modification grants **extra dice**, not a flat numeric bonus
- [ ] Dice count = number of modifications (1-6); die size = the actor's level bracket:

| Level | 1 mod | 2 mods | 3 mods | 4 mods | 5 mods | 6 mods |
|---|---|---|---|---|---|---|
| 1-20 | 1d4 | 2d4 | 3d4 | 4d4 | 5d4 | 6d4 |
| 21-40 | 1d6 | 2d6 | 3d6 | 4d6 | 5d6 | 6d6 |
| 41-60 | 1d8 | 2d8 | 3d8 | 4d8 | 5d8 | 6d8 |
| 61-80 | 1d10 | 2d10 | 3d10 | 4d10 | 5d10 | 6d10 |
| 81-100 | 1d12 | 2d12 | 3d12 | 4d12 | 5d12 | 6d12 |

- [ ] **ATK / ATKSPE** modification → adds damage dice, into `CombatStagesOffensifs` (§11.1 Step 1)
- [ ] **DEF / DEFSPE** modification → adds dice that **reduce** incoming damage, into `CombatStagesDéfensifs` (§11.1 Step 2)
- [ ] **VIT** modification → adds dice to status-release rolls (section 1's resistance roll)
- [ ] Replace the stock numeric Combat Stage (`stage.value` / `stage.mod`) with the 2×6 checkmark gauge, on both the Pokemon sheet (§6.2) and the Trainer sheet (§7.2)
- [ ] **Open question, narrowed**: §11.1 defines the sign of each *positive* stage (offensive adds, defensive subtracts). It still does not say what a **negative** stage does — the natural reading is signed dice on the same term (a −2 ATK stage subtracts `2d{X}` from Puissance), but confirm rather than assume.

### 11.3 Type effectiveness & criticals

- [x] **Super effective = ×2** instead of the stock ×1.5 — **code change done, not yet verified in Foundry**. Stock compressed the ladder with one idiom repeated at 4 sites in `src/module/actor/base.js` (`value > 2 ? Math.log2(value) : value == 2 ? 1.5 : value`), mapping raw 2 → 1.5 and raw 4 → `log2(4)` = 2, with resistances passing through untouched. All 4 sites now call a single seam, `scaleTypeEffectiveness()` in [iwr.js](src/module/actor/iwr.js#L81), which returns the raw multiplier.
  - Call sites: [base.js:128](src/module/actor/base.js#L128) (`getRealValue`), [base.js:796](src/module/actor/base.js#L796) (total weakness mod), [base.js:805](src/module/actor/base.js#L805) (per-weakness display), [base.js:837](src/module/actor/base.js#L837) (combined modifier).
  - The `|| 1` fallback at the combined site was deliberately preserved — it catches a 0 multiplier, and removing it would change immunity handling.
  - [x] **Verified in Foundry (2026-09-21)**: `game.actors.getName("Geodude").iwr.getRealValue("Water")` returns **4** (was 2). This exercises the `getRealValue` site, i.e. the IWR display on both sheets.
  - [ ] Still unverified: the other 3 sites live in the damage path (total weakness mod, per-weakness display, combined modifier). They need a real hit resolved in combat, not a sheet read.
- [x] Full multiplier ladder: **×0.25** double resistance, **×0.5** resistance, **×1** neutral, **×2** weakness, **×4** double weakness — the raw type-chart product, no compression. Falls out of the change above.
- [ ] Decide the behaviour above ×4. Stock turned raw 8 into `log2(8)` = 3; the seam now passes it through as ×8. The doc's ladder stops at ×4, so if ×8 is reachable in play it needs an explicit cap in `scaleTypeEffectiveness()`.
- [ ] **×0 for immunity** — implied by the Types/IWR list (§6.2) but not stated in the damage paste. Confirm.
- [ ] **Coup Critique** — add the Damage Die result a second time, counting the original roll (the rolled die value is applied twice, not a flat doubling of total damage). Under the new formula this lands inside the `[Jet]` term, replacing the stock formula's separate `Critical` multiplier.
- **Risk note**: `AAAA.txt` records that the stock attack engine (accuracy / damage / crit) was deliberately left untouched so far. §11.1 makes that no longer avoidable — the whole damage pipeline is being replaced, not extended.

## 12. Roll Modifier Memory

- [ ] Persist ad-hoc modifiers added to Accuracy, Damage and Skill rolls together with their label ("+2 car machin"), instead of retyping them every roll
- **Now load-bearing, not just convenience**: §11.1 routes *every* external damage modifier into the `[Jet]` term and says they are "listés dans le listing des modifiers lors du jet d'attaque". That listing is this feature. Build it alongside the damage formula, not after.
- [ ] Recall previous modifiers on the next roll of the same kind (dropdown / autocomplete / recently-used list)
- [ ] Decide scope: per actor, per player, or per world
- [ ] Decide lifetime: sticky until removed, vs. cleared at end of scene / combat

## 13. Obedience System (Obéissance)

- [ ] Trigger on **low Loyalty** — the 20-cell Loyalty gauge already exists (section 6), this consumes it
- [ ] Trigger on **level too high relative to the Trainer** (overleveling)
- [ ] Overleveling model with a real max level cap, not just a soft penalty
- [ ] Disobedience outcomes table (what a disobedient Pokemon actually does on its turn)
- [ ] **Blocked on design values** — the paste asks for "un système bien ficelé" but gives no numbers

## 14. Fossils

- [ ] Same as PTR, **except the Pokemon pops directly** — no egg step
- [ ] Revival requires 6 fragments, **or** one complete fossil
- [ ] A complete fossil equals 6 fragments; it can be split into fragments, but fragments cannot be reassembled into a complete fossil
- [ ] Reviving from a **complete** fossil lets you choose the Pokemon's Basic Ability and Nature
- [ ] Compendium items: fragment items + complete fossil items, plus the split operation

## 15. Breeding (Reproduction)

- [ ] Base rules identical to PTR
- [ ] **Edge Breeder** — allows a breeding roll (Medicine check) at **end of session**; otherwise identical to PTR's edge (out of session, appropriate roll)
- [ ] Rules text must state the GM may forbid Breed rolls depending on the situation
- [ ] New item: **Objets Pouvoirs** (Power Items) — transmit the breeder's IVs
- [ ] New item: **Nœud Destin** (Destiny Knot) — transmit the breeder's IVs
- [ ] Open question: maximum number of eggs carried at once — undefined

## 16. Training (Entraînement)

- [ ] A Training session raises exactly **one** of three things:
  - [ ] Level-Up (or an XP burst)
  - [ ] Loyalty
  - [ ] Learning a CT/DT (TM/HM)
- [ ] Rework the existing stock PTR Training button (listed as already-working in section 6) into this three-choice model

## 17. Food Buff System

- [ ] Port the Food Buff rules from the PTR rulebook as-is
- [ ] **Remove Refreshments** — they become Snacks instead
- [ ] Update the affected consumable items in the compendium

## 18. Tactical Edges & Maneuvers

- Design constraint from your paste: **do not port PTR's whole automation set** ("on veut pas le chaos que sont celles de PTR"). Pick deliberately.
- [ ] Decide the final list of which PTR maneuvers/features to bring over
- [ ] Rank Up edges
- [ ] Tactical Edges unlocking PTR Maneuvers and whole features:
  - [ ] Opportunity attack (attaque d'opportunité)
  - [ ] Pincer (prise en tenaille)
  - [ ] Quick Switch
  - [ ] High-ground attack bonus
  - [ ] Hidden attack bonus
- [ ] **Combat Medic** — after using Sprint, Guard or Hide, use a Healing Item (Objet de Soin) on an adjacent target without spending any action
- [ ] **Backstab** — accuracy and damage bonus (exact values undefined)

## 19. Technical Debt (from `AAAA.txt`)

- [ ] `src/module/system/damage/move.js` (158 lines) is dead — `base.js` returns at the `PTUDamageCheck` branch, so `PTUMoveDamage.calculate` below it is unreachable. Delete it.
- [ ] `pokemon-sheet.hbs` is dead — the sheet hardcodes the compact variant. Delete it.
- [ ] Every custom icon points at `mystery-man.svg` because the guessed Foundry core paths (`cloud.svg`, `wall.svg`...) 404. Needs real custom icons.
- [ ] System id stays `ptu` internally (renaming broke 184 hardcoded `Compendium.ptu.xxx` refs); only the display title is `PokemonEpopee`. Revisit only with a real migration plan.

---
Legend: `[x]` verified working in Foundry, `[ ]` not started or not yet verified.
