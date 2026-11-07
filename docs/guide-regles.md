# Guide MJ : les options des règles d'automatisation

Ce guide liste ce qu'on peut écrire dans les champs **Path**, **Selectors**, **Value** et
**Predicate** de l'onglet Règles d'un objet. Ces champs sont du texte libre : Foundry ne propose
aucune liste et n'avertit pas toujours en cas de faute de frappe.

La section 6 donne le relevé de ce que les compendiums utilisent vraiment.

## 1. Les types de règles

| Règle | Rôle |
|---|---|
| `ActiveEffectLike` | Modifie un champ de l'acteur (Path) |
| `FlatModifier` | Ajoute un bonus à un jet (Selectors) |
| `ApplyEffect` | Applique un effet quand une capacité touche ou inflige des dégâts |
| `EphemeralEffect` | Applique un effet le temps d'un jet |
| `GrantItem` | Donne un objet, une capacité, un talent… |
| `ChoiceSet` | Demande un choix au joueur |
| `RollOption` | Crée une option utilisable dans les Predicates |
| `Effectiveness` | Change les résistances et faiblesses |
| `TypeOverwrite` | Remplace le type de l'acteur |
| `TemporarySpecies` | Change temporairement l'espèce |
| `TempHP` | Donne des PV temporaires |
| `ActionPoint` | Modifie les points d'action |
| `TokenImage`, `TokenName`, `TokenLight` | Modifient le token |

## 2. Path (ActiveEffect-Like)

Tout champ de l'acteur est accepté. La structure complète est dans `template.json`. Pour la voir
en jeu, tape `game.actors.getName("Nom").system` dans la console (F12).

| Effet | Path |
|---|---|
| Stat de base | `system.modifiers.baseStats.<stat>.mod` |
| Mod de stat | `system.stats.<stat>.mod.mod` |
| Paliers (MdS) | `system.stats.<stat>.stage.mod` |
| Évasion | `system.modifiers.evasion.physical.mod` (ou `special`, `speed`) |
| Réduction de dégâts | `system.modifiers.damageReduction.physical.mod` (ou `special`) |
| Bonus de CA | `system.modifiers.acBonus.mod` |
| Plage de critique | `system.modifiers.critRange.mod` |
| Initiative | `system.modifiers.initiative.mod` |
| Portée d'effet | `system.modifiers.effectRange.mod` |
| Bonus aux compétences | `system.modifiers.skillBonus.mod` |
| Jets de sauvegarde | `system.modifiers.saveChecks.mod` |
| Points à dépenser | `system.modifiers.statPoints.mod`, `featPoints.mod`, `edgePoints.mod` |
| Crans de résistance | `system.modifiers.resistanceSteps.mod` |
| Déplacement | `system.modifiers.capabilities.<nom>` (`overland`, `sky`, `swim`, `levitate`, `highJump`, `longJump`…) |
| Modificateur de compétence | `system.skills.<clé>.modifier.mod` |

- `<stat>` : `hp`, `atk`, `def`, `spatk`, `spdef`, `spd`.
- `<clé>` : `acrobatics`, `athletics`, `charm`, `combat`, `command`, `generalEd`, `medicineEd`,
  `occultEd`, `pokemonEd`, `techEd`, `dexterity`, `focus`, `guile`, `intimidate`, `intuition`,
  `perception`, `stealth`, `survival`.
- **Mode** : `add`, `subtract`, `multiply`, `upgrade`, `downgrade`, `override`, `remove`.
- **Phase** : `applyAEs` (par défaut), `beforeDerived`, `afterDerived`, `beforeRoll`.

## 3. Selectors (Flat Modifier)

Un Flat Modifier sans selector est invalide et n'applique rien.

Dans ce tableau, `<X>` peut être l'id ou le slug de la capacité, sa catégorie (`physical`,
`special`, `status`), son type (`fire`, `water`…) ou sa fréquence (`at-will`…). Dans une règle
posée sur la capacité elle-même, `{item|id}` donne son id.

| Quand | Selectors |
|---|---|
| Jet d'attaque | `all`, `attack`, `attack-roll`, `<X>-attack`, `melee-attack`, `ranged-attack`, `self-attack`, `struggle-attack` |
| Dégâts | `all`, `damage`, `damage-roll`, `<X>-damage`, `melee-damage`, `ranged-damage`, `self-damage`, `struggle-damage` |
| Valeur de DB | `damage-base`, `<X>-damage-base` |
| Dés de dégâts | `damage-dice`, `<X>-damage-dice` |
| Plage de critique | `crit-range`, `<X>-crit-range` |
| Portée d'effet | `effect-range`, `<X>-effect-range` |
| Compétences | `all`, `check`, `skill-check`, `skill-<clé>` |
| Initiative | `all`, `initiative` |
| Jets de sauvegarde | `save-check` |
| Mode Hyper | `hypermode` |
| Lancer de Poké Ball | `all`, `attack-roll`, `pokeball-throw`, `<id>-attack-roll` |
| Capture | `all`, `capture-roll`, `capture-check`, `capture-dc`, `<id>-capture-roll` |

**Pour ApplyEffect et EphemeralEffect uniquement :** `damage-received`, `damage-dealt`,
`<X>-damage-received`, `<X>-damage-dealt`. Un Flat Modifier posé dessus n'a aucun effet.

## 4. Value

| Forme | Exemple |
|---|---|
| Nombre | `1` |
| Formule | `floor(@actor.system.level.current / 20) + 1` |
| Valeur injectée | `{actor\|system.health.total}`, `{item\|system.quantity}` |
| Choix d'un ChoiceSet | `{item\|flags.pe.rulesSelections.<flag>}` |
| Dés (selector `damage-dice`) | `1d10` |
| Paliers | Bouton « Primitive » : tranches début / fin / valeur, lues sur un champ comme `actor\|system.health.percent` |

## 5. Predicate

Vide, la règle s'applique toujours. Plusieurs conditions doivent toutes être vraies. Pour voir
les options d'un acteur en jeu : `game.actors.getName("Nom").getRollOptions()` dans la console.

| Préfixe | Exemples |
|---|---|
| Acteur | `self:type:pokemon`, `self:types:fire`, `self:pokemon:shiny` |
| Objets et états sur l'acteur | `ability:<slug>`, `capability:<slug>`, `effect:<slug>`, `condition:<slug>`, `species:<slug>` |
| Cible | `target:types:fire`, `target:condition:poisoned`, `target:distance:4+`, `target:flanked` |
| Capacité | `move:type:fire`, `move:category:physical`, `move:frequency:at-will`, `move:range:<x>`, `move:damage-base:<n>`, `move:ac:<n>`, `move:is-stab`, `move:<mot-clé>` |
| Compétence | `skill:charm`, `skill:<rang>` |
| Objet | `item:equipped`, `item:enabled`, `item:slug:<slug>` |

Les options `target:` et `move:` n'existent que pendant un jet.

**Opérateurs :**

| Opérateur | Exemple | Vrai si |
|---|---|---|
| `not` | `{"not": "target:types:ghost"}` | La cible n'est pas Spectre |
| `or` | `{"or": ["move:type:fire", "move:type:water"]}` | Au moins une condition est vraie |
| `and` | `{"and": ["move:is-stab", "target:flanked"]}` | Toutes sont vraies |
| `nor` | `{"nor": ["condition:sleep", "condition:frozen"]}` | Aucune n'est vraie |
| `gte`, `gt`, `lte`, `lt` | `{"gte": ["move:damage-base", 6]}` | La capacité a une DB d'au moins 6 |
| `gte` avec une valeur | `{"gte": ["{actor\|system.health.injuries}", 3]}` | L'acteur a au moins 3 blessures |
| `eq` | `{"eq": ["{item\|flags.pe.rulesSelections.choix}", "mind"]}` | Le choix vaut `mind` |

**À éviter :** dans le code actuel, `nand` est vrai quand toutes ses conditions sont vraies, et
`if`/`then` quand les deux le sont. Ils ne suivent donc pas leur sens logique habituel. Utilise
plutôt `not`, `and` et `or`.

## 6. Relevé des compendiums

Nombre d'usages entre parenthèses. Compendiums relevés : abilities, capabilities, edges, effects,
feats, items, poke-edges, moves, maneuvers, spirit-actions. Les conditions `species:<slug>`,
nombreuses, sont regroupées.

### Path

- `system.modifiers.baseStats.spd.mod` (190)
- `system.modifiers.baseStats.hp.mod` (97)
- `system.stats.def.stage.mod` (91)
- `system.modifiers.baseStats.def.mod` (87)
- `system.stats.atk.stage.mod` (81)
- `system.modifiers.baseStats.spatk.mod` (76)
- `system.stats.spd.stage.mod` (75)
- `system.stats.spdef.stage.mod` (73)
- `system.stats.spatk.stage.mod` (73)
- `system.modifiers.baseStats.atk.mod` (71)
- `system.modifiers.baseStats.spdef.mod` (51)
- `system.modifiers.evasion.speed.mod` (44)
- `system.modifiers.evasion.physical.mod` (43)
- `system.modifiers.evasion.special.mod` (43)
- `system.modifiers.damageReduction.physical.mod` (30)
- `system.modifiers.damageReduction.special.mod` (30)
- `system.modifiers.acBonus.mod` (20)
- `system.modifiers.initiative.mod` (18)
- `system.modifiers.critRange.mod` (12)
- `system.modifiers.capabilities.all` (9)
- `system.modifiers.effectRange.mod` (8)
- `{item|flags.pe.rulesSelections.feat}` (8)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.auraguardian}.mod` (7)
- `system.modifiers.resistanceSteps.mod` (6)
- `system.modifiers.skillBonus.mod` (6)
- `system.modifiers.capabilities.levitate` (5)
- `system.modifiers.capabilities.sky` (5)
- `{item|flags.pe.rulesSelections.{item|id}}` (5)
- `system.modifiers.damageReduction.special.value` (4)
- `system.modifiers.damageReduction.physical.value` (4)
- `system.stats.def.stage.value` (4)
- `system.stats.spdef.stage.value` (4)
- `system.modifiers.capabilities.overland` (3)
- `system.modifiers.capabilities.highJump` (2)
- `system.modifiers.capabilities.longJump` (2)
- `system.skills.generalEd.modifier.mod` (2)
- `system.skills.medicineEd.modifier.mod` (2)
- `system.skills.occultEd.modifier.mod` (2)
- `system.skills.pokemonEd.modifier.mod` (2)
- `system.skills.techEd.modifier.mod` (2)
- `system.skills.focus.modifier.mod` (2)
- `system.skills.guile.modifier.mod` (2)
- `system.skills.intuition.modifier.mod` (2)
- `system.skills.stealth.modifier.mod` (2)
- `system.skills.survival.modifier.mod` (2)
- `system.modifiers.capabilities.swim` (2)
- `system.stats.{item|flags.pe.rulesSelections.beastboost}.stage.mod` (2)
- `system.stats.{item|flags.pe.rulesSelections.confidence}.stage.mod` (2)
- `system.stats.{item|flags.pe.rulesSelections.darkshroud}.stage.mod` (2)
- `{item|flags.pe.rulesSelections.offense}` (2)
- `system.spirit.max` (2)
- `system.stats.spdef.mod.mod` (2)
- `system.modifiers.saveChecks.mod` (2)
- `system.modifiers.featPoints.mod` (2)
- `system.modifiers.edgePoints.mod` (2)
- `{item|flags.pe.rulesSelections.ambientAuraFeat}` (2)
- `system.stats.spd.mod.mod` (2)
- `system.modifiers.capabilities.teleporter` (1)
- `system.skills.acrobatics.modifier.mod` (1)
- `system.skills.athletics.modifier.mod` (1)
- `system.skills.charm.modifier.mod` (1)
- `system.skills.combat.modifier.mod` (1)
- `system.skills.command.modifier.mod` (1)
- `system.skills.intimidate.modifier.mod` (1)
- `system.skills.perception.modifier.mod` (1)
- `{item|flags.pe.rulesSelections.basicSkills}` (1)
- `system.modifiers.capabilities.power` (1)
- `system.skills.{item|flags.pe.rulesSelections.skillEnhancement1}.modifier.mod` (1)
- `system.skills.{item|flags.pe.rulesSelections.skillEnhancement2}.modifier.mod` (1)
- `system.modifiers.capabilities.throwingRange` (1)
- `system.stats.{item|flags.pe.rulesSelections.athleteTraining1}.stage.mod` (1)
- `system.stats.{item|flags.pe.rulesSelections.athleteTraining2}.stage.mod` (1)
- `{item|flags.pe.rulesSelections.default}` (1)
- `system.modifiers.capabilities.fly` (1)
- `system.modifiers.hardened` (1)
- `flags.pe.iceBall` (1)
- `flags.pe.rollout` (1)
- `system.stats.spd.mod` (1)
- `system.skills.{item|flags.pe.rulesSelections.smt2}.modifier.mod` (1)
- `system.modifiers.damageBonus.physical.mod` (1)
- `system.modifiers.damageBonus.special.mod` (1)
- `{item|flags.pe.rulesSelections.defense}` (1)
- `flags.pe.identified` (1)
- `system.stats.{item|flags.pe.rulesSelections.disguise}.stage.mod` (1)
- `flags.pe.acuity` (1)
- `flags.pe.vigor` (1)
- `{item|flags.pe.rulesSelections.auraReaderFeat}` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.blazinginferno}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.burningpassion}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.darksoul}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.dominantsoul}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.druid}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.fierysoul}.mod` (1)
- `{item|flags.pe.rulesSelections.fightersVersatility}` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.firebrand}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.firebreatherrank1}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.firebreatherrank2}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.firebringer}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.fortress}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.frosttouched}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.frozendomain}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.glacialdefense}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.guardianangel}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.guardianspunishment}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.heartless}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.heartofdarkness}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.iShallBringYouDespair}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.livingshadow}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.movingwall}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.naturesembracerank1}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.naturesembracerank2}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.naturesembracerank3}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.notAGodButADemon}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.shadecaller}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.sharpenshadows}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.shieldbearer}.mod` (1)
- `{item|flags.pe.rulesSelections.signatureMoveFeat}` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.stalwartbastion}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.thecoldneverbotheredmeanyway}.mod` (1)
- `{item|flags.pe.rulesSelections.typeExpertiseRank1Feat}` (1)
- `{item|flags.pe.rulesSelections.typeExpertiseRank2Feat}` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.unrivaledBattlePower1}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.unrivaledBattlePower2}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.unrivaledBattlePower3}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.unstoppablewill}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.wallofiron}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.winteriscoming}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.wintersheraldrank1}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.wintersheraldrank2}.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.worldofdarkness}.mod` (1)
- `system.stats.{item|flags.pe.rulesSelections.choice-item}.stage.mod` (1)
- `system.stats.{item|flags.pe.rulesSelections.eviolite1}.mod.mod` (1)
- `system.stats.{item|flags.pe.rulesSelections.eviolite2}.mod.mod` (1)
- `system.stats.atk.mod.mod` (1)
- `system.stats.def.mod.mod` (1)
- `system.stats.hp.mod.mod` (1)
- `system.stats.spatk.mod.mod` (1)
- `system.stats.{item|flags.pe.rulesSelections.lagging}.stage.mod` (1)
- `system.modifiers.baseStats.{item|flags.pe.rulesSelections.stat-suppress}.mod` (1)
- `system.modifiers.capabilities.{item|flags.pe.rulesSelections.mobility}` (1)
- `system.modifiers.capabilities.{item|flags.pe.rulesSelections.capability-training}` (1)
- `system.skills.techEd.value.mod` (1)
- `system.modifiers.tp` (1)

### Selectors

- `{item|id}-damage-received` (282)
- `damage-roll` (70)
- `{item|id}-damage-dealt` (65)
- `damage-received` (48)
- `{item|id}-crit-range` (37)
- `damage-base` (34)
- `attack-roll` (24)
- `{item|id}-capture-roll` (24)
- `initiative` (14)
- `save-check` (11)
- `fire-damage-base` (11)
- `steel-damage-received` (7)
- `attack` (6)
- `damage` (6)
- `water-damage-base` (6)
- `electric-damage-base` (5)
- `fire-damage-received` (5)
- `ranged-attack` (5)
- `crit-range` (4)
- `fire-damage` (3)
- `water-damage-dice` (3)
- `water-damage` (3)
- `skill-check` (3)
- `poison-damage-base` (3)
- `poison-effect-range` (3)
- `shadow-damage-base` (3)
- `ice-damage-base` (3)
- `ghost-damage-base` (3)
- `dark-damage-base` (3)
- `fairy-damage-base` (3)
- `ice-crit-range` (3)
- `capture-roll` (3)
- `damage-dice` (2)
- `ice-damage` (2)
- `grass-damage` (2)
- `rock-damage-base` (2)
- `special-damage` (2)
- `physical-damage` (2)
- `pokeball-throw` (2)
- `skill-athletics` (2)
- `special-damage-dice` (2)
- `ice-damage-received` (2)
- `nuclear-damage-received` (2)
- `electric-attack` (2)
- `hypermode` (1)
- `poison-damage-received` (1)
- `dark-damage` (1)
- `normal-damage-roll` (1)
- `fighting-damage` (1)
- `physical-damage-received` (1)
- `ghost-damage` (1)
- `fighting-damage-base` (1)
- `{item|flags.pe.rulesSelections.lastchance}-damage` (1)
- `psychic-damage` (1)
- `rock-damage` (1)
- `ground-damage` (1)
- `steel-damage` (1)
- `bug-damage` (1)
- `melee-damage-base` (1)
- `{item|flags.pe.rulesSelections.typestrategist}-damage-dealt` (1)
- `skill-acrobatics` (1)
- `capture-dc` (1)
- `shadow-attack` (1)
- `physical-damage-dice` (1)
- `vortex-save` (1)
- `capture-check` (1)
- `{item|flags.pe.rulesSelections.typebooster}-damage` (1)
- `{item|flags.pe.rulesSelections.typebrace}-damage-received` (1)
- `{item|flags.pe.rulesSelections.typebooster}-damage-base` (1)
- `{item|flags.pe.rulesSelections.typeplate}-damage` (1)
- `{item|flags.pe.rulesSelections.typeplate}-damage-received` (1)
- `damage-dealt` (1)
- `flail-damage-base` (1)
- `ice-ball-damage-roll` (1)
- `ice-ball-damage-base` (1)
- `skill-combat` (1)
- `{item|id}-attack` (1)
- `rollout-damage-roll` (1)
- `rollout-damage-base` (1)
- `{item|id}-damage` (1)
- `{item|flags.pe.rulesSelections.accuracyTraining}-attack` (1)
- `skill-perception` (1)

### Predicate

- `species:<slug>` (306)
- `self:pokemon:shiny` (176)
- `target:types:fire` (30)
- `manual` (23)
- `target:types:electric` (22)
- `target:types:poison` (19)
- `self:types:nuclear` (10)
- `move:category:physical` (9)
- `gte : {actor|system.health.injuries}` (9)
- `target:types:ice` (9)
- `move:type:electric` (8)
- `move:type:fighting` (7)
- `move:type:steel` (7)
- `eq : mind` (7)
- `target:types:water` (7)
- `ability:wind-rider` (7)
- `ability:wind-rider-weather-playtest` (7)
- `self:types:flying` (7)
- `self:types:rock` (7)
- `self:types:ground` (7)
- `gte : {actor|system.spirit.value}` (7)
- `move:type:psychic` (7)
- `condition:poisoned` (6)
- `target:types:steel` (6)
- `eq : body` (6)
- `gte : {actor|system.capabilities.sky}` (6)
- `move:type:dark` (6)
- `move:type:fairy` (6)
- `move:type:fire` (6)
- `move:type:grass` (6)
- `move:type:ice` (6)
- `move:type:water` (6)
- `move:type:ground` (6)
- `class:martial-artist-guts-hp` (6)
- `class:martial-artist-inner-focus-speed` (6)
- `class:martial-artist-limber-speed` (6)
- `class:martial-artist-technician-speed` (6)
- `class:martial-artist-iron-fist-defense` (6)
- `class:martial-artist-reckless-attack` (6)
- `capability:underdog` (6)
- `effect:dusty` (5)
- `move:type:shadow` (5)
- `self:types:grass` (5)
- `move:type:bug` (5)
- `move:type:dragon` (5)
- `move:type:flying` (5)
- `move:type:ghost` (5)
- `move:type:normal` (5)
- `move:type:poison` (5)
- `move:type:rock` (5)
- `target:types:shadow` (5)
- `target:types:ghost` (5)
- `move:is-stab` (4)
- `condition:sleep` (4)
- `condition:rage` (4)
- `condition:confused` (4)
- `eq : spirit` (4)
- `ability:levitate` (4)
- `gte : {actor|system.capabilities.levitate}` (4)
- `target:distance:4+` (4)
- `move:weapon` (4)
- `move:priority` (3)
- `condition:paralysis` (3)
- `condition:burned` (3)
- `condition:frozen` (3)
- `condition:slowed` (3)
- `condition:badly-poisoned` (3)
- `hypermode` (3)
- `move:wind` (3)
- `self:types:ice` (3)
- `effect:sunny` (2)
- `effect:grassy` (2)
- `target:types:fighting` (2)
- `effect:new-moon` (2)
- `move:slice` (2)
- `effect:snowy` (2)
- `effect:rainy` (2)
- `gte : {actor|system.stats.atk.total}` (2)
- `{item|flags.pe.rulesSelections.elementalConnection}` (2)
- `skill:charm` (2)
- `skill:command` (2)
- `skill:guile` (2)
- `skill:intimidate` (2)
- `skill:intuition` (2)
- `capability:blindsense` (2)
- `self:types:water` (2)
- `move:category:special` (2)
- `gt : {actor|system.spirit.value}` (2)
- `self:types:steel` (2)
- `eq : {item|flags.pe.rulesSelections.milestone-champion}` (2)
- `eq : {item|flags.pe.rulesSelections.milestone-elite-trainer}` (2)
- `target:types:fairy` (2)
- `effect:defense-curl` (2)
- `target:condition:poisoned` (2)
- `move:dash` (1)
- `move:punch` (1)
- `move:aura` (1)
- `move:sonic` (1)
- `move:exhaust` (1)
- `move:recoil` (1)
- `move:reckless` (1)
- `move:recoil-1-4` (1)
- `move:recoil-1-3` (1)
- `move:recoil-1-2` (1)
- `move:jaw` (1)
- `move:damage-base:pre-stab:1` (1)
- `move:damage-base:pre-stab:2` (1)
- `move:damage-base:pre-stab:3` (1)
- `move:damage-base:pre-stab:4` (1)
- `move:damage-base:pre-stab:5` (1)
- `move:damage-base:pre-stab:6` (1)
- `move:range:melee` (1)
- `gte : {actor|system.stats.spatk.total}` (1)
- `condition:bad-sleep` (1)
- `condition:cursed` (1)
- `condition:disabled` (1)
- `condition:vulnerable` (1)
- `condition:infatuation` (1)
- `condition:suppressed` (1)
- `tech-attack` (1)
- `move:social` (1)
- `glitch-phenomena` (1)
- `check:mount:save` (1)
- `condition:save:rage` (1)
- `condition:save:infatuation` (1)
- `self:types:poison` (1)
- `athlete-training:selection1:atk` (1)
- `athlete-training:selection2:atk` (1)
- `athlete-training:selection1:def` (1)
- `athlete-training:selection2:def` (1)
- `athlete-training:selection1:spatk` (1)
- `athlete-training:selection2:spatk` (1)
- `athlete-training:selection1:spdef` (1)
- `athlete-training:selection2:spdef` (1)
- `athlete-training:selection1:spd` (1)
- `athlete-training:selection2:spd` (1)
- `self:types:fire` (1)
- `{actor|system.shiny}` (1)
- `eq : true` (1)
- `target:condition:burned` (1)
- `ability:damp` (1)
- `melee-attack` (1)
- `Compendium.pe.effects.Item.I2nVAxBFKDMe8EQt` (1)
- `eq : {actor|types.length}` (1)
- `self:types:untyped` (1)
- `gte : @actor.system.skills.guile.value.total` (1)
- `move:detect` (1)
- `move:vacuum-wave` (1)
- `move:force-palm` (1)
- `target:types:flying` (1)
- `target:types:grass` (1)
- `target:types:ground` (1)
- `target:types:normal` (1)
- `target:types:dark` (1)
- `target:types:dragon` (1)
- `target:types:psychic` (1)
- `target:types:bug` (1)
- `target:types:rock` (1)
- `target:types:{item|flags.pe.rulesSelections.typestudy}` (1)
- `item:equipped` (1)
- `target:types:nuclear` (1)
- `move:wrap` (1)
- `tracking` (1)
