import { HAZARD_DEFINITIONS } from "./definitions.js";
import { localize } from "../i18n.js";

function gridDistanceBetween(a, b) {
    const size = canvas.grid.size;
    const dx = Math.abs((a.x - b.x) / size);
    const dy = Math.abs((a.y - b.y) / size);
    return Math.max(dx, dy) * (canvas.scene?.grid?.distance ?? 1);
}

function hazardTilesOnScene() {
    return canvas.scene?.tiles?.filter(t => t.flags.pe?.hazardSlug) ?? [];
}

async function placeHazard(x, y, slug) {
    const definition = HAZARD_DEFINITIONS[slug];
    if (!definition) return;

    const existing = hazardTilesOnScene().find(t => t.flags.pe?.hazardSlug === slug && gridDistanceBetween(t, { x, y }) === 0);
    if (existing) {
        const stacks = (existing.flags.pe?.hazardStacks ?? 1) + 1;
        if (stacks > definition.maxStacks) {
            ui.notifications.warn(localize("PTU.Epopee.Environment.Hazards.MaxStacks", { name: definition.label }));
            return;
        }
        await existing.update({ "flags.pe.hazardStacks": stacks });
        return;
    }

    await canvas.scene.createEmbeddedDocuments("Tile", [{
        x, y,
        width: canvas.grid.size,
        height: canvas.grid.size,
        texture: { src: "icons/svg/mystery-man.svg" },
        flags: { pe: { hazardSlug: slug, hazardStacks: 1 } }
    }]);
}

async function applyHazardEffect(token, tile) {
    const definition = HAZARD_DEFINITIONS[tile.flags.pe.hazardSlug];
    const actor = token.actor;
    if (!definition || !actor) return;

    const stacks = tile.flags.pe?.hazardStacks ?? 1;
    const updates = {};

    if (definition.hpDamageFractionPerStack || definition.hpDamageFraction) {
        const fraction = definition.hpDamageFractionPerStack ? definition.hpDamageFractionPerStack * stacks : definition.hpDamageFraction;
        const fragment = Math.ceil((actor.system.health.max ?? 0) / 20);
        updates["system.health.value"] = Math.max(0, (actor.system.health.value ?? 0) - (fragment * fraction));
    }

    if (definition.stageDeltas) {
        for (const [stat, delta] of Object.entries(definition.stageDeltas)) {
            const current = actor.system.stats[stat]?.stage?.mod ?? 0;
            updates[`system.stats.${stat}.stage.mod`] = current + delta;
        }
    }

    if (definition.damageFormula) {
        const roll = await new Roll(definition.damageFormula).evaluate();
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: localize("PTU.Epopee.Environment.Hazards.DamageRoll", { name: definition.label })
        });
        updates["system.health.value"] = Math.max(0, (actor.system.health.value ?? 0) - roll.total);
    }

    if (Object.keys(updates).length) await actor.update(updates);

    if (definition.poisonIntensityPerStack) {
        const existingPoison = actor.conditions?.active?.find(c => c.slug === "poisoned");
        if (!existingPoison) {
            ui.notifications.info(localize("PTU.Epopee.Environment.Hazards.PoisonManual", { actor: actor.name, name: definition.label, n: stacks * definition.poisonIntensityPerStack }));
        } else {
            const current = existingPoison.value ?? 2;
            await existingPoison.update({ "system.value.value": current + (stacks * definition.poisonIntensityPerStack) });
        }
    }

    await ChatMessage.create({ content: `<p>${localize("PTU.Epopee.Environment.Hazards.Triggers", { actor: actor.name, name: definition.label })}</p>` });

    if (definition.selfDestructs) await tile.delete();
}

async function checkHazardTrigger(token) {
    for (const tile of hazardTilesOnScene()) {
        const definition = HAZARD_DEFINITIONS[tile.flags.pe.hazardSlug];
        if (!definition) continue;
        const distance = gridDistanceBetween(tile, token);
        if (distance > definition.triggerRadius) continue;

        const confirmed = await Dialog.confirm({
            title: localize("PTU.Epopee.Environment.Hazards.TriggeredTitle"),
            content: `<p>${localize("PTU.Epopee.Environment.Hazards.TriggeredContent", { token: token.name, name: definition.label })}</p>`
        });
        if (confirmed) await applyHazardEffect(token, tile);
    }
}

export { placeHazard, checkHazardTrigger }
