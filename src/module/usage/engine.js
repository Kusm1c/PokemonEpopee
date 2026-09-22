/**
 * Foundry-facing half of the usage system: reading an actor's items and refilling their
 * pools when a scene or a day ends.
 *
 * The counter itself is `system.uses.spent` on each item, defined on the shared item
 * template so every item type gets it. Everything else is derived from the frequency
 * string at read time, so changing an item's frequency re-sizes its pool with no
 * migration.
 */

import { PERIODS, parseFrequency, resetsOn, usageState } from "./frequency.js";

/** Item types that can carry a usage pool, per the Pokemon sheet's Action lists. */
const TRACKED_TYPES = ["move", "ability", "item", "capability", "pokeedge", "contestmove", "spiritaction"];

/**
 * Usage state for a single item, ready for display.
 *
 * @param {object} item
 * @returns {ReturnType<typeof usageState> & {label: string}}
 */
function itemUsage(item) {
    const frequency = item?.system?.frequency ?? "";
    const spent = item?.system?.uses?.spent ?? 0;
    const state = usageState(frequency, spent);

    return {
        ...state,
        // "At-Will" / "Static" render dimmer than a real countdown, per the doc:
        // "Si infini ou a volonte, mettre une couleur differente moins visible".
        label: state.unlimited ? (parseFrequency(frequency).raw || "At-Will") : `${state.remaining} / ${state.max}`
    };
}

/**
 * Spend one use. Returns false and changes nothing when the pool is already empty, so
 * callers can refuse the action.
 *
 * @param {object} item
 * @returns {Promise<boolean>}
 */
async function spendUse(item) {
    const state = itemUsage(item);
    if (state.unlimited) return true;
    if (state.exhausted) return false;

    await item.update({ "system.uses.spent": state.used + 1 });
    return true;
}

/**
 * Refill every pool on this actor that resets on the given period.
 *
 * A day contains scenes, so `cascade` refills Scene pools too when a day ends - the
 * design doc only says a rest "reinitialise les usages maximums par jour", but leaving
 * Scene pools spent across a night's sleep would be surprising. Pass `false` to follow
 * the doc literally.
 *
 * @param {object} actor
 * @param {string} period One of PERIODS
 * @param {boolean} [cascade=true]
 * @returns {Promise<string[]>} names of the items that were refilled
 */
async function resetUses(actor, period, cascade = true) {
    const periods = cascade && period === PERIODS.DAILY
        ? [PERIODS.DAILY, PERIODS.SCENE, PERIODS.EOT]
        : [period];

    const updates = [];
    const refilled = [];

    for (const item of actor.items) {
        if (!TRACKED_TYPES.includes(item.type)) continue;
        if ((item.system?.uses?.spent ?? 0) === 0) continue;
        if (!periods.some(p => resetsOn(item.system?.frequency ?? "", p))) continue;

        updates.push({ _id: item.id, "system.uses.spent": 0 });
        refilled.push(item.name);
    }

    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    return refilled;
}

export { PERIODS, TRACKED_TYPES, itemUsage, spendUse, resetUses };
