import assert from "node:assert/strict";
import { resolveTier, computeBonus, hpFragment } from "../src/module/statuses/roll.js";
import { STATUS_DEFINITIONS } from "../src/module/statuses/definitions.js";
import { buildActorUpdate, buildConditionUpdate } from "../src/module/statuses/apply-effect.js";

function test(name, fn) {
    fn();
    console.log(`OK  ${name}`);
}

test("seuils de palier", () => {
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

test("bonus de vitesse arrondi", () => {
    assert.equal(computeBonus({ speedValue: 10 }), 3);
    assert.equal(computeBonus({ speedValue: 10, assistBonus: 25 }), 28);
    assert.equal(computeBonus({ speedValue: 10, intensityBonus: 30 }), 33);
});

test("fragment de PV arrondi au superieur", () => {
    assert.equal(hpFragment(100), 5);
    assert.equal(hpFragment(101), 6);
    assert.equal(hpFragment(19), 1);
});

test("empoisonnement : degats et intensite montante puis descendante", () => {
    const def = STATUS_DEFINITIONS.empoisonnement;
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

test("peur : toujours gueri, saute le tour sauf en Complete", () => {
    const def = STATUS_DEFINITIONS.peur;
    assert.deepEqual(def.resolveTier("aucune"), { skipTurn: true, cured: true });
    assert.deepEqual(def.resolveTier("tresForte"), { skipTurn: true, cured: true });
    assert.deepEqual(def.resolveTier("complete"), { cured: true });
});

test("sommeil : intensite ajoute un bonus au jet suivant", () => {
    const def = STATUS_DEFINITIONS.sommeil;
    assert.equal(computeBonus({ speedValue: 0, intensityBonus: 3 * def.bonusPerIntensity }), 30);
    assert.equal(def.resolveTier("forte", { intensity: 3 }).intensityDelta, 1);
    assert.equal(def.resolveTier("complete", { intensity: 5 }).cured, true);
});

test("apply-effect : degats HP et decalage de stage", () => {
    const update = buildActorUpdate({ hpDamageFraction: 2, stageDeltas: { def: -2 } }, {
        currentHp: 40,
        maxHp: 100,
        stageMods: { def: 0 }
    });
    assert.equal(update["system.health.value"], 30);
    assert.equal(update["system.stats.def.stage.mod"], -2);
});

test("apply-effect : intensite ne descend jamais sous zero", () => {
    const update = buildConditionUpdate({ intensityDelta: -4 }, { intensity: 2 });
    assert.equal(update["system.value.value"], 0);
});

console.log("Tous les tests du moteur de statuts sont passes.");
