import assert from "node:assert/strict";
import { planJourney, journeyProgress } from "../src/module/travel/journey-math.js";
import { TERRAINS, CONDITIONS, TRAVEL_PACES, DEFAULT_PACE, fraction, paceById } from "../src/module/travel/tables.js";

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

const plains = { terrainId: "plains", pathId: "road", conditionId: "none" };

test("fractions read as the tables print them", () => {
    assert.equal(fraction("3/4"), 0.75);
    assert.equal(fraction("1/10"), 0.1);
    assert.equal(fraction("1"), 1);
    assert.equal(fraction("garbage"), 1);
});

test("the movement mode sets the speed: Exploration 1, Slow 2, Normal 3, Fast 4 km/h", () => {
    for (const [paceId, kmh] of [["exploration", 1], ["slow", 2], ["normal", 3], ["fast", 4]]) {
        const p = planJourney({ ...plains, paceId, hours: 1 });
        assert.equal(p.kmPerHour, kmh, paceId);
    }
});

test("an unknown or missing mode falls back to Normal", () => {
    assert.equal(DEFAULT_PACE, "normal");
    assert.equal(planJourney({ ...plains, hours: 1 }).kmPerHour, 3);
    assert.equal(paceById("nope").id, "normal");
});

test("duration multiplies, clamped to 1..30 hours", () => {
    assert.equal(planJourney({ ...plains, paceId: "normal", hours: 4 }).km, 12);
    assert.equal(planJourney({ ...plains, paceId: "normal", hours: 99 }).hours, 30);
    assert.equal(planJourney({ ...plains, paceId: "normal", hours: 0 }).hours, 1);
});

test("terrain, path and condition multiply the mode's speed", () => {
    // Fast 4 km/h, jungle trackless x1/4, storm x3/4: 0.75 km/h, 3 km in 4 h.
    const p = planJourney({ paceId: "fast", terrainId: "jungle", pathId: "trackless", conditionId: "storm", hours: 4 });
    assert.equal(p.terrainMultiplier, 0.25);
    assert.equal(p.conditionMultiplier, 0.75);
    assert.equal(p.kmPerHour, 0.8); // 0.75 shown to one decimal
    assert.equal(p.km, 3);
    assert.equal(p.squares, 3);
});

test("Navigation effects: Fast -20, Slow and Exploration roll twice", () => {
    const nav = Object.fromEntries(TRAVEL_PACES.map((p) => [p.id, p.navigation]));
    assert.deepEqual(nav, {
        exploration: { modifier: 0, rollTwice: true },
        slow: { modifier: 0, rollTwice: true },
        normal: { modifier: 0, rollTwice: false },
        fast: { modifier: -20, rollTwice: false }
    });
});

test("progress: squares are km, hours follow the ground covered", () => {
    const plan = { km: 10, hours: 4, squares: 10 };
    assert.deepEqual(journeyProgress(plan, 5), { checked: 5, kmDone: 5, hoursUsed: 2 });
    assert.deepEqual(journeyProgress(plan, 99), { checked: 10, kmDone: 10, hoursUsed: 4 });
    assert.deepEqual(journeyProgress(plan, -3), { checked: 0, kmDone: 0, hoursUsed: 0 });
});

test("progress: the last square closes a fractional distance exactly", () => {
    const plan = { km: 7.5, hours: 3, squares: 8 };
    assert.equal(journeyProgress(plan, 8).kmDone, 7.5);
    assert.equal(journeyProgress(plan, 8).hoursUsed, 3);
    assert.equal(journeyProgress(plan, 7).kmDone, 7);
});

// The rule tables, cell for cell as printed. A typo in tables.js breaks this.
test("terrain table matches the rules", () => {
    const printed = {
        desert: ["1", "1/2", "1/2", 60, 100], forestSparse: ["1", "1", "1/2", 70, 70],
        forestMedium: ["1", "1", "1/2", 80, 70], forestDense: ["1", "1", "1/2", 90, 70],
        hills: ["1", "3/4", "1/2", 70, 60], jungle: ["1", "3/4", "1/4", 80, 70],
        peatBog: ["1", "1", "3/4", 70, 80], mountain: ["3/4", "3/4", "1/2", 80, 90],
        plains: ["1", "1", "3/4", 60, 60], marsh: ["1", "3/4", "1/2", 75, 80],
        tundraIce: ["1", "3/4", "3/4", 60, 90]
    };
    assert.deepEqual(TERRAINS.map((t) => t.id), Object.keys(printed));
    for (const t of TERRAINS) {
        assert.deepEqual([t.speed.road, t.speed.trail, t.speed.trackless, t.navigationDC, t.forageDC], printed[t.id], t.id);
    }
});

test("condition table matches the rules", () => {
    assert.deepEqual(CONDITIONS.filter((c) => c.id !== "none").map((c) => [c.id, c.speed]), [
        ["hotCold", "3/4"], ["giantTerrain", "3/4"], ["hurricane", "1/10"], ["ledMount", "3/4"],
        ["lowVisibility", "1/2"], ["riverCrossing", "3/4"], ["snow", "1/2"], ["deepSnow", "1/4"],
        ["storm", "3/4"], ["strongStorm", "1/2"]
    ]);
});

test("movement mode speeds match the rules", () => {
    assert.deepEqual(TRAVEL_PACES.map((p) => [p.id, p.kmPerHour]), [
        ["exploration", 1], ["slow", 2], ["normal", 3], ["fast", 4]
    ]);
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll travel journey tests passed.");
