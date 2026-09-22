/**
 * Foundry-facing adapters for the Epopee combat math. Everything that needs an
 * actor document lives here; formula.js stays pure and node-testable.
 */

import { mdsTerm, clampStages } from "./formula.js";

/**
 * Current combat stage count for a stat, following the codebase's existing
 * convention of `stage.value + stage.mod` (see pokemon/document.js and
 * character/document.js, which both read it that way).
 *
 * @param {object} actor
 * @param {"atk"|"def"|"spatk"|"spdef"|"spd"} stat
 * @returns {number} clamped to -6..6
 */
function combatStages(actor, stat) {
    const stage = actor?.system?.stats?.[stat]?.stage;
    if (!stage) return 0;
    return clampStages((Number(stage.value) || 0) + (Number(stage.mod) || 0));
}

/**
 * Build a dice-modifier entry for an actor's MdS on a given stat.
 *
 * Shaped for `PTUDamageCheck.diceModifiers`, which only reads `.slug`, `.ignored`
 * and `.value` - `.value` being a dice formula string that gets spliced into the
 * roll. An entry with no stages is returned as `ignored` so it drops out cleanly
 * rather than emitting an empty term.
 *
 * @param {object} actor
 * @param {"atk"|"spatk"} stat
 * @param {number} level
 * @returns {{slug: string, label: string, value: string, ignored: boolean}}
 */
function stageDiceModifier(actor, stat, level) {
    const stages = combatStages(actor, stat);
    const term = mdsTerm(level, stages);
    return {
        slug: `epopee-mds-${stat}`,
        label: `MdS ${stat.toUpperCase()} (${stages > 0 ? "+" : ""}${stages})`,
        value: term.formula,
        ignored: term.sign === 0
    };
}

/**
 * The stat value the Epopee formula should use: the figure *before* PTR's
 * +-10%-per-stage multiplier.
 *
 * `system.stats.X.total` bakes combat stages in (see `applyStages` in actor/helpers.js,
 * `sub * stage.total * 0.1 + sub`). Since this formula expresses stages as MdS dice
 * instead, reading `total` would apply them twice. `preStage` is set alongside `total`
 * during data prep; the fallback keeps this safe if prep hasn't run.
 *
 * @param {object} actor
 * @param {"atk"|"def"|"spatk"|"spdef"|"spd"} stat
 * @returns {number}
 */
function statForFormula(actor, stat) {
    const entry = actor?.system?.stats?.[stat];
    if (!entry) return 0;
    const value = entry.preStage ?? entry.total;
    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export { combatStages, stageDiceModifier, statForFormula };
