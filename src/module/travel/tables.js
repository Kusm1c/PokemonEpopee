/**
 * Travel tables: terrain and condition speed modifiers, navigation and foraging DCs, and
 * the movement options of the Travel macro.
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
 * Movement modes of the Travel macro, each multiplying the speed.
 *
 * Shape: `{ id, speed: "3/4", group?: "mount", forbiddenTerrains?: ["jungle"],
 * forbiddenPaths?: ["trackless"] }`. Modes sharing a `group` are exclusive - picking one
 * drops the others - while modes in different groups stack. A mode is unavailable on a
 * forbidden terrain or path.
 *
 * Empty until the rules for them are settled; the macro shows the section once there is
 * something in it.
 */
const TRAVEL_MODES = [];

/** "Vitesse de Déplacement de Base": the Movement values the reference table lists. */
const BASE_SPEED_METRES = [2, 4, 5, 6, 8];

/**
 * Rows of that table, in km for each Movement above, copied as printed - the reference
 * shows these values, not ones recomputed from a formula.
 */
const BASE_SPEED_ROWS = [
    { id: "hourMarch", km: [1, 2, 2.5, 3, 4] },
    { id: "hourHaste", km: [2, 4, 5, 6, 8] },
    { id: "quarter", km: [4, 8, 10, 12, 16] },
    { id: "day", km: [8, 16, 20, 24, 32] }
];

/** Movement choices of the Travel macro: "menu déroulant de 1 à 20". */
const SPEED_CHOICES = Array.from({ length: 20 }, (_, i) => i + 1);

/** Duration and haste choices: "menu déroulant de 1 à 30". */
const MAX_HOURS = 30;

/** Party slots of the Travel macro: "Prévoir 6 slots". */
const PARTY_SLOTS = 6;

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

export {
    PATHS, TERRAINS, CONDITIONS, TRAVEL_MODES,
    BASE_SPEED_METRES, BASE_SPEED_ROWS, SPEED_CHOICES, MAX_HOURS, PARTY_SLOTS,
    NAVIGATION_SKILL, NAVIGATION_BONUSES, DEVIATION_FORMULA, PARTY_FOLDER,
    fraction
};
