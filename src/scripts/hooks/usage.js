import { PERIODS, refreshEotUses, resetUses } from "../../module/usage/engine.js";

/**
 * EOT ("Every Other Turn") moves recharge by turns, so they need the combat to tell them
 * when a turn starts. Everything runs on the active GM's client only: every client sees
 * these hooks, and the items must be updated once.
 */
export const UsageHooks = {
    listen() {
        Hooks.on("updateCombat", async (combat, changed) => {
            if (!("turn" in changed) && !("round" in changed)) return;
            if (!game.users.activeGM?.isSelf) return;
            const actor = combat.combatant?.actor;
            if (!actor) return;
            await refreshEotUses(actor, combat.round);
        });

        // A finished fight leaves nothing waiting for a turn that will not come.
        Hooks.on("deleteCombat", async (combat) => {
            if (!game.users.activeGM?.isSelf) return;
            for (const actor of new Set(combat.combatants.contents.flatMap((c) => c.actor ?? []))) {
                await resetUses(actor, PERIODS.EOT);
            }
        });
    }
};
