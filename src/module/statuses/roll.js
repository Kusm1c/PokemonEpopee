import { STATUS_TIERS, STATUS_RESISTANCE_SPEED_FRACTION, STATUS_RESISTANCE_SCALES_WITH_STATUS_COUNT } from "./config.js";

function computeBonus({ speedValue, activeStatusCount = 1, assistBonus = 0, intensityBonus = 0 }) {
    const speedBonus = Math.round(STATUS_RESISTANCE_SPEED_FRACTION * speedValue);
    const multiplier = STATUS_RESISTANCE_SCALES_WITH_STATUS_COUNT ? Math.max(1, activeStatusCount) : 1;
    return (speedBonus * multiplier) + assistBonus + intensityBonus;
}

function resolveTier(total) {
    return STATUS_TIERS.find(tier => total <= tier.max) ?? STATUS_TIERS[STATUS_TIERS.length - 1];
}

function hpFragment(maxHp, denominator = 20) {
    return Math.ceil(maxHp / denominator);
}

export { computeBonus, resolveTier, hpFragment }
