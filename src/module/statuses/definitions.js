const STATUS_DEFINITIONS = {
    infatuation: {
        kind: "status",
        slug: "infatuation",
        pokemonOnly: true,
        typeImmunities: [],
        hasIntensity: false,
        onRecall: "cure",
        resolveTier(tierId) {
            switch (tierId) {
                case "aucune":
                case "faible":
                    return { targetLockout: true };
                case "moyenne":
                    return {};
                default:
                    return { cured: true };
            }
        }
    },

    burned: {
        kind: "status",
        slug: "burned",
        typeImmunities: ["Fire"],
        hasIntensity: false,
        passiveStageDeltas: { def: -2 },
        onRecall: "none",
        resolveTier(tierId) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                    return { hpDamageFraction: 1 };
                case "forte":
                    return {};
                default:
                    return { cured: true };
            }
        }
    },

    confused: {
        kind: "status",
        slug: "confused",
        typeImmunities: [],
        hasIntensity: false,
        onRecall: "cure",
        resolveTier(tierId) {
            switch (tierId) {
                case "aucune":
                case "faible":
                    return { moveActionOnly: true, selfDamage: "moderate" };
                case "moyenne":
                    return { selfDamage: "moderate" };
                default:
                    return { cured: true };
            }
        }
    },

    poisoned: {
        kind: "status",
        slug: "poisoned",
        typeImmunities: ["Poison", "Steel"],
        hasIntensity: true,
        intensityStart: 2,
        onRecall: "resetIntensity",
        recallIntensity: 2,
        resolveTier(tierId, { intensity }) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                    return { hpDamageFraction: intensity, intensityDelta: 1 };
                case "forte":
                    return { hpDamageFraction: intensity };
                default: {
                    const remaining = intensity - 4;
                    return { intensityDelta: -4, cured: remaining <= 0 };
                }
            }
        }
    },

    engelure: {
        kind: "status",
        slug: "engelure",
        typeImmunities: ["Ice"],
        hasIntensity: false,
        passiveStageDeltas: { spdef: -2 },
        onRecall: "none",
        resolveTier(tierId) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                    return { hpDamageFraction: 1 };
                case "forte":
                    return {};
                default:
                    return { cured: true };
            }
        }
    },

    paralysis: {
        kind: "status",
        slug: "paralysis",
        typeImmunities: ["Electric"],
        hasIntensity: false,
        passiveSpeedMultiplier: 0.5,
        onRecall: "none",
        resolveTier(tierId) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                    return { noMoveAction: true, rollPenalty: -4 };
                case "forte":
                    return { noMoveAction: true };
                default:
                    return { cured: true };
            }
        }
    },

    peur: {
        kind: "status",
        slug: "peur",
        typeImmunities: [],
        hasIntensity: false,
        onRecall: "none",
        resolveTier(tierId) {
            if (tierId === "complete") return { cured: true };
            return { skipTurn: true, cured: true };
        }
    },

    sleep: {
        kind: "status",
        slug: "sleep",
        typeImmunities: [],
        hasIntensity: true,
        intensityStart: 0,
        onRecall: "resetIntensity",
        recallIntensity: 0,
        bonusPerIntensity: 10,
        resolveTier(tierId, { intensity }) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                case "forte":
                    return { skipTurn: true, intensityDelta: 1 };
                default:
                    return { cured: true };
            }
        }
    }
}

function resolveTrapTier(tierId, { hpDamageFraction = 0 } = {}) {
    switch (tierId) {
        case "tresForte":
            return { managesToMove: true };
        case "complete":
            return { durationDelta: -4 };
        default:
            return hpDamageFraction ? { hpDamageFraction } : {};
    }
}

function makeTrap(slug, startDuration, hpDamageFraction) {
    return {
        kind: "trap",
        slug,
        typeImmunities: [],
        hasIntensity: false,
        hasDuration: true,
        durationTicks: true,
        startDuration,
        onRecall: "cure",
        resolveTier(tierId) {
            return resolveTrapTier(tierId, { hpDamageFraction });
        }
    };
}

const TRAP_DEFINITIONS = {
    secretion: makeTrap("secretion", 5, 0),
    "time-howl": makeTrap("time-howl", 20, 0),
    "flame-dance": makeTrap("flame-dance", 5, 1),
    "magma-vortex": makeTrap("magma-vortex", 5, 2),
    "free-fall": makeTrap("free-fall", 1, 0),
    "sand-tomb": makeTrap("sand-tomb", 5, 1),
    "ice-age": makeTrap("ice-age", 1, 0),
    embrace: makeTrap("embrace", 5, 1),
    block: makeTrap("block", 999, 0),
    binding: makeTrap("binding", 5, 1),
    clamp: makeTrap("clamp", 5, 1),
    siphon: makeTrap("siphon", 5, 1),
    "spirit-lock": makeTrap("spirit-lock", 5, 0),
    harassment: makeTrap("harassment", 5, 3)
}

function resolveCoatTier(tierId) {
    switch (tierId) {
        case "forte":
            return { renewed: true };
        case "tresForte":
        case "complete":
            return { renewed: true, empowered: true };
        default:
            return { decayIfNotRenewed: true };
    }
}

function makeCoat(slug) {
    return {
        kind: "coat",
        slug,
        typeImmunities: [],
        hasIntensity: false,
        hasDuration: true,
        onRecall: "cure",
        resolveTier(tierId) {
            return resolveCoatTier(tierId);
        }
    };
}

const COAT_DEFINITIONS = {
    "fire-whirl": makeCoat("fire-whirl"),
    "mud-throw": makeCoat("mud-throw"),
    "powder-cloud": {
        kind: "coat",
        slug: "powder-cloud",
        typeImmunities: [],
        hasIntensity: true,
        intensityStart: 1,
        onRecall: "cure",
        resolveTier(tierId, { intensity }) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                    return { intensityDelta: 1 };
                case "forte":
                    return {};
                default:
                    return { intensityDelta: -1 };
            }
        }
    },
    roots: makeCoat("roots"),
    "aurora-veil": makeCoat("aurora-veil"),
    "mist-coat": makeCoat("mist-coat"),
    "power-coat": makeCoat("power-coat"),
    substitute: {
        kind: "coat",
        slug: "substitute",
        typeImmunities: [],
        hasIntensity: false,
        onRecall: "cure",
        resolveTier(tierId) {
            switch (tierId) {
                case "aucune":
                case "faible":
                case "moyenne":
                    return { cloneDamage: true };
                case "forte":
                    return {};
                default:
                    return { cloneHeal: true };
            }
        }
    },
    "aqua-ring": makeCoat("aqua-ring")
}

const ALL_STATUS_DEFINITIONS = { ...STATUS_DEFINITIONS, ...TRAP_DEFINITIONS, ...COAT_DEFINITIONS }

export { STATUS_DEFINITIONS, TRAP_DEFINITIONS, COAT_DEFINITIONS, ALL_STATUS_DEFINITIONS }
