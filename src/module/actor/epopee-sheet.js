/**
 * Epopee sheet data shared by the Pokemon and Trainer sheets.
 *
 * Both sheets show the same derived values - Fragments, STAB, the MdS gauges, the
 * three skill groups - so the maths lives here once. Sheet-specific pieces (Loyalty
 * gates on the Pokemon, item slots on the Trainer) stay in their own sheet class.
 */

import { MAX_COMBAT_STAGES } from "../combat-math/config.js";
import { clampStages, fragment, mdsTerm, stabValue } from "../combat-math/formula.js";
import { flavoursForNature } from "../natures/flavors.js";
import { SKILL_DIE_SIZE, SKILL_GROUPS } from "../skills/config.js";
import { hpFragment } from "../statuses/roll.js";

/**
 * Per-stat Fragments and MdS gauge state.
 *
 * Fragments read `preStage` - the figure before PTR's +-10%-per-stage multiplier -
 * which is the same value the damage formula uses, so the sheet can never disagree
 * with the dice. See combat-math/actor.js `statForFormula`.
 */
function prepareStatDisplay(actor) {
    const stats = actor.system.stats ?? {};
    const level = actor.system.level?.current ?? 1;

    const fragments = {};
    const gauges = {};

    for (const [key, stat] of Object.entries(stats)) {
        if (key !== "hp") fragments[key] = fragment(stat.preStage ?? stat.total ?? stat.value ?? 0);
        if (!stat.stage) continue;

        const current = clampStages((stat.stage.value ?? 0) + (stat.stage.mod ?? 0));
        const term = mdsTerm(level, current);
        gauges[key] = {
            current,
            positive: Array.from({ length: MAX_COMBAT_STAGES }, (_, i) => ({ index: i + 1, filled: current > i })),
            negative: Array.from({ length: MAX_COMBAT_STAGES }, (_, i) => ({ index: -(i + 1), filled: current < -i })),
            dice: term.dice || "-",
            formula: term.formula || ""
        };
    }

    return { fragments, gauges };
}

/**
 * Bucket skills into VOLONTÉ / SAVOIR / ÉMOTION and flatten every value the row needs.
 *
 * Flattened deliberately: grouping adds nesting, and `../` paths in Handlebars resolve
 * against context depth, so they break silently when the depth changes.
 */
function prepareSkillGroups(actor) {
    const skills = Object.entries(actor.system.skills ?? {});
    const groups = SKILL_GROUPS.map(g => ({ ...g, skills: [] }));
    const other = { id: "other", label: "AUTRE", colour: "#777777", skills: [] };
    const origins = actor.origins ?? {};

    for (const [key, skill] of skills) {
        const diceCount = Math.min(6, Math.max(1, skill.value?.total ?? 1));
        const modifier = skill.modifier?.total ?? 0;

        const entry = {
            key,
            type: skill.type,
            rank: skill.rank,
            labelKey: `PTU.Skills.${skill.slug}`,
            rankLabelKey: `PTU.Skill${(skill.rank ?? "").toString().capitalize()}`,
            rollFormula: `${diceCount}d${SKILL_DIE_SIZE}${modifier ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ""}`,
            valuePath: `system.skills.${key}.value.value`,
            value: skill.value?.value,
            valueMod: skill.value?.mod,
            valueTotal: skill.value?.total,
            valueOrigins: foundry.utils.getProperty(origins, `system.skills.${key}.value.mod`),
            modifierPath: `system.skills.${key}.modifier.value`,
            modifierValue: skill.modifier?.value,
            modifierMod: skill.modifier?.mod,
            modifierTotal: skill.modifier?.total,
            modifierOrigins: foundry.utils.getProperty(origins, `system.skills.${key}.modifier.mod`)
        };

        (groups.find(g => g.id === skill.type) ?? other).skills.push(entry);
    }

    return other.skills.length ? [...groups, other] : groups;
}

/**
 * The block both sheets put on `data.epopee`.
 *
 * @param {object} actor
 * @param {{includeFlavours?: boolean}} [options] Flavours are Nature-driven, so only
 *        meaningful for Pokemon - a Trainer has no Nature.
 */
function prepareEpopeeSheetData(actor, { includeFlavours = false } = {}) {
    const level = actor.system.level?.current ?? 1;
    const { fragments, gauges } = prepareStatDisplay(actor);

    const data = {
        fragments,
        gauges,
        hpFragment: hpFragment(actor.system.health?.max ?? 0),
        stab: stabValue(level),
        skillDieSize: SKILL_DIE_SIZE,
        skillGroups: prepareSkillGroups(actor),
        contestMode: actor.getFlag("pe", "contestMode") === true
    };

    if (includeFlavours) {
        data.flavours = flavoursForNature(actor.system.nature?.value, CONFIG.PTU.data.natureData);
    }

    return data;
}

export { prepareEpopeeSheetData, prepareStatDisplay, prepareSkillGroups };
