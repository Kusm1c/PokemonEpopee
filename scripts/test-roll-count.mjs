import assert from "node:assert/strict";
import { MAX_ROLL_COUNT, clampRollCount, multiDie, multiPool } from "../src/module/system/check/roll-count.js";

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

test("clampRollCount: whole numbers from 1 to the max", () => {
    assert.equal(clampRollCount(1), 1);
    assert.equal(clampRollCount(3), 3);
    assert.equal(clampRollCount("2"), 2);
    assert.equal(clampRollCount(2.7), 2);
    assert.equal(clampRollCount(MAX_ROLL_COUNT + 5), MAX_ROLL_COUNT);
});

test("clampRollCount: junk falls back to a single roll", () => {
    assert.equal(clampRollCount(0), 1);
    assert.equal(clampRollCount(-2), 1);
    assert.equal(clampRollCount(""), 1);
    assert.equal(clampRollCount(undefined), 1);
    assert.equal(clampRollCount("abc"), 1);
});

test("multiDie: a single roll is unchanged", () => {
    assert.equal(multiDie(100, 1), "1d100");
    assert.equal(multiDie(20, 0), "1d20");
});

test("multiDie: several rolls keep the highest, or the lowest when low wins", () => {
    assert.equal(multiDie(100, 2), "2d100kh");
    assert.equal(multiDie(100, 3, true), "3d100kl");
});

test("multiPool: a single roll is unchanged", () => {
    assert.equal(multiPool("4d20", 1), "4d20");
});

test("multiPool: several rolls of a pool keep the best total", () => {
    assert.equal(multiPool("4d20", 2), "{4d20, 4d20}kh");
    assert.equal(multiPool("4d20 + 1d6", 3), "{4d20 + 1d6, 4d20 + 1d6, 4d20 + 1d6}kh");
    assert.equal(multiPool("2d20", 2, true), "{2d20, 2d20}kl");
});

if (failures) {
    console.error(`\n${failures} test(s) failed.`);
    process.exit(1);
}
console.log("\nAll roll-count tests passed.");
