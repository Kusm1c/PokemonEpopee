import { STATUS_DEFINITIONS } from "./definitions.js";
import { computeBonus, resolveTier } from "./roll.js";
import { buildActorUpdate, buildConditionUpdate, getModerateSelfDamage } from "./apply-effect.js";
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

async function runStatusResistance(condition, actorUpdates) {
    const definition = STATUS_DEFINITIONS[condition.slug];
    if (!definition) return;

    const actor = condition.actor;
    if (!actor) return;

    if (definition.typeImmunities?.some(type => actor.types?.includes(type))) return;

    const statusLabel = game.i18n.localize(`PTU.Epopee.Status.Label.${condition.slug}`);
    const assist = await promptAssist(condition, statusLabel);
    const assistBonus = assist ? STATUS_RESISTANCE_ASSIST_BONUS : 0;

    const intensity = definition.hasIntensity ? (condition.value ?? definition.intensityStart ?? 0) : undefined;
    const intensityBonus = definition.bonusPerIntensity ? (intensity ?? 0) * definition.bonusPerIntensity : 0;

    const speedValue = actor.system.stats.spd?.total ?? actor.system.stats.spd?.value ?? 0;
    const bonus = computeBonus({ speedValue, assistBonus, intensityBonus });

    const roll = await new Roll("1d100 + @bonus", { bonus }).evaluate();
    const tier = resolveTier(roll.total);

    const effect = definition.resolveTier(tier.id, { intensity });

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
        actorUpdates["flags.pokemonepopee.statusRestriction"] = game.i18n.localize(`PTU.Epopee.Status.Effect.${condition.slug}.${tier.id}`);
    }

    const conditionUpdate = buildConditionUpdate(effect, { intensity });
    if (Object.keys(conditionUpdate).length) await condition.update(conditionUpdate);

    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<div class="header-bar"><p class="action">${game.i18n.format("PTU.Epopee.Status.Chat.Flavor", { name: actor.name, status: statusLabel })}</p></div>`,
        content: `<p>${game.i18n.localize(`PTU.Epopee.Status.Tier.${tier.id}`)} : ${game.i18n.localize(`PTU.Epopee.Status.Effect.${condition.slug}.${tier.id}`)}</p>`
    });

    if (effect.cured) await condition.delete();
}

async function purgeOnRecall(actor) {
    const conditions = actor.conditions.active.filter(c => STATUS_DEFINITIONS[c.slug]?.onRecall && STATUS_DEFINITIONS[c.slug].onRecall !== "none");

    for (const condition of conditions) {
        const definition = STATUS_DEFINITIONS[condition.slug];
        if (definition.onRecall === "cure") {
            await condition.delete();
        } else if (definition.onRecall === "resetIntensity") {
            await condition.update({ "system.value.value": definition.recallIntensity });
        }
    }
}

export { runStatusResistance, purgeOnRecall }
