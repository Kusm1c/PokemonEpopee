import assert from "node:assert/strict";
import { parseFrequency, usageState, resetsOn } from "../src/module/usage/frequency.js";

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

test("unlimited frequencies need no counter", () => {
    for (const f of ["At-Will", "At Will", "At Will - Standard Action", "Static", "", undefined]) {
        assert.equal(parseFrequency(f).unlimited, true, `${f} should be unlimited`);
    }
});

test("Scene and Daily parse their count", () => {
    assert.deepEqual(
        { p: parseFrequency("Scene").period, m: parseFrequency("Scene").max },
        { p: "scene", m: 1 }
    );
    assert.equal(parseFrequency("Scene x2").max, 2);
    assert.equal(parseFrequency("Scene x3").max, 3);
    assert.equal(parseFrequency("Daily").max, 1);
    assert.equal(parseFrequency("Daily x3").max, 3);
    assert.equal(parseFrequency("Daily x2").period, "daily");
});

test("EOT is its own period", () => {
    assert.equal(parseFrequency("EOT").period, "eot");
    assert.equal(parseFrequency("EOT").max, 1);
});

test("the action suffix is ignored", () => {
    assert.equal(parseFrequency("Scene x2 - Standard Action").max, 2);
    assert.equal(parseFrequency("Daily - Swift Action").period, "daily");
});

test("casing and spacing don't matter", () => {
    assert.equal(parseFrequency("SCENE X2").max, 2);
    assert.equal(parseFrequency("  daily x 3  ").max, 3);
});

test("usage state counts down and clamps", () => {
    assert.deepEqual(usageState("Scene x3", 0).remaining, 3);
    assert.deepEqual(usageState("Scene x3", 1).remaining, 2);
    assert.deepEqual(usageState("Scene x3", 3).remaining, 0);
    assert.equal(usageState("Scene x3", 3).exhausted, true);
    assert.equal(usageState("Scene x3", 99).remaining, 0, "overspend clamps to 0");
    assert.equal(usageState("Scene x3", -5).remaining, 3, "negative spend is ignored");
});

test("unlimited items report no remaining count", () => {
    const s = usageState("At-Will", 7);
    assert.equal(s.unlimited, true);
    assert.equal(s.remaining, null);
    assert.equal(s.exhausted, false);
});

test("resetsOn matches only its own period", () => {
    assert.equal(resetsOn("Scene x2", "scene"), true);
    assert.equal(resetsOn("Scene x2", "daily"), false);
    assert.equal(resetsOn("Daily", "daily"), true);
    assert.equal(resetsOn("Daily", "scene"), false);
    assert.equal(resetsOn("At-Will", "scene"), false);
    assert.equal(resetsOn("Static", "daily"), false);
});

test("junk frequencies degrade to unlimited rather than throwing", () => {
    assert.equal(parseFrequency("Whenever the GM feels like it").unlimited, true);
    assert.equal(parseFrequency(null).unlimited, true);
    assert.equal(parseFrequency(42).unlimited, true);
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll usage tests passed.");
