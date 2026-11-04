import assert from "node:assert/strict";
import { PTUPredicate } from "../src/module/system/predication.js";

let failures = 0;
function test(name, fn) {
    try { fn(); console.log(`OK  ${name}`); }
    catch (e) { failures++; console.error(`FAIL ${name}\n     ${e.message}`); }
}

const check = (statement, options) => new PTUPredicate([statement]).test(options);

test("a comparison reads the number at the end of a named option", () => {
    assert.equal(check({ gte: ["move:damage-base", 6] }, ["move:damage-base:8"]), true);
    assert.equal(check({ gte: ["move:damage-base", 10] }, ["move:damage-base:8"]), false);
    assert.equal(check({ lt: ["target:distance", 3] }, ["target:distance:2"]), true);
});

test("a named comparison needs the option to be there", () => {
    assert.equal(check({ gte: ["move:damage-base", 6] }, ["move:ac:4"]), false);
});

test("a longer option is not read as the shorter one", () => {
    assert.equal(check({ gte: ["move:damage-base", 6] }, ["move:damage-base:pre-stab:8"]), false);
});

test("two plain numbers still compare, as injected values do", () => {
    assert.equal(check({ gte: ["5", 3] }, []), true);
    assert.equal(check({ gte: ["2", 3] }, []), false);
});

test("compound statements wrap comparisons", () => {
    assert.equal(check({ not: { gte: ["move:damage-base", 6] } }, ["move:damage-base:4"]), true);
    assert.equal(check({ or: [{ gte: ["move:damage-base", 10] }, "target:flanked"] }, ["move:damage-base:4", "target:flanked"]), true);
});

if (failures) { console.error(`\n${failures} test(s) failed`); process.exit(1); }
console.log("\nAll predication tests passed.");
