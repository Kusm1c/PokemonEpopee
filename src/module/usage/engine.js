/**
 * Foundry-facing half of the usage system: reading an actor's items and refilling their
 * pools when a scene or a day ends.
 *
 * The counter itself is `system.uses.spent` on each item, defined on the shared item
 * template so every item type gets it. Everything else is derived from the frequency
 * string at read time, so changing an item's frequency re-sizes its pool with no
 * migration.
 */

import { PERIODS, eotRecharged, parseFrequency, resetsOn, usageState } from "./frequency.js";
import { localize } from "../i18n.js";

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
        // EOT is available or not rather than a count, so it shows its name.
        label: state.unlimited || state.period === PERIODS.EOT
            ? (parseFrequency(frequency).raw || "At-Will")
            : `${state.remaining} / ${state.max}`
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

    const update = { "system.uses.spent": state.used + 1 };
    // EOT recharges by round, so remember which one it was used in (see refreshEotUses).
    if (state.period === PERIODS.EOT) update["flags.pe.eotRound"] = game.combat?.started ? game.combat.round : null;
    await item.update(update);
    return true;
}

/**
 * Recharge this actor's EOT moves whose waiting turn has passed. Called at the start of
 * the actor's turn.
 *
 * @param {object} actor
 * @param {number} round the combat's current round
 * @returns {Promise<string[]>} names of the items recharged
 */
async function refreshEotUses(actor, round) {
    const updates = [];
    const refilled = [];
    for (const item of actor.items) {
        if (!TRACKED_TYPES.includes(item.type)) continue;
        if ((item.system?.uses?.spent ?? 0) === 0) continue;
        if (!resetsOn(item.system?.frequency ?? "", PERIODS.EOT)) continue;
        if (!eotRecharged(item.getFlag("pe", "eotRound") ?? null, round)) continue;

        updates.push({ _id: item.id, "system.uses.spent": 0, "flags.pe.-=eotRound": null });
        refilled.push(item.name);
    }
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    return refilled;
}

/**
 * Whether an action drawing on this item's pool may go ahead.
 *
 * An empty pool stops a player. A GM is warned but may go ahead anyway - the counter
 * can be out of step with the table (a use spent outside Foundry, a reset not yet run)
 * and the GM is the one who decides.
 *
 * @param {object} item
 * @returns {boolean}
 */
function canUse(item) {
    const state = itemUsage(item);
    if (state.unlimited || !state.exhausted) return true;

    const data = { name: item.name, frequency: item.system?.frequency ?? "" };
    if (!game.user.isGM) {
        ui.notifications.warn(localize("PTU.Epopee.Usage.Exhausted", data));
        return false;
    }
    ui.notifications.warn(localize("PTU.Epopee.Usage.ExhaustedGm", data));
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
    // EOT is turn-based, so any longer reset - the end of a scene or a day - clears it too.
    const periods = cascade && period === PERIODS.DAILY
        ? [PERIODS.DAILY, PERIODS.SCENE, PERIODS.EOT]
        : period === PERIODS.SCENE ? [PERIODS.SCENE, PERIODS.EOT] : [period];

    const updates = [];
    const refilled = [];

    for (const item of actor.items) {
        if (!TRACKED_TYPES.includes(item.type)) continue;
        if ((item.system?.uses?.spent ?? 0) === 0) continue;
        if (!periods.some(p => resetsOn(item.system?.frequency ?? "", p))) continue;

        updates.push({ _id: item.id, "system.uses.spent": 0, "flags.pe.-=eotRound": null });
        refilled.push(item.name);
    }

    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    return refilled;
}

export { PERIODS, TRACKED_TYPES, itemUsage, canUse, spendUse, resetUses, refreshEotUses };
