import assert from "node:assert/strict";
import { hoursBonus, nextDifficulty } from "../src/module/actor/pokemon/training.js";

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

test("hours in a row: +1, +2, +3... (3 hours = 6)", () => {
    assert.equal(hoursBonus(0), 0);
    assert.equal(hoursBonus(1), 1);
    assert.equal(hoursBonus(3), 6);
    assert.equal(hoursBonus(5), 15);
    assert.equal(hoursBonus(-2), 0);
    assert.equal(hoursBonus("2"), 3);
});

test("Training Difficulty: +25 on a success, -10 on a failure, never below 0", () => {
    assert.equal(nextDifficulty(50, true), 75);
    assert.equal(nextDifficulty(50, false), 40);
    assert.equal(nextDifficulty(5, false), 0);
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll training tests passed.");
