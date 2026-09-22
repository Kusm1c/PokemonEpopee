import assert from "node:assert/strict";
import { flavourForStat, flavoursForNature } from "../src/module/natures/flavors.js";
import { natureData } from "../src/scripts/config/data/nature.js";

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

test("one flavour per stat, none for HP", () => {
    assert.equal(flavourForStat("Attack"), "Spicy");
    assert.equal(flavourForStat("Defense"), "Sour");
    assert.equal(flavourForStat("Speed"), "Sweet");
    assert.equal(flavourForStat("Special Attack"), "Dry");
    assert.equal(flavourForStat("Special Defense"), "Bitter");
    assert.equal(flavourForStat("HP"), null);
    assert.equal(flavourForStat("nonsense"), null);
});

test("Adamant: +Attack / -Special Attack", () => {
    const f = flavoursForNature("Adamant", natureData);
    assert.equal(f.liked, "Spicy");
    assert.equal(f.disliked, "Dry");
    assert.equal(f.likedLabel, "Épicé");
    assert.equal(f.neutral, false);
});

test("Brave: +Attack / -Speed", () => {
    const f = flavoursForNature("Brave", natureData);
    assert.equal(f.liked, "Spicy");
    assert.equal(f.disliked, "Sweet");
});

test("a Nature touching HP has no preference on that side", () => {
    const f = flavoursForNature("Cuddly", natureData);   // ["HP", "Attack"]
    assert.equal(f.liked, null, "HP has no flavour");
    assert.equal(f.disliked, "Spicy");
});

test("unknown or malformed natures degrade quietly", () => {
    assert.equal(flavoursForNature("NotANature", natureData).neutral, true);
    assert.equal(flavoursForNature(undefined, natureData).neutral, true);
    assert.equal(flavoursForNature("Adamant", undefined).neutral, true);
});

test("every Nature in the data resolves without throwing", () => {
    for (const name of Object.keys(natureData)) {
        const f = flavoursForNature(name, natureData);
        assert.ok(typeof f.neutral === "boolean", `${name} returned a malformed result`);
    }
    assert.ok(Object.keys(natureData).length > 20, "sanity: the nature table is populated");
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll nature tests passed.");
