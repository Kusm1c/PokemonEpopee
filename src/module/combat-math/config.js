/**
 * Constants for the Pokemon Epopee damage formula.
 *
 * Source: Chronicler -> Regles -> Regles Generales -> Combat
 *   - "Modifications de Statistiques (MdS)"
 *   - "STAB"
 *
 * Kept separate from formula.js so the numbers can be retuned without touching logic.
 */

/** A "Fragment" is 25% of a stat, rounded up. */
const FRAGMENT_DIVISOR = 4;

/** STAB = STAB_BASE + floor(level / STAB_LEVEL_DIVISOR). */
const STAB_BASE = 5;
const STAB_LEVEL_DIVISOR = 5;

/** A stat can be raised or lowered at most this many times. */
const MAX_COMBAT_STAGES = 6;

/**
 * MdS die size by level bracket. Each combat stage contributes one die of this size,
 * so N stages at level 35 is "Nd6".
 *
 * Ordered ascending by maxLevel; the first bracket whose maxLevel >= level wins.
 */
const MDS_DIE_BY_LEVEL = [
    { maxLevel: 20, die: 4 },
    { maxLevel: 40, die: 6 },
    { maxLevel: 60, die: 8 },
    { maxLevel: 80, die: 10 },
    { maxLevel: 100, die: 12 }
];

/** Used above the last bracket, so level 120 still resolves to something. */
const MDS_DIE_ABOVE_TABLE = 12; 

/**
 * Whether a move with neither tag counts as Moderate.
 *
 * `true` (current ruling): **every move is Moderate by default**, so the attack term
 * uses the stat's Fragment. `Puissant` is the explicit opt-out that restores the full
 * stat; the `Modéré` tag is then documentation only.
 *
 * Flip to `false` to invert it - untagged would mean full stat, and `Modéré` would
 * become the load-bearing tag instead.
 */
const DEFAULT_IS_MODERATE = true;

/**
 * Move tag that switches the attack term from the full stat to its Fragment,
 * and its opposite. See DEFAULT_IS_MODERATE for which one actually drives the maths.
 */
const MODERATE_TAG = "moderate";
const POWERFUL_TAG = "powerful";

/** French spellings, since the compendium may be tagged either way. */
const MODERATE_TAG_ALIASES = ["moderate", "modere", "modéré", "moderé", "moderé"];
const POWERFUL_TAG_ALIASES = ["powerful", "puissant"];

export {
    FRAGMENT_DIVISOR,
    STAB_BASE,
    STAB_LEVEL_DIVISOR,
    MAX_COMBAT_STAGES,
    MDS_DIE_BY_LEVEL,
    MDS_DIE_ABOVE_TABLE,
    DEFAULT_IS_MODERATE,
    MODERATE_TAG,
    POWERFUL_TAG,
    MODERATE_TAG_ALIASES,
    POWERFUL_TAG_ALIASES
};
