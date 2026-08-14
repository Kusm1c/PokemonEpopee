import { WEATHER_DEFINITIONS, FIELD_DEFINITIONS, ZONE_DEFINITIONS } from "./definitions.js";

function isGrounded(actor) {
    return !actor.types?.includes("Flying");
}

async function announce(text) {
    await ChatMessage.create({ content: `<p><strong>${text}</strong></p>` });
}

async function applyStageBonus(combat, definition, sign) {
    if (!definition.typeStageBonus && !definition.nonTypeStagePenalty && !definition.purgeStages) return;

    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor) continue;
        const updates = {};

        if (definition.typeStageBonus && actor.types?.includes(definition.typeStageBonus.type)) {
            const stat = definition.typeStageBonus.stat;
            const current = actor.system.stats[stat]?.stage?.mod ?? 0;
            updates[`system.stats.${stat}.stage.mod`] = current + (sign * definition.typeStageBonus.stageDelta);
        }

        if (definition.nonTypeStagePenalty && !actor.types?.includes(definition.nonTypeStagePenalty.exceptType)) {
            const stat = definition.nonTypeStagePenalty.stat;
            const current = actor.system.stats[stat]?.stage?.mod ?? 0;
            updates[`system.stats.${stat}.stage.mod`] = current + (sign * definition.nonTypeStagePenalty.stageDelta);
        }

        if (definition.purgeStages && sign > 0) {
            for (const stat of ["atk", "def", "spatk", "spdef", "spd"]) {
                updates[`system.stats.${stat}.stage.mod`] = 0;
            }
        }

        if (Object.keys(updates).length) await actor.update(updates);
    }
}

async function startWeather(combat, slug, extended = false) {
    const definition = WEATHER_DEFINITIONS[slug];
    if (!definition) return;
    const existing = combat.flags.ptu?.weather;
    if (existing) await applyStageBonus(combat, WEATHER_DEFINITIONS[existing.slug], -1);

    await combat.update({ "flags.ptu.weather": { slug, remaining: extended ? definition.extendedDuration : definition.duration } });
    await applyStageBonus(combat, definition, 1);
    await announce(game.i18n.format("PTU.Epopee.Environment.Chat.WeatherStart", { name: game.i18n.localize(`PTU.Epopee.Environment.Weather.${slug}`) }));
}

async function startField(combat, slug, extended = false) {
    const definition = FIELD_DEFINITIONS[slug];
    if (!definition) return;
    await combat.update({ "flags.ptu.field": { slug, remaining: extended ? definition.extendedDuration : definition.duration } });
    await announce(game.i18n.format("PTU.Epopee.Environment.Chat.FieldStart", { name: game.i18n.localize(`PTU.Epopee.Environment.Field.${slug}`) }));
}

async function clearWeather(combat) {
    const existing = combat.flags.ptu?.weather;
    if (existing) await applyStageBonus(combat, WEATHER_DEFINITIONS[existing.slug], -1);
    await combat.update({ "flags.ptu.weather": null });
}

async function clearField(combat) {
    await combat.update({ "flags.ptu.field": null });
}

async function toggleZone(combat, slug) {
    const definition = ZONE_DEFINITIONS[slug];
    if (!definition) return;

    const active = combat.flags.ptu?.zones?.[slug] !== undefined;
    if (active) {
        await combat.update({ [`flags.ptu.zones.-=${slug}`]: null });
        await announce(game.i18n.format("PTU.Epopee.Environment.Chat.ZoneEnd", { name: game.i18n.localize(`PTU.Epopee.Environment.Zone.${slug}`) }));
    } else {
        await combat.update({ [`flags.ptu.zones.${slug}`]: definition.duration });
        await announce(game.i18n.format("PTU.Epopee.Environment.Chat.ZoneStart", { name: game.i18n.localize(`PTU.Epopee.Environment.Zone.${slug}`) }));
    }
}

async function tickZones(combat) {
    const zones = combat.flags.ptu?.zones ?? {};
    const updates = {};
    for (const [slug, remaining] of Object.entries(zones)) {
        const next = remaining - 1;
        if (next <= 0) {
            updates[`flags.ptu.zones.-=${slug}`] = null;
            await announce(game.i18n.format("PTU.Epopee.Environment.Chat.ZoneEnd", { name: game.i18n.localize(`PTU.Epopee.Environment.Zone.${slug}`) }));
        } else {
            updates[`flags.ptu.zones.${slug}`] = next;
        }
    }
    if (Object.keys(updates).length) await combat.update(updates);
}

function getActiveTypeModifiers(combat) {
    const modifiers = [];
    const weather = combat?.flags.ptu?.weather;
    const field = combat?.flags.ptu?.field;

    if (weather) {
        const definition = WEATHER_DEFINITIONS[weather.slug];
        if (definition?.typeBoost) modifiers.push(definition.typeBoost);
        if (definition?.typePenalty) modifiers.push(definition.typePenalty);
    }
    if (field) {
        const definition = FIELD_DEFINITIONS[field.slug];
        if (definition?.typeBoost) modifiers.push(definition.typeBoost);
        if (definition?.typePenalty) modifiers.push(definition.typePenalty);
    }
    return modifiers;
}

async function applyPerRoundEffects(combat) {
    const weather = combat.flags.ptu?.weather;
    const field = combat.flags.ptu?.field;
    if (!weather && !field) return;

    for (const combatant of combat.combatants) {
        const actor = combatant.actor;
        if (!actor) continue;

        const updates = {};

        if (weather) {
            const definition = WEATHER_DEFINITIONS[weather.slug];

            if (definition.damageFraction && !definition.damageImmuneTypes?.some(type => actor.types?.includes(type))) {
                const fragment = Math.ceil((actor.system.health.max ?? 0) / 20);
                updates["system.health.value"] = Math.max(0, (actor.system.health.value ?? 0) - (fragment * definition.damageFraction));
            }
        }

        if (field && isGrounded(actor)) {
            const definition = FIELD_DEFINITIONS[field.slug];

            if (definition.healFraction) {
                const fragment = Math.ceil((actor.system.health.max ?? 0) / 20);
                const max = actor.system.health.max ?? 0;
                updates["system.health.value"] = Math.min(max, (actor.system.health.value ?? 0) + (fragment * definition.healFraction));
            }
        }

        if (Object.keys(updates).length) await actor.update(updates);
    }
}

async function tickEnvironment(combat) {
    const weather = combat.flags.ptu?.weather;
    const field = combat.flags.ptu?.field;

    await applyPerRoundEffects(combat);
    await tickZones(combat);

    if (weather) {
        const remaining = weather.remaining - 1;
        if (remaining <= 0) {
            await clearWeather(combat);
            await announce(game.i18n.format("PTU.Epopee.Environment.Chat.WeatherEnd", { name: game.i18n.localize(`PTU.Epopee.Environment.Weather.${weather.slug}`) }));
        } else {
            await combat.update({ "flags.ptu.weather.remaining": remaining });
        }
    }

    if (field) {
        const remaining = field.remaining - 1;
        if (remaining <= 0) {
            await clearField(combat);
            await announce(game.i18n.format("PTU.Epopee.Environment.Chat.FieldEnd", { name: game.i18n.localize(`PTU.Epopee.Environment.Field.${field.slug}`) }));
        } else {
            await combat.update({ "flags.ptu.field.remaining": remaining });
        }
    }
}

export { startWeather, startField, clearWeather, clearField, toggleZone, tickEnvironment, getActiveTypeModifiers, isGrounded }
