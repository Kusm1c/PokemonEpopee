/**
 * Pure math for the Pokemon Epopee damage formula. No Foundry globals in here,
 * so `scripts/test-combat-math.mjs` can exercise it under plain node.
 *
 * The formula is deliberately split in two, so multi-hit moves compute Power once
 * and apply it per hit:
 *
 *   Step 1  PUISSANCE      = [Jet] + STAB + Attaques + CombatStagesOffensifs
 *   Step 2  DEGATS INFLIGES = (Puissance - Defenses - CombatStagesDefensifs) * Type
 *
 * Dice terms are returned as formula strings ("3d8") rather than rolled here, so the
 * caller decides when to evaluate them.
 */

import {
    FRAGMENT_DIVISOR,
    STAB_BASE,
    STAB_LEVEL_DIVISOR,
    MAX_COMBAT_STAGES,
    MDS_DIE_BY_LEVEL,
    MDS_DIE_ABOVE_TABLE,
    DEFAULT_IS_MODERATE,
    MODERATE_TAG_ALIASES,
    POWERFUL_TAG_ALIASES
} from "./config.js";

/**
 * "Fragment de {Stat}": 25% of a stat, rounded up. Also the unit used for the
 * 1/20th HP fragment elsewhere, which has its own divisor - don't reuse this for HP.
 *
 * @param {number} value
 * @returns {number}
 */
function fragment(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.ceil(n / FRAGMENT_DIVISOR);
}

/**
 * STAB stat: 5 + (level / 5), floored.
 *
 * The doc writes "5 + {Niveau divisé par 5}" without stating the rounding; floor is
 * assumed so level 1-4 gives a flat 5 and each 5 levels adds 1.
 *
 * @param {number} level
 * @returns {number}
 */
function stabValue(level) {
    const n = Number(level);
    const safeLevel = Number.isFinite(n) && n > 0 ? n : 1;
    return STAB_BASE + Math.floor(safeLevel / STAB_LEVEL_DIVISOR);
}

/**
 * MdS die size for an actor's level.
 *
 * @param {number} level
 * @returns {number} 4, 6, 8, 10 or 12
 */
function mdsDieSize(level) {
    const n = Number(level);
    const safeLevel = Number.isFinite(n) && n > 0 ? n : 1;
    for (const bracket of MDS_DIE_BY_LEVEL) {
        if (safeLevel <= bracket.maxLevel) return bracket.die;
    }
    return MDS_DIE_ABOVE_TABLE;
}

/**
 * Clamp a combat stage count to the legal -6..+6 range.
 *
 * @param {number} stages
 * @returns {number}
 */
function clampStages(stages) {
    const n = Number(stages);
    if (!Number.isFinite(n)) return 0;
    const truncated = Math.trunc(n);
    return Math.max(-MAX_COMBAT_STAGES, Math.min(MAX_COMBAT_STAGES, truncated));
}

/**
 * Dice formula contributed by a combat stage count, ignoring sign.
 * Callers apply the sign themselves via `mdsTerm`.
 *
 * @param {number} level
 * @param {number} stages
 * @returns {string} e.g. "3d8", or "" when there are no stages
 */
function mdsDiceFormula(level, stages) {
    const count = Math.abs(clampStages(stages));
    if (count === 0) return "";
    return `${count}d${mdsDieSize(level)}`;
}

/**
 * A signed MdS dice term, ready to splice into a roll formula.
 *
 * The doc only spells out the positive cases ("chaque Combat Stage ... ajoute +1d{X}"
 * offensively, "reduit de -1d{X}" defensively). A negative stage is treated as the
 * mirror of its positive counterpart, i.e. signed dice on the same term. Flagged as an
 * open question in CHECKLIST.md §11.2 - change here if the ruling differs.
 *
 * @param {number} level
 * @param {number} stages
 * @returns {{formula: string, sign: 1|-1|0, dice: string}}
 */
function mdsTerm(level, stages) {
    const clamped = clampStages(stages);
    const dice = mdsDiceFormula(level, clamped);
    if (!dice) return { formula: "", sign: 0, dice: "" };
    const sign = clamped > 0 ? 1 : -1;
    return { formula: `${sign > 0 ? "+" : "-"}${dice}`, sign, dice };
}

/**
 * Does this move use the Fragment of the attack stat instead of the whole stat?
 *
 * Current ruling (DEFAULT_IS_MODERATE = true): **Moderate is the default**. A move is
 * only Powerful if it explicitly says so, so `Puissant` is the load-bearing tag and
 * `Modéré` is documentation. An explicit tag always wins over the default, and if a
 * move somehow carries both, `Puissant` wins.
 *
 * Matching is case-insensitive and accepts French and English spellings, in both NFC
 * and NFD accent forms (a Tagify field can produce either).
 *
 * @param {string[]} tags Move tags, in any casing
 * @returns {boolean}
 */
function isModerate(tags, isDamaging = true) {
    // A status-only move scales off no attack stat at all, so it is neither Moderate
    // nor Powerful. Callers that need to tell "no scaling" apart from "full stat"
    // should use attackScaling() instead of this boolean.
    if (!isDamaging) return false;

    const normalized = Array.isArray(tags)
        ? tags.filter(t => typeof t === "string").map(t => t.trim().toLowerCase())
        : [];
    if (normalized.some(t => POWERFUL_TAG_ALIASES.includes(t))) return false;
    if (normalized.some(t => MODERATE_TAG_ALIASES.includes(t))) return true;
    return DEFAULT_IS_MODERATE;
}

/**
 * Three-state version of the above, for display, auditing and data validation.
 *
 * A status-only move returns `null`: it should carry neither tag, and showing
 * "Moderate" on it would be wrong even though the maths never reaches it.
 *
 * @param {string[]} tags
 * @param {boolean} [isDamaging=true]
 * @returns {"moderate"|"powerful"|null}
 */
function attackScaling(tags, isDamaging = true) {
    if (!isDamaging) return null;
    return isModerate(tags, true) ? "moderate" : "powerful";
}

/**
 * Does this move carry a scaling tag it has no business carrying?
 * True for a status-only move tagged Modéré or Puissant - a data error worth cleaning.
 *
 * @param {string[]} tags
 * @param {boolean} isDamaging
 * @returns {boolean}
 */
function hasStrayScalingTag(tags, isDamaging) {
    if (isDamaging) return false;
    const normalized = Array.isArray(tags)
        ? tags.filter(t => typeof t === "string").map(t => t.trim().toLowerCase())
        : [];
    return normalized.some(t => MODERATE_TAG_ALIASES.includes(t) || POWERFUL_TAG_ALIASES.includes(t));
}

/**
 * The `Attaques` term: the attacker's ATK or SPATK, reduced to its Fragment when the
 * move is tagged Modere.
 *
 * @param {number} statTotal
 * @param {boolean} moderate
 * @returns {number}
 */
function attackTerm(statTotal, moderate) {
    const n = Number(statTotal);
    const safe = Number.isFinite(n) ? n : 0;
    return moderate ? fragment(safe) : safe;
}

/**
 * The `Defenses` term: the Fragment of the defender's DEF or SPDEF by default.
 * Some cases (the Action de Reaction) use the full stat instead.
 *
 * @param {number} statTotal
 * @param {boolean} useFullStat
 * @returns {number}
 */
function defenseTerm(statTotal, useFullStat = false) {
    const n = Number(statTotal);
    const safe = Number.isFinite(n) ? n : 0;
    return useFullStat ? safe : fragment(safe);
}

/**
 * Step 1: attack Power, computed once per attack even for multi-hit moves.
 *
 * @param {object} params
 * @param {number} params.jet            Damage-die result plus every flat external modifier
 * @param {number} params.level          Attacker's level, for the STAB term
 * @param {number} params.attackStat     Attacker's ATK or SPATK total
 * @param {boolean} params.moderate      Move carries the Modere tag
 * @param {number} params.offensiveStageDice Already-rolled total of the offensive MdS dice
 * @returns {{total: number, breakdown: object}}
 */
function computePower({ jet, level, attackStat, moderate = false, offensiveStageDice = 0 }) {
    const jetValue = Number.isFinite(Number(jet)) ? Number(jet) : 0;
    const stab = stabValue(level);
    const attack = attackTerm(attackStat, moderate);
    const stageDice = Number.isFinite(Number(offensiveStageDice)) ? Number(offensiveStageDice) : 0;

    return {
        total: jetValue + stab + attack + stageDice,
        breakdown: { jet: jetValue, stab, attack, offensiveStageDice: stageDice, moderate }
    };
}

/**
 * Step 2: damage actually applied, run once per hit.
 *
 * Note the type multiplier applies to the post-defense figure, per the doc's
 * parenthesisation: (Puissance - Defenses - MdS) * Faiblesse.
 *
 * @param {object} params
 * @param {number} params.power
 * @param {number} params.defense              Already reduced to a Fragment by `defenseTerm`
 * @param {number} params.defensiveStageDice   Already-rolled total of the defensive MdS dice
 * @param {number} params.typeMultiplier       0.25 .. 4, or 0 for an immunity
 * @param {number} [params.minimum=0]          Floor applied after the multiplier
 * @returns {{total: number, breakdown: object}}
 */
function applyDamageFormula({ power, defense, defensiveStageDice = 0, typeMultiplier = 1, minimum = 0 }) {
    const powerValue = Number.isFinite(Number(power)) ? Number(power) : 0;
    const defenseValue = Number.isFinite(Number(defense)) ? Number(defense) : 0;
    const stageDice = Number.isFinite(Number(defensiveStageDice)) ? Number(defensiveStageDice) : 0;
    const multiplier = Number.isFinite(Number(typeMultiplier)) ? Number(typeMultiplier) : 1;

    const afterDefense = powerValue - defenseValue - stageDice;
    const scaled = afterDefense * multiplier;
    const total = Math.max(minimum, Math.floor(scaled));

    return {
        total,
        breakdown: {
            power: powerValue,
            defense: defenseValue,
            defensiveStageDice: stageDice,
            afterDefense,
            typeMultiplier: multiplier,
            beforeFloor: scaled
        }
    };
}

export {
    fragment,
    stabValue,
    mdsDieSize,
    clampStages,
    mdsDiceFormula,
    mdsTerm,
    isModerate,
    attackScaling,
    hasStrayScalingTag,
    attackTerm,
    defenseTerm,
    computePower,
    applyDamageFormula
};
