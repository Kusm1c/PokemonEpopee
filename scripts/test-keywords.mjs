import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addAliases, hasKeyword, keywordKey, normalizeKeyword } from "../src/module/keywords/index.js";
import { isModerate } from "../src/module/combat-math/formula.js";

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

// What loadKeywordAliases() does in Foundry: every language file feeds the same table.
for (const lang of ["en", "fr"]) {
    const json = JSON.parse(readFileSync(new URL(`../static/lang/${lang}.json`, import.meta.url), "utf8"));
    addAliases(json.PTU.Epopee.Keywords);
}

test("matching ignores case, accents and spacing", () => {
    assert.equal(normalizeKeyword("  À  Distance "), "a-distance");
    assert.equal(normalizeKeyword("Modéré"), normalizeKeyword("modere"));
});

test("an English and a French spelling resolve to the same key", () => {
    assert.equal(keywordKey("Ranged"), "ranged-launching-distance");
    assert.equal(keywordKey("à distance"), "ranged-launching-distance");
    assert.equal(keywordKey("Classe"), "class");
    assert.equal(keywordKey("Cinq Coups"), "five-strike");
    assert.equal(keywordKey("Not a keyword"), null);
});

test("hasKeyword finds a keyword in any of its spellings", () => {
    assert.ok(hasKeyword(["Feature", "Classe"], "class"));
    assert.ok(hasKeyword(["Class"], "class"));
    assert.ok(!hasKeyword(["Feature"], "class"));
    assert.ok(!hasKeyword(undefined, "class"));
});

test("Puissant / Powerful switch a move off Moderate", () => {
    assert.equal(isModerate(["Puissant"]), false);
    assert.equal(isModerate(["POWERFUL"]), false);
    assert.equal(isModerate([]), true);
});

if (failures > 0) { console.error(`\n${failures} test(s) failed.`); process.exit(1); }
console.log("\nAll keyword tests passed.");
