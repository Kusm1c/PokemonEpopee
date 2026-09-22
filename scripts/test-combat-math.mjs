import assert from "node:assert/strict";
import {
    fragment,
    stabValue,
    mdsDieSize,
    clampStages,
    mdsDiceFormula,
    mdsTerm,
    isModerate,
    attackScaling,
    hasStrayScalingTag,
    attackTerm,
    defenseTerm,
    computePower,
    applyDamageFormula
} from "../src/module/combat-math/formula.js";

let failures = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`OK  ${name}`);
    } catch (error) {
        failures++;
        console.error(`FAIL ${name}\n     ${error.message}`);
    }
}

test("fragment: 25% rounded up", () => {
    assert.equal(fragment(20), 5);
    assert.equal(fragment(21), 6);
    assert.equal(fragment(1), 1);
    assert.equal(fragment(4), 1);
    assert.equal(fragment(5), 2);
});

test("fragment: guards against junk", () => {
    assert.equal(fragment(0), 0);
    assert.equal(fragment(-10), 0);
    assert.equal(fragment(undefined), 0);
    assert.equal(fragment(NaN), 0);
});

test("STAB: 5 + floor(level / 5)", () => {
    assert.equal(stabValue(1), 5);
    assert.equal(stabValue(4), 5);
    assert.equal(stabValue(5), 6);
    assert.equal(stabValue(50), 15);
    assert.equal(stabValue(100), 25);
});

test("MdS die size follows the level brackets", () => {
    assert.equal(mdsDieSize(1), 4);
    assert.equal(mdsDieSize(20), 4);
    assert.equal(mdsDieSize(21), 6);
    assert.equal(mdsDieSize(40), 6);
    assert.equal(mdsDieSize(41), 8);
    assert.equal(mdsDieSize(60), 8);
    assert.equal(mdsDieSize(61), 10);
    assert.equal(mdsDieSize(80), 10);
    assert.equal(mdsDieSize(81), 12);
    assert.equal(mdsDieSize(100), 12);
});

test("combat stages clamp to -6..6", () => {
    assert.equal(clampStages(9), 6);
    assert.equal(clampStages(-9), -6);
    assert.equal(clampStages(3), 3);
    assert.equal(clampStages(0), 0);
});

test("MdS dice formula matches the published table", () => {
    // Every cell of the table in Chronicler -> Combat -> MdS
    const brackets = [[10, 4], [30, 6], [50, 8], [70, 10], [90, 12]];
    for (const [level, die] of brackets) {
        for (let stages = 1; stages <= 6; stages++) {
            assert.equal(mdsDiceFormula(level, stages), `${stages}d${die}`);
        }
    }
    assert.equal(mdsDiceFormula(10, 0), "");
});

test("MdS term carries a sign", () => {
    assert.deepEqual(mdsTerm(30, 2), { formula: "+2d6", sign: 1, dice: "2d6" });
    assert.deepEqual(mdsTerm(30, -2), { formula: "-2d6", sign: -1, dice: "2d6" });
    assert.deepEqual(mdsTerm(30, 0), { formula: "", sign: 0, dice: "" });
});

test("Modere tag detection, both languages, Puissant wins", () => {
    assert.equal(isModerate(["Modere"]), true);
    assert.equal(isModerate(["Modéré"]), true);
    assert.equal(isModerate(["moderate"]), true);
    assert.equal(isModerate(["Puissant"]), false);
    assert.equal(isModerate(["Powerful"]), false);
    assert.equal(isModerate(["Modere", "Puissant"]), false, "Puissant should override Modere");
});

test("status-only moves scale off nothing at all", () => {
    assert.equal(attackScaling([], false), null, "untagged status move: neither");
    assert.equal(attackScaling(["Modéré"], false), null, "tag on a status move is meaningless");
    assert.equal(attackScaling([], true), "moderate", "damaging + untagged: Moderate by default");
    assert.equal(attackScaling(["Puissant"], true), "powerful");
    assert.equal(isModerate([], false), false, "a status move never takes the Fragment path");
});

test("stray scaling tags on status moves are flagged", () => {
    assert.equal(hasStrayScalingTag(["Modéré"], false), true);
    assert.equal(hasStrayScalingTag(["Puissant"], false), true);
    assert.equal(hasStrayScalingTag(["Target 1"], false), false, "unrelated tags are fine");
    assert.equal(hasStrayScalingTag(["Modéré"], true), false, "fine on a damaging move");
});

test("Moderate is the DEFAULT: untagged moves use the Fragment", () => {
    assert.equal(isModerate([]), true, "an untagged move is Moderate");
    assert.equal(isModerate(undefined), true, "missing keywords are Moderate");
    assert.equal(isModerate(["Target 1", "Five Strike"]), true, "unrelated PTR tags don't opt out");
    assert.equal(isModerate(["Target 1", "Puissant"]), false, "only Puissant opts out");
});

test("attack term: full stat, or Fragment when Modere", () => {
    assert.equal(attackTerm(30, false), 30);
    assert.equal(attackTerm(30, true), 8);
});

test("defense term: Fragment by default, full stat on request", () => {
    assert.equal(defenseTerm(20), 5);
    assert.equal(defenseTerm(20, true), 20);
});

test("Step 1: Puissance = Jet + STAB + Attaques + MdS offensifs", () => {
    const { total, breakdown } = computePower({
        jet: 18,
        level: 50,
        attackStat: 30,
        moderate: false,
        offensiveStageDice: 7
    });
    // 18 + (5 + floor(50/5)=15) + 30 + 7
    assert.equal(total, 70);
    assert.equal(breakdown.stab, 15);
    assert.equal(breakdown.attack, 30);
});

test("Step 1: a Modere move uses the attack Fragment", () => {
    const { total, breakdown } = computePower({
        jet: 10,
        level: 10,
        attackStat: 24,
        moderate: true
    });
    // 10 + (5 + 2) + ceil(24/4)=6 + 0
    assert.equal(breakdown.attack, 6);
    assert.equal(total, 23);
});

test("Step 2: (Puissance - Defenses - MdS defensifs) * Type", () => {
    const { total } = applyDamageFormula({
        power: 70,
        defense: 6,
        defensiveStageDice: 4,
        typeMultiplier: 2
    });
    // (70 - 6 - 4) * 2
    assert.equal(total, 120);
});

test("Step 2: the full x0.25 .. x4 ladder", () => {
    const base = { power: 50, defense: 10, defensiveStageDice: 0 };
    assert.equal(applyDamageFormula({ ...base, typeMultiplier: 0.25 }).total, 10);
    assert.equal(applyDamageFormula({ ...base, typeMultiplier: 0.5 }).total, 20);
    assert.equal(applyDamageFormula({ ...base, typeMultiplier: 1 }).total, 40);
    assert.equal(applyDamageFormula({ ...base, typeMultiplier: 2 }).total, 80);
    assert.equal(applyDamageFormula({ ...base, typeMultiplier: 4 }).total, 160);
});

test("Step 2: immunity zeroes it out, and damage never goes negative", () => {
    assert.equal(applyDamageFormula({ power: 50, defense: 10, typeMultiplier: 0 }).total, 0);
    assert.equal(applyDamageFormula({ power: 5, defense: 40, typeMultiplier: 1 }).total, 0);
});

test("Step 2: a negative defensive stage increases damage taken", () => {
    const lowered = applyDamageFormula({ power: 50, defense: 10, defensiveStageDice: -6, typeMultiplier: 1 });
    const neutral = applyDamageFormula({ power: 50, defense: 10, defensiveStageDice: 0, typeMultiplier: 1 });
    assert.ok(lowered.total > neutral.total);
});

test("multi-hit: Power is computed once, applied per hit", () => {
    const { total: power } = computePower({ jet: 20, level: 30, attackStat: 25 });
    const hits = [1, 2, 3].map(() => applyDamageFormula({ power, defense: 5, typeMultiplier: 1 }).total);
    assert.deepEqual(hits, [hits[0], hits[0], hits[0]], "every hit applies the same Power");
});

if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
}
console.log("\nAll combat-math tests passed.");
