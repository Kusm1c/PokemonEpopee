/**
 * Epopee's secondary stats: Precision (PRE) and Esquive (ESQ).
 *
 * "Stat de Precision (PRE), qui augmente les propres jets d'accuracy du Pokemon.
 *  Stat d'Esquive (ESQ), qui reduit les jets d'accuracy qui ciblent le Pokemon."
 *
 * They sit apart from the six main stats on purpose. The sheet renders those with
 * `{{#each actor.system.stats}}`, and every row of that loop carries a Level-Up column;
 * the doc asks for PRE and ESQ "sans point de Level-Up", so putting them in the same
 * object would have given them one. They live under `system.secondaryStats` instead,
 * which also keeps them out of the stat-point budget and out of PTR's own stat maths.
 *
 * Pure module - no Foundry globals - so it can be exercised from a test script.
 */

/** The keys, in display order. */
const SECONDARY_STAT_KEYS = ["precision", "esquive"];

/**
 * Total a secondary stat: base + mod, then combat stages.
 *
 * Stages are applied as a flat +-1 per stage rather than PTR's +-10% multiplier. These
 * stats start at 0, and a percentage of zero is zero - a Precision stage would do
 * nothing at all. A flat step is also what an accuracy modifier wants to be, since it
 * is added to a d20 roll rather than scaling a damage figure.
 *
 * @param {object} entry an entry of `system.secondaryStats`
 * @returns {{value: number, mod: number, stage: number, total: number}}
 */
function secondaryStatTotal(entry) {
    const num = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    };

    const value = num(entry?.value);
    const mod = num(entry?.mod?.value) + num(entry?.mod?.mod);
    const stage = clampSecondaryStage(num(entry?.stage?.value) + num(entry?.stage?.mod));

    return { value, mod, stage, total: value + mod + stage };
}

/** Stages share the main stats' -6..+6 range. */
function clampSecondaryStage(stage) {
    return Math.min(6, Math.max(-6, stage));
}

/**
 * Derive every secondary stat onto the actor's system data, in place.
 *
 * Writes `total` alongside the stored fields so sheets and the attack engine read one
 * prepared number rather than each redoing the sum.
 *
 * @param {object} system an actor's `system`
 */
function prepareSecondaryStats(system) {
    const stats = system?.secondaryStats;
    if (!stats) return;

    for (const key of SECONDARY_STAT_KEYS) {
        const entry = stats[key];
        if (!entry) continue;

        const { stage, total } = secondaryStatTotal(entry);
        entry.stage = entry.stage ?? { value: 0, mod: 0 };
        entry.stage.total = stage;
        entry.total = total;
    }
}

/**
 * The attacker's Precision, as a bonus to their own accuracy rolls.
 *
 * @param {object} actor
 * @returns {number}
 */
function precisionBonus(actor) {
    return Number(actor?.system?.secondaryStats?.precision?.total) || 0;
}

/**
 * The defender's Esquive, as a penalty to accuracy rolls aimed at them.
 *
 * Returned as a positive number: the caller decides the sign, matching how PTR's
 * existing evasion modifiers are pushed onto the target statistic.
 *
 * @param {object} actor
 * @returns {number}
 */
function esquiveValue(actor) {
    return Number(actor?.system?.secondaryStats?.esquive?.total) || 0;
}

export {
    SECONDARY_STAT_KEYS,
    clampSecondaryStage,
    secondaryStatTotal,
    prepareSecondaryStats,
    precisionBonus,
    esquiveValue
};
