import { ALL_STATUS_DEFINITIONS } from "./definitions.js";
import { combatStages, statForFormula } from "../combat-math/actor.js";
import { mdsTerm } from "../combat-math/formula.js";
import { computeBonus, resolveTier } from "./roll.js";
import { buildActorUpdate, buildConditionUpdate, getModerateSelfDamage } from "./apply-effect.js";
import { resolveDuration } from "./duration.js";
import { STATUS_RESISTANCE_ASSIST_BONUS } from "./config.js";

async function promptAssist(condition, statusLabel) {
    return Dialog.confirm({
        title: game.i18n.localize("PTU.Epopee.Status.Prompt.Title"),
        content: `<p>${game.i18n.format("PTU.Epopee.Status.Prompt.Description", { name: condition.actor.name, status: statusLabel })}</p>`,
        yes: () => true,
        no: () => false,
        defaultYes: false
    });
}

function describeEffect(condition, tier, effect) {
    const bespokeKey = `PTU.Epopee.Status.Effect.${condition.slug}.${tier.id}`;
    if (game.i18n.has(bespokeKey)) return game.i18n.localize(bespokeKey);

    const parts = [];
    if (effect.hpDamageFraction) parts.push(game.i18n.format("PTU.Epopee.Status.Generic.Damage", { fraction: effect.hpDamageFraction }));
    if (effect.managesToMove) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.ManagesToMove"));
    if (typeof effect.durationDelta === "number") parts.push(game.i18n.format("PTU.Epopee.Status.Generic.DurationReduced", { turns: Math.abs(effect.durationDelta) }));
    if (effect.renewed && effect.empowered) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.RenewedEmpowered"));
    else if (effect.renewed) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.Renewed"));
    if (effect.decayIfNotRenewed) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.Decaying"));
    if (effect.cloneDamage) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.CloneDamage"));
    if (effect.cloneHeal) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.CloneHeal"));
    if (effect.cured) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.Expired"));
    if (!parts.length) parts.push(game.i18n.localize("PTU.Epopee.Status.Generic.NoEffect"));

    return parts.join(" ");
}

async function runStatusResistance(condition, actorUpdates) {
    const definition = ALL_STATUS_DEFINITIONS[condition.slug];
    if (!definition) return;

    const actor = condition.actor;
    if (!actor) return;

    if (definition.typeImmunities?.some(type => actor.types?.includes(type))) return;

    const statusLabel = game.i18n.localize(`PTU.Epopee.Status.Label.${condition.slug}`);
    const assist = await promptAssist(condition, statusLabel);
    const assistBonus = assist ? STATUS_RESISTANCE_ASSIST_BONUS : 0;

    const intensity = definition.hasIntensity ? (condition.value ?? definition.intensityStart ?? 0) : undefined;
    const intensityBonus = definition.bonusPerIntensity ? (intensity ?? 0) * definition.bonusPerIntensity : 0;

    // "Un pokemon ayant eu une modification de Vitesse ajoutera des des lors de la
    // liberation d'effet de statuts." (Chronicler -> Combat -> MdS)
    //
    // The flat 25%-of-Speed bonus reads the *pre-stage* figure, for the same reason the
    // damage formula does: `stats.spd.total` still bakes in PTR's +-10%-per-stage
    // multiplier, and counting that on top of the MdS dice would apply stages twice.
    const speedValue = statForFormula(actor, "spd") || actor.system.stats.spd?.value || 0;
    const speedTerm = mdsTerm(actor.system.level?.current ?? 1, combatStages(actor, "spd"));

    const bonus = computeBonus({ speedValue, assistBonus, intensityBonus });

    // The MdS dice go straight into the formula so the player sees them rolled.
    const rollFormula = speedTerm.formula ? `1d100 ${speedTerm.formula} + @bonus` : "1d100 + @bonus";
    const roll = await new Roll(rollFormula, { bonus }).evaluate();
    const tier = resolveTier(roll.total);

    const effect = definition.resolveTier(tier.id, { intensity });

    if (definition.hasDuration) {
        const { value, cured } = resolveDuration({
            currentDuration: condition.system.duration.value,
            startDuration: definition.startDuration,
            durationTicks: definition.durationTicks,
            effect
        });
        if (value !== condition.system.duration.value) await condition.update({ "system.duration.value": value });
        if (cured) effect.cured = true;
    }

    const actorUpdate = buildActorUpdate(effect, {
        currentHp: actorUpdates["system.health.value"] ?? actor.system.health.value,
        maxHp: actor.system.health.max
    });
    Object.assign(actorUpdates, actorUpdate);

    if (effect.selfDamage === "moderate") {
        const damage = getModerateSelfDamage(actor);
        actorUpdates["system.health.value"] = Math.max(0, (actorUpdates["system.health.value"] ?? actor.system.health.value) - damage);
    }

    if (effect.skipTurn || effect.noMoveAction || effect.moveActionOnly || effect.targetLockout) {
        actorUpdates["flags.ptu.statusRestriction"] = describeEffect(condition, tier, effect);
    }

    const conditionUpdate = buildConditionUpdate(effect, { intensity });
    if (Object.keys(conditionUpdate).length) await condition.update(conditionUpdate);

    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<div class="header-bar"><p class="action">${game.i18n.format("PTU.Epopee.Status.Chat.Flavor", { name: actor.name, status: statusLabel })}</p></div>`,
        content: `<p>${game.i18n.localize(`PTU.Epopee.Status.Tier.${tier.id}`)} : ${describeEffect(condition, tier, effect)}</p>`
    });

    if (effect.cured) await condition.delete();
}

async function purgeOnRecall(actor) {
    const conditions = actor.conditions.active.filter(c => ALL_STATUS_DEFINITIONS[c.slug]?.onRecall && ALL_STATUS_DEFINITIONS[c.slug].onRecall !== "none");

    const purged = [];
    for (const condition of conditions) {
        const definition = ALL_STATUS_DEFINITIONS[condition.slug];
        if (definition.onRecall === "cure") {
            purged.push(condition.name);
            await condition.delete();
        } else if (definition.onRecall === "resetIntensity") {
            purged.push(condition.name);
            await condition.update({ "system.value.value": definition.recallIntensity });
        }
    }
    return purged;
}

export { runStatusResistance, purgeOnRecall }
