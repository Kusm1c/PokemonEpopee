/**
 * Travel tables: terrain and condition speed modifiers, navigation and foraging DCs, and
 * the movement modes (paces) of the Travel macro.
 *
 * One source for everything travel reads: the Travel and Navigator macros take their
 * choices from here, and the in-game reference journal is generated from it, so a value
 * changed here shows up everywhere on the next load.
 *
 * Multipliers are written as the fractions the rules print ("3/4") and converted where
 * they are used, so the reference shows exactly what the tables say.
 */

/** Path columns of the terrain table, in the order the table prints them. */
const PATHS = ["road", "trail", "trackless"];

/** "Modificateurs de Terrain". `speed` is per path; DCs are the Navigation and Forage DCs. */
const TERRAINS = [
    { id: "desert", speed: { road: "1", trail: "1/2", trackless: "1/2" }, navigationDC: 60, forageDC: 100 },
    { id: "forestSparse", speed: { road: "1", trail: "1", trackless: "1/2" }, navigationDC: 70, forageDC: 70 },
    { id: "forestMedium", speed: { road: "1", trail: "1", trackless: "1/2" }, navigationDC: 80, forageDC: 70 },
    { id: "forestDense", speed: { road: "1", trail: "1", trackless: "1/2" }, navigationDC: 90, forageDC: 70 },
    { id: "hills", speed: { road: "1", trail: "3/4", trackless: "1/2" }, navigationDC: 70, forageDC: 60 },
    { id: "jungle", speed: { road: "1", trail: "3/4", trackless: "1/4" }, navigationDC: 80, forageDC: 70 },
    { id: "peatBog", speed: { road: "1", trail: "1", trackless: "3/4" }, navigationDC: 70, forageDC: 80 },
    { id: "mountain", speed: { road: "3/4", trail: "3/4", trackless: "1/2" }, navigationDC: 80, forageDC: 90 },
    { id: "plains", speed: { road: "1", trail: "1", trackless: "3/4" }, navigationDC: 60, forageDC: 60 },
    { id: "marsh", speed: { road: "1", trail: "3/4", trackless: "1/2" }, navigationDC: 75, forageDC: 80 },
    { id: "tundraIce", speed: { road: "1", trail: "3/4", trackless: "3/4" }, navigationDC: 60, forageDC: 90 }
];

/** "Modificateur de Condition". `none` is the default: no condition, no change. */
const CONDITIONS = [
    { id: "none", speed: "1" },
    { id: "hotCold", speed: "3/4" },
    { id: "giantTerrain", speed: "3/4" },
    { id: "hurricane", speed: "1/10" },
    { id: "ledMount", speed: "3/4" },
    { id: "lowVisibility", speed: "1/2" },
    { id: "riverCrossing", speed: "3/4" },
    { id: "snow", speed: "1/2" },
    { id: "deepSnow", speed: "1/4" },
    { id: "storm", speed: "3/4" },
    { id: "strongStorm", speed: "1/2" }
];

/**
 * "Mode de Déplacement", which the party can change each Quart. It sets the group's
 * speed, replacing the per-character Movement the macro used to ask for.
 *
 * `navigation` is what the Navigator macro applies to the Survival roll: a flat
 * modifier, and whether the roll is made twice with the best kept. The other effects
 * (Stealth, Perception, encounter odds) are for the GM and shown as text.
 */
const TRAVEL_PACES = [
    { id: "exploration", kmPerHour: 1, navigation: { modifier: 0, rollTwice: true } },
    { id: "slow", kmPerHour: 2, navigation: { modifier: 0, rollTwice: true } },
    { id: "normal", kmPerHour: 3, navigation: { modifier: 0, rollTwice: false } },
    { id: "fast", kmPerHour: 4, navigation: { modifier: -20, rollTwice: false } }
];

/** The mode a new journey starts on. */
const DEFAULT_PACE = "normal";

/** Duration choices: "menu déroulant de 1 à 30". */
const MAX_HOURS = 30;

/** The Navigator's roll: a Survival check against the terrain's Navigation DC. */
const NAVIGATION_SKILL = "survival";

/** Equipment that helps the Navigator, added to the roll as modifiers. */
const NAVIGATION_BONUSES = [
    { id: "compass", value: 10 },
    { id: "reconReport", value: 20 }
];

/** "Sur un échec les joueurs sont perdus : Roll 1d10 pour définir leur déviation." */
const DEVIATION_FORMULA = "1d10";

/** Trainers offered by both macros live in this Actor folder, or any folder inside it. */
const PARTY_FOLDER = "00 PJs";

/**
 * "3/4" -> 0.75. A malformed value counts as 1, so a typo in a table slows nobody down
 * to zero.
 *
 * @param {string|number} text
 * @returns {number}
 */
function fraction(text) {
    const [num, den = "1"] = String(text).split("/");
    const value = Number(num) / Number(den);
    return Number.isFinite(value) && value > 0 ? value : 1;
}

/** @param {string} id @returns {object} the pace, or the default one */
function paceById(id) {
    return TRAVEL_PACES.find((p) => p.id === id) ?? TRAVEL_PACES.find((p) => p.id === DEFAULT_PACE);
}

export {
    PATHS, TERRAINS, CONDITIONS, TRAVEL_PACES, DEFAULT_PACE, MAX_HOURS,
    NAVIGATION_SKILL, NAVIGATION_BONUSES, DEVIATION_FORMULA, PARTY_FOLDER,
    fraction, paceById
};
