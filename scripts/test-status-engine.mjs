import assert from "node:assert/strict";
import { resolveTier, computeBonus, hpFragment } from "../src/module/statuses/roll.js";
import { STATUS_DEFINITIONS, TRAP_DEFINITIONS, COAT_DEFINITIONS, ALL_STATUS_DEFINITIONS } from "../src/module/statuses/definitions.js";
import { buildActorUpdate, buildConditionUpdate } from "../src/module/statuses/apply-effect.js";
import { resolveDuration } from "../src/module/statuses/duration.js";

function test(name, fn) {
    fn();
    console.log(`OK  ${name}`);
}

test("tier thresholds", () => {
    assert.equal(resolveTier(1).id, "aucune");
    assert.equal(resolveTier(50).id, "aucune");
    assert.equal(resolveTier(51).id, "faible");
    assert.equal(resolveTier(75).id, "faible");
    assert.equal(resolveTier(76).id, "moyenne");
    assert.equal(resolveTier(100).id, "moyenne");
    assert.equal(resolveTier(101).id, "forte");
    assert.equal(resolveTier(125).id, "forte");
    assert.equal(resolveTier(126).id, "tresForte");
    assert.equal(resolveTier(150).id, "tresForte");
    assert.equal(resolveTier(151).id, "complete");
    assert.equal(resolveTier(400).id, "complete");
});

test("speed bonus rounding", () => {
    assert.equal(computeBonus({ speedValue: 10 }), 3);
    assert.equal(computeBonus({ speedValue: 10, assistBonus: 25 }), 28);
    assert.equal(computeBonus({ speedValue: 10, intensityBonus: 30 }), 33);
});

test("HP fragment rounds up", () => {
    assert.equal(hpFragment(100), 5);
    assert.equal(hpFragment(101), 6);
    assert.equal(hpFragment(19), 1);
});

test("poisoned: damage and intensity rising then falling", () => {
    const def = STATUS_DEFINITIONS.poisoned;
    const faible = def.resolveTier("faible", { intensity: 2 });
    assert.equal(faible.hpDamageFraction, 2);
    assert.equal(faible.intensityDelta, 1);

    const forte = def.resolveTier("forte", { intensity: 3 });
    assert.equal(forte.hpDamageFraction, 3);
    assert.equal(forte.intensityDelta, undefined);

    const tresForteCure = def.resolveTier("tresForte", { intensity: 3 });
    assert.equal(tresForteCure.intensityDelta, -4);
    assert.equal(tresForteCure.cured, true);

    const tresForteNoCure = def.resolveTier("tresForte", { intensity: 10 });
    assert.equal(tresForteNoCure.cured, false);
});

test("fear: always cured, skips turn except at Complete", () => {
    const def = STATUS_DEFINITIONS.peur;
    assert.deepEqual(def.resolveTier("aucune"), { skipTurn: true, cured: true });
    assert.deepEqual(def.resolveTier("tresForte"), { skipTurn: true, cured: true });
    assert.deepEqual(def.resolveTier("complete"), { cured: true });
});

test("sleep: intensity adds a bonus to the next roll", () => {
    const def = STATUS_DEFINITIONS.sleep;
    assert.equal(computeBonus({ speedValue: 0, intensityBonus: 3 * def.bonusPerIntensity }), 30);
    assert.equal(def.resolveTier("forte", { intensity: 3 }).intensityDelta, 1);
    assert.equal(def.resolveTier("complete", { intensity: 5 }).cured, true);
});

test("apply-effect: HP damage and stage shift", () => {
    const update = buildActorUpdate({ hpDamageFraction: 2, stageDeltas: { def: -2 } }, {
        currentHp: 40,
        maxHp: 100,
        stageMods: { def: 0 }
    });
    assert.equal(update["system.health.value"], 30);
    assert.equal(update["system.stats.def.stage.mod"], -2);
});

test("apply-effect: intensity never drops below zero", () => {
    const update = buildConditionUpdate({ intensityDelta: -4 }, { intensity: 2 });
    assert.equal(update["system.value.value"], 0);
});

test("traps: normal tiers deal damage, VeryStrong lets the target move, Complete cuts duration", () => {
    const def = TRAP_DEFINITIONS["magma-vortex"];
    assert.equal(def.resolveTier("faible").hpDamageFraction, 2);
    assert.equal(def.resolveTier("tresForte").managesToMove, true);
    assert.equal(def.resolveTier("complete").durationDelta, -4);
});

test("duration: trap ticks down by 1 each turn from its starting value", () => {
    const def = TRAP_DEFINITIONS["sand-tomb"];
    const effect = def.resolveTier("faible");
    const first = resolveDuration({ currentDuration: -1, startDuration: def.startDuration, durationTicks: true, effect });
    assert.equal(first.value, 4);
    assert.equal(first.cured, false);

    const second = resolveDuration({ currentDuration: 1, startDuration: def.startDuration, durationTicks: true, effect });
    assert.equal(second.value, 0);
    assert.equal(second.cured, true);
});

test("duration: trap Complete tier removes 4 extra turns on top of the normal tick", () => {
    const def = TRAP_DEFINITIONS["flame-dance"];
    const effect = def.resolveTier("complete");
    const result = resolveDuration({ currentDuration: 5, startDuration: def.startDuration, durationTicks: true, effect });
    assert.equal(result.value, 0);
    assert.equal(result.cured, true);
});

test("coats: low rolls start a 2-turn decay, Strong+ renews indefinitely", () => {
    const def = COAT_DEFINITIONS.roots;
    const weak = def.resolveTier("faible");
    assert.equal(weak.decayIfNotRenewed, true);
    const decayed = resolveDuration({ currentDuration: -1, effect: weak });
    assert.equal(decayed.value, 2);
    assert.equal(decayed.cured, false);

    const decayedAgain = resolveDuration({ currentDuration: 1, effect: weak });
    assert.equal(decayedAgain.value, 0);
    assert.equal(decayedAgain.cured, true);

    const strong = def.resolveTier("forte");
    const renewed = resolveDuration({ currentDuration: 1, effect: strong });
    assert.equal(renewed.value, -1);
    assert.equal(renewed.cured, false);

    const veryStrong = def.resolveTier("tresForte");
    assert.equal(veryStrong.empowered, true);
});

test("powder cloud: intensity rises on weak rolls, falls on strong rolls", () => {
    const def = COAT_DEFINITIONS["powder-cloud"];
    assert.equal(def.resolveTier("moyenne", { intensity: 1 }).intensityDelta, 1);
    assert.deepEqual(def.resolveTier("forte", { intensity: 1 }), {});
    assert.equal(def.resolveTier("complete", { intensity: 1 }).intensityDelta, -1);
});

test("ALL_STATUS_DEFINITIONS merges all three categories without collisions", () => {
    const coreCount = Object.keys(STATUS_DEFINITIONS).length;
    const trapCount = Object.keys(TRAP_DEFINITIONS).length;
    const coatCount = Object.keys(COAT_DEFINITIONS).length;
    assert.equal(Object.keys(ALL_STATUS_DEFINITIONS).length, coreCount + trapCount + coatCount);
    assert.equal(trapCount, 14);
    assert.equal(coatCount, 9);
});

console.log("All status engine tests passed.");
