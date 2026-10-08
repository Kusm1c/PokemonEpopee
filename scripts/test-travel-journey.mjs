import assert from "node:assert/strict";
import { planJourney, journeyProgress, slowestOf, activeMembers, effectiveModes } from "../src/module/travel/journey-math.js";
import { TERRAINS, CONDITIONS, BASE_SPEED_METRES, BASE_SPEED_ROWS, fraction } from "../src/module/travel/tables.js";

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

test("blank or 0 slots are ignored", () => {
    const members = activeMembers([{ speed: 6 }, { speed: "" }, { speed: 0 }, {}, { speed: "4" }]);
    assert.deepEqual(members.map((m) => m.index), [0, 4]);
});

test("the slowest member sets the pace, ties all highlighted", () => {
    const slowest = slowestOf(activeMembers([{ speed: 6 }, { speed: 4 }, { speed: 4 }, { speed: 8 }]));
    assert.deepEqual(slowest, { speed: 4, indices: [1, 2] });
    assert.equal(slowestOf([]), null);
});

test("base speed table: N metres is N/2 km per hour of march", () => {
    for (const metres of BASE_SPEED_METRES) {
        const p = planJourney({ ...plains, slots: [{ speed: metres }], hours: 1 });
        assert.equal(p.kmPerHour, metres / 2, `${metres} m`);
    }
});

test("an hour in haste covers twice an hour's march", () => {
    const march = planJourney({ ...plains, slots: [{ speed: 4 }], hours: 1, hasteHours: 0 });
    const haste = planJourney({ ...plains, slots: [{ speed: 4 }], hours: 1, hasteHours: 1 });
    assert.equal(march.km, 2);
    assert.equal(haste.km, 4);
});

test("haste hours cannot exceed the duration", () => {
    const p = planJourney({ ...plains, slots: [{ speed: 4 }], hours: 2, hasteHours: 9 });
    assert.equal(p.hasteHours, 2);
    assert.equal(p.km, 8);
});

test("terrain, path and condition multiply", () => {
    // Jungle trackless x1/4, storm x3/4: 8 m -> 4 km/h -> 0.75 km/h.
    const p = planJourney({ slots: [{ speed: 8 }], terrainId: "jungle", pathId: "trackless", conditionId: "storm", hours: 4 });
    assert.equal(p.terrainMultiplier, 0.25);
    assert.equal(p.conditionMultiplier, 0.75);
    assert.equal(p.kmPerHour, 0.8); // 0.75 shown to one decimal
    assert.equal(p.km, 3);
});

test("every terrain and condition resolves to a positive multiplier", () => {
    for (const t of TERRAINS) for (const path of ["road", "trail", "trackless"]) assert.ok(fraction(t.speed[path]) > 0, t.id);
    for (const c of CONDITIONS) assert.ok(fraction(c.speed) > 0, c.id);
});

test("modes: exclusive within a group, stacking across groups, forbidden ones dropped", () => {
    const modes = [
        { id: "a", speed: "2", group: "mount" },
        { id: "b", speed: "3", group: "mount" },
        { id: "c", speed: "1/2" },
        { id: "d", speed: "2", forbiddenTerrains: ["jungle"] }
    ];
    const picked = effectiveModes(["a", "b", "c", "d"], "jungle", "road", modes).map((m) => m.id);
    assert.deepEqual(picked, ["a", "c"]);
    const p = planJourney({ ...plains, slots: [{ speed: 4 }], hours: 1, modes: ["a", "c", "d"] }, modes);
    assert.equal(p.modesMultiplier, 2);
});

test("no speed, no distance", () => {
    const p = planJourney({ ...plains, slots: [], hours: 8 });
    assert.equal(p.km, 0);
    assert.equal(p.squares, 0);
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

// The three rule tables, cell for cell as printed. A typo in tables.js breaks this.
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

test("base speed table matches the rules", () => {
    assert.deepEqual(BASE_SPEED_METRES, [2, 4, 5, 6, 8]);
    assert.deepEqual(BASE_SPEED_ROWS.map((r) => [r.id, r.km]), [
        ["hourMarch", [1, 2, 2.5, 3, 4]],
        ["hourHaste", [2, 4, 5, 6, 8]],
        ["quarter", [4, 8, 10, 12, 16]],
        ["day", [8, 16, 20, 24, 32]]
    ]);
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll travel journey tests passed.");
