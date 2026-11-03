import assert from "node:assert/strict";
import { natureData } from "../src/scripts/config/data/nature.js";

// calculateStatTotal reads a few Foundry globals; stand them in.
globalThis.foundry = { utils: { duplicate: (o) => structuredClone(o) } };
globalThis.CONFIG = { PTU: { data: { natureData } } };
globalThis.game = { settings: { get: () => false } };
globalThis.Math.clamp ??= (n, min, max) => Math.min(max, Math.max(n, min));
const { calculateStatTotal } = await import("../src/module/actor/helpers.js");

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

const stat = (value, levelUp = 0, mod = 0, stage = 0) => ({ value, levelUp, mod: { value: mod, mod: 0 }, stage: { value: stage, mod: 0 } });
const trainer = (overrides = {}) => ({
    hp: stat(10, 5), atk: stat(5), def: stat(5), spatk: stat(5), spdef: stat(5), spd: stat(5, 5), ...overrides
});
const totals = (r) => Object.fromEntries(Object.entries(r.stats).map(([k, v]) => [k, v.total]));

test("a stat is Base + Level-Up: no +1 from the old curve", () => {
    const r = calculateStatTotal({ level: 1, actorStats: trainer(), nature: null, isTrainer: true });
    assert.deepEqual(totals(r), { hp: 15, atk: 5, def: 5, spatk: 5, spdef: 5, spd: 10 });
    assert.equal(r.pointsSpend, 10);
});

test("the level does not change a total on its own", () => {
    const at1 = totals(calculateStatTotal({ level: 1, actorStats: trainer(), nature: null, isTrainer: true }));
    const at50 = totals(calculateStatTotal({ level: 50, actorStats: trainer(), nature: null, isTrainer: true }));
    assert.deepEqual(at1, at50);
});

test("Mod adds after the sum", () => {
    const r = calculateStatTotal({ level: 1, actorStats: trainer({ atk: stat(5, 2, 3) }), nature: null, isTrainer: true });
    assert.equal(r.stats.atk.total, 10);
    assert.equal(r.stats.atk.preStage, 10);
});

test("nature: +/- floor(Level / 20) on the raised / lowered stat", () => {
    // Adamant: +Attack / -Special Attack
    const nature = Object.keys(natureData).find((n) => natureData[n][0] === "Attack" && natureData[n][1] === "Special Attack");
    const base = () => ({ hp: stat(6), atk: stat(8), def: stat(6), spatk: stat(6), spdef: stat(6), spd: stat(6) });
    for (const [level, shift] of [[1, 0], [19, 0], [20, 1], [40, 2], [59, 2], [100, 5]]) {
        const r = calculateStatTotal({ level, actorStats: base(), nature, isTrainer: false });
        assert.equal(r.stats.atk.total, 8 + shift, `atk at level ${level}`);
        assert.equal(r.stats.spatk.total, 6 - shift, `spatk at level ${level}`);
        assert.equal(r.stats.def.total, 6, `def at level ${level}`);
    }
});

test("a lowered stat never drops below 1", () => {
    const nature = Object.keys(natureData).find((n) => natureData[n][1] === "Speed" && natureData[n][0] !== "Speed");
    const r = calculateStatTotal({ level: 100, actorStats: { hp: stat(1), atk: stat(1), def: stat(1), spatk: stat(1), spdef: stat(1), spd: stat(2) }, nature, isTrainer: false });
    assert.equal(r.stats.spd.total, 1);
});

test("a neutral nature changes nothing", () => {
    const nature = Object.keys(natureData).find((n) => natureData[n][0] === natureData[n][1]);
    const r = calculateStatTotal({ level: 100, actorStats: trainer(), nature, isTrainer: false });
    assert.deepEqual(totals(r), { hp: 15, atk: 5, def: 5, spatk: 5, spdef: 5, spd: 10 });
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll stat tests passed.");
