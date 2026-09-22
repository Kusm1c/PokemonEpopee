/**
 * Parsing for PTR's `system.frequency` string, so it can drive a real usage counter
 * instead of being a display label.
 *
 * Stock PTR writes things like "At-Will", "Scene x2", "Daily x3", "EOT", "Static", and
 * often with an action suffix ("At Will - Standard Action"). Nothing in the codebase
 * read the number back out, which is why the End of Scene button had nothing to reset.
 *
 * Pure module, written without `?.` / `??` so `scripts/test-usage.mjs` runs under the
 * old node available here.
 */

/** Periods a usage pool can reset on, in the order they are refreshed. */
const PERIODS = {
    EOT: "eot",       // end of turn
    SCENE: "scene",
    DAILY: "daily"
};

/** Frequencies that never run out and so need no counter. */
const UNLIMITED = ["at-will", "at will", "static", "", "none"];

/**
 * @typedef {object} ParsedFrequency
 * @property {string|null} period    One of PERIODS, or null when unlimited
 * @property {number|null} max       Uses per period, or null when unlimited
 * @property {boolean} unlimited
 * @property {string} raw
 */

/**
 * @param {string} frequency
 * @returns {ParsedFrequency}
 */
function parseFrequency(frequency) {
    const raw = typeof frequency === "string" ? frequency : "";
    // Strip the action suffix: "At Will - Standard Action" -> "At Will"
    const head = raw.split("-")[0].trim().toLowerCase();
    const unlimited = { period: null, max: null, unlimited: true, raw };

    if (UNLIMITED.indexOf(head) !== -1) return unlimited;
    // "At-Will" survives the split as "at" because of the hyphen; catch it explicitly.
    if (head === "at" && raw.toLowerCase().indexOf("at-will") === 0) return unlimited;

    const match = head.match(/^(eot|scene|daily)(?:\s*x\s*(\d+))?$/);
    if (!match) return unlimited;

    const period = match[1];
    const max = match[2] ? Number(match[2]) : 1;

    return { period, max, unlimited: false, raw };
}

/**
 * How many uses an item has left.
 *
 * `used` is what is stored on the item; everything else is derived, so an item whose
 * frequency changes recomputes its pool without needing a migration.
 *
 * @param {string} frequency
 * @param {number} used
 * @returns {{unlimited: boolean, period: string|null, max: number|null, used: number, remaining: number|null, exhausted: boolean}}
 */
function usageState(frequency, used) {
    const parsed = parseFrequency(frequency);
    const spent = Number.isFinite(Number(used)) && Number(used) > 0 ? Math.floor(Number(used)) : 0;

    if (parsed.unlimited) {
        return { unlimited: true, period: null, max: null, used: 0, remaining: null, exhausted: false };
    }

    const remaining = Math.max(0, parsed.max - spent);
    return {
        unlimited: false,
        period: parsed.period,
        max: parsed.max,
        used: Math.min(spent, parsed.max),
        remaining,
        exhausted: remaining === 0
    };
}

/**
 * Does this frequency reset when the given period elapses?
 *
 * A day contains scenes, so resetting "daily" alone would leave Scene pools stale after
 * a night's rest. Callers decide whether to cascade; `resetsOn` answers only the direct
 * question.
 *
 * @param {string} frequency
 * @param {string} period
 * @returns {boolean}
 */
function resetsOn(frequency, period) {
    const parsed = parseFrequency(frequency);
    if (parsed.unlimited) return false;
    return parsed.period === period;
}

export { PERIODS, parseFrequency, usageState, resetsOn };
