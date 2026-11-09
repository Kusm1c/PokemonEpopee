/**
 * "Nombre de jets": a roll made several times, keeping the best result (advantage).
 *
 * Expressed as a single Foundry roll, so the chat shows every die and strikes out the
 * ones not kept: a one-die check becomes "3d100kh", a dice pool such as a skill check's
 * "{4d20 + 1d6, 4d20 + 1d6}kh". Where a low result wins (the capture check), "kl" keeps
 * the lowest instead.
 *
 * Pure module - no Foundry globals - so it can be exercised from a test script.
 */

const MAX_ROLL_COUNT = 10;

/** A number of rolls from user input: a whole number from 1 to MAX_ROLL_COUNT. */
function clampRollCount(value) {
    const count = Math.floor(Number(value));
    if (!Number.isFinite(count) || count < 1) return 1;
    return Math.min(count, MAX_ROLL_COUNT);
}

/** One die rolled `count` times, keeping the best: "1d100", or "3d100kh". */
function multiDie(faces, count, lowerIsBetter = false) {
    const n = clampRollCount(count);
    return n > 1 ? `${n}d${faces}${lowerIsBetter ? "kl" : "kh"}` : `1d${faces}`;
}

/** A dice formula rolled `count` times, keeping the best total: "{4d20, 4d20}kh". */
function multiPool(dice, count, lowerIsBetter = false) {
    const n = clampRollCount(count);
    return n > 1 ? `{${Array(n).fill(dice).join(", ")}}${lowerIsBetter ? "kl" : "kh"}` : dice;
}

export { MAX_ROLL_COUNT, clampRollCount, multiDie, multiPool };
