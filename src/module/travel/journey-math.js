/**
 * Travel macro arithmetic, kept free of Foundry globals so `scripts/test-travel.mjs` can
 * exercise it.
 *
 * The group moves at its slowest member's pace. A Movement of N metres covers N/2 km in
 * an hour's march (the "Vitesse de Déplacement de Base" table), and an hour in haste
 * covers twice that, so a journey of H hours with h of them in haste is worth H + h
 * hours of march. Terrain, condition and movement modes then multiply the pace.
 */

import { computeGroupSpeedKmH } from "./engine.js";
import { CONDITIONS, MAX_HOURS, PATHS, TERRAINS, TRAVEL_MODES, fraction } from "./tables.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Party slots with a speed. "Si c'est blank ou 0, c'est ignoré."
 *
 * @param {{actorId?: string, speed?: number|string}[]} slots
 * @returns {{index: number, actorId: string, speed: number}[]}
 */
function activeMembers(slots = []) {
    return slots
        .map((slot, index) => ({ index, actorId: slot?.actorId ?? "", speed: Number(slot?.speed) || 0 }))
        .filter((member) => member.speed > 0);
}

/**
 * The pace-setter: the lowest speed, and every slot moving at it.
 *
 * @returns {{speed: number, indices: number[]}|null} null when no slot has a speed
 */
function slowestOf(members) {
    if (!members.length) return null;
    const speed = Math.min(...members.map((m) => m.speed));
    return { speed, indices: members.filter((m) => m.speed === speed).map((m) => m.index) };
}

/** Modes usable on this terrain and path. */
function availableModes(terrainId, pathId, modes = TRAVEL_MODES) {
    return modes.filter((mode) =>
        !(mode.forbiddenTerrains ?? []).includes(terrainId)
        && !(mode.forbiddenPaths ?? []).includes(pathId));
}

/**
 * The selected modes that actually apply: available here, and one per exclusive group
 * (the first one listed wins, as the macro only ever lets one through).
 */
function effectiveModes(selectedIds = [], terrainId, pathId, modes = TRAVEL_MODES) {
    const seenGroups = new Set();
    return availableModes(terrainId, pathId, modes).filter((mode) => {
        if (!selectedIds.includes(mode.id)) return false;
        if (!mode.group) return true;
        if (seenGroups.has(mode.group)) return false;
        seenGroups.add(mode.group);
        return true;
    });
}

/**
 * Everything the Travel macro previews, from its saved configuration.
 *
 * @param {object} config
 * @returns {object}
 */
function planJourney({ slots, terrainId, pathId, conditionId, hours, hasteHours, modes: selected } = {}, modeTable = TRAVEL_MODES) {
    const terrain = TERRAINS.find((t) => t.id === terrainId) ?? TERRAINS[0];
    const path = PATHS.includes(pathId) ? pathId : PATHS[0];
    const condition = CONDITIONS.find((c) => c.id === conditionId) ?? CONDITIONS[0];

    const totalHours = clamp(Math.round(Number(hours) || 1), 1, MAX_HOURS);
    const haste = clamp(Math.round(Number(hasteHours) || 0), 0, totalHours);

    const members = activeMembers(slots);
    const slowest = slowestOf(members);
    const baseKmPerHour = slowest ? computeGroupSpeedKmH(slowest.speed) : 0;

    const terrainMultiplier = fraction(terrain.speed[path]);
    const conditionMultiplier = fraction(condition.speed);
    const modes = effectiveModes(selected, terrain.id, path, modeTable);
    const modesMultiplier = modes.reduce((product, mode) => product * fraction(mode.speed), 1);

    const kmPerHour = baseKmPerHour * terrainMultiplier * conditionMultiplier * modesMultiplier;
    const km = kmPerHour * (totalHours + haste);

    return {
        terrain, path, condition, modes,
        hours: totalHours,
        hasteHours: haste,
        members, slowest,
        baseKmPerHour,
        terrainMultiplier, conditionMultiplier, modesMultiplier,
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

export { activeMembers, slowestOf, availableModes, effectiveModes, planJourney, journeyProgress };
