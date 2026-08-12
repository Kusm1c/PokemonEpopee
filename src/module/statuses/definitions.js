const STATUS_DEFINITIONS = {
    amoureux: {
        slug: "amoureux",
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

    brulure: {
        slug: "brulure",
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

    confusion: {
        slug: "confusion",
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

    empoisonnement: {
        slug: "empoisonnement",
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

    paralysie: {
        slug: "paralysie",
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
        slug: "peur",
        typeImmunities: [],
        hasIntensity: false,
        onRecall: "none",
        resolveTier(tierId) {
            if (tierId === "complete") return { cured: true };
            return { skipTurn: true, cured: true };
        }
    },

    sommeil: {
        slug: "sommeil",
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

export { STATUS_DEFINITIONS }
