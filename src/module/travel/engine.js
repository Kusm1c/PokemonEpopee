import { KM_PER_HOUR_PER_2M_MOVE } from "./definitions.js";

function computeGroupSpeedKmH(slowestMoveMeters) {
    return (slowestMoveMeters / 2) * KM_PER_HOUR_PER_2M_MOVE;
}

function isNavigationSuccess(total, dc) {
    return total >= dc;
}

function advanceProgression({ current, thresholdKm, kmThisQuarter }) {
    const total = current + kmThisQuarter;
    if (total >= thresholdKm) {
        return { newProgression: 0, exited: true, overflowKm: total - thresholdKm };
    }
    return { newProgression: total, exited: false, overflowKm: 0 };
}

export { computeGroupSpeedKmH, isNavigationSuccess, advanceProgression }
