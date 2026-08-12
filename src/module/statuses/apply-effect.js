import { hpFragment } from "./roll.js";

function buildActorUpdate(effect, { currentHp, maxHp, stageMods = {} }) {
    const update = {};

    if (effect.hpDamageFraction) {
        const damage = hpFragment(maxHp) * effect.hpDamageFraction;
        update["system.health.value"] = Math.max(0, currentHp - damage);
    }

    if (effect.stageDeltas) {
        for (const [stat, delta] of Object.entries(effect.stageDeltas)) {
            const current = stageMods[stat] ?? 0;
            update[`system.stats.${stat}.stage.mod`] = current + delta;
        }
    }

    return update;
}

function buildConditionUpdate(effect, { intensity } = {}) {
    const update = {};

    if (typeof effect.intensityDelta === "number" && typeof intensity === "number") {
        update["system.value.value"] = Math.max(0, intensity + effect.intensityDelta);
    }

    return update;
}

function getModerateSelfDamage(actor) {
    // Valeur "Modérée" ATK/SPATK : placeholder en attendant la table officielle Faible/Modérée/Forte de PTR pour les dégâts basés sur une stat.
    const atk = actor.system.stats.atk?.total ?? actor.system.stats.atk?.value ?? 0;
    const spatk = actor.system.stats.spatk?.total ?? actor.system.stats.spatk?.value ?? 0;
    return Math.max(atk, spatk);
}

export { buildActorUpdate, buildConditionUpdate, getModerateSelfDamage }
