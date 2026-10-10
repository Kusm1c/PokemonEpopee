/**
 * Travel macro arithmetic, kept free of Foundry globals so `scripts/test-travel-journey.mjs`
 * can exercise it.
 *
 * The party moves at the speed of its Movement Mode (Exploration 1, Slow 2, Normal 3,
 * Fast 4 km/h); terrain and condition then multiply it, and the duration gives the
 * distance.
 */

import { CONDITIONS, MAX_HOURS, PATHS, TERRAINS, fraction, paceById } from "./tables.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Everything the Travel macro previews, from its saved configuration.
 *
 * @param {{terrainId?: string, pathId?: string, conditionId?: string, hours?: number, paceId?: string}} config
 * @returns {object}
 */
function planJourney({ terrainId, pathId, conditionId, hours, paceId } = {}) {
    const terrain = TERRAINS.find((t) => t.id === terrainId) ?? TERRAINS[0];
    const path = PATHS.includes(pathId) ? pathId : PATHS[0];
    const condition = CONDITIONS.find((c) => c.id === conditionId) ?? CONDITIONS[0];
    const pace = paceById(paceId);
    const totalHours = clamp(Math.round(Number(hours) || 1), 1, MAX_HOURS);

    const terrainMultiplier = fraction(terrain.speed[path]);
    const conditionMultiplier = fraction(condition.speed);
    const kmPerHour = pace.kmPerHour * terrainMultiplier * conditionMultiplier;
    const km = kmPerHour * totalHours;

    return {
        terrain, path, condition, pace,
        hours: totalHours,
        baseKmPerHour: pace.kmPerHour,
        terrainMultiplier, conditionMultiplier,
        kmPerHour: round1(kmPerHour),
        km: round1(km),
        // One square per km travelled; a journey that covers any ground gets at least one.
        squares: km > 0 ? Math.max(1, Math.round(km)) : 0
    };
}

/**
 * Progress shown under the chat card: "{KmTraversés/KmPrévus}" and
 * "{heuresUtilisées/heuresPrévues}".
 *
 * Each square is a km. Hours are taken in proportion to the ground covered, so ticking
 * half the squares reads as half the planned hours. The last square closes the journey
 * exactly, even when the planned distance is not a whole number of km.
 *
 * @param {{km: number, hours: number, squares: number}} plan
 * @param {number} checked squares ticked
 */
function journeyProgress({ km, hours, squares }, checked) {
    const done = clamp(Math.round(Number(checked) || 0), 0, squares);
    const kmDone = done >= squares ? km : Math.min(done, km);
    const hoursUsed = km > 0 ? round1((hours * kmDone) / km) : 0;
    return { checked: done, kmDone: round1(kmDone), hoursUsed };
}

export { planJourney, journeyProgress };
