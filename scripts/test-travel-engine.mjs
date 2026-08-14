import assert from "node:assert/strict";
import { computeGroupSpeedKmH, isNavigationSuccess, advanceProgression } from "../src/module/travel/engine.js";
import { HEX_SIDE_KM, HEX_CENTER_TO_CENTER_KM, PROGRESSION_KM } from "../src/module/travel/definitions.js";

function test(name, fn) {
    fn();
    console.log(`OK  ${name}`);
}

test("group speed: 1km/h per 2m of Move", () => {
    assert.equal(computeGroupSpeedKmH(6), 3);
    assert.equal(computeGroupSpeedKmH(10), 5);
});

test("navigation success threshold", () => {
    assert.equal(isNavigationSuccess(50, 50), true);
    assert.equal(isNavigationSuccess(49, 50), false);
});

test("hex reference constants match the doc", () => {
    assert.equal(HEX_SIDE_KM, 7);
    assert.equal(HEX_CENTER_TO_CENTER_KM, 12);
    assert.equal(PROGRESSION_KM.startHex, 6);
    assert.equal(PROGRESSION_KM.farSide, 12);
    assert.equal(PROGRESSION_KM.nearSide, 6);
});

test("progression accumulates until it reaches the threshold, then resets and reports overflow", () => {
    const step1 = advanceProgression({ current: 0, thresholdKm: 6, kmThisQuarter: 4 });
    assert.equal(step1.newProgression, 4);
    assert.equal(step1.exited, false);

    const step2 = advanceProgression({ current: 4, thresholdKm: 6, kmThisQuarter: 5 });
    assert.equal(step2.newProgression, 0);
    assert.equal(step2.exited, true);
    assert.equal(step2.overflowKm, 3);
});

console.log("All travel engine tests passed.");
