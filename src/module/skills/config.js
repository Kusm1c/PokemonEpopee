/**
 * Pokemon Epopee skill configuration.
 *
 * Source: Chronicler -> Regles -> Regles Generales, "Actions" section of both the
 * Pokemon and Trainer sheets. Both specify the same list and the same die.
 */

/**
 * Skills roll this die instead of PTR's d6. The pool size is unchanged: it is still
 * the skill's rank, clamped 1..6, so a Rank 4 skill rolls 4d20 rather than 4d6.
 */
const SKILL_DIE_SIZE = 20;

/**
 * Each skill die is worth `d20 + 10`, so the flat bonus scales with the pool: an Adept
 * (Rank 4) rolls 4d20+40, not 4d20+10.
 *
 * The bonus follows the *rank*, not the dice actually rolled. Edges that grant extra
 * dice (the `skill-check-dice` synthetics in system/check/skill.js) add a die without
 * adding its +10, so a bonus die is worth a die rather than a whole rank.
 */
const SKILL_RANK_BONUS = 10;

/** The legal rank range. A rank outside it is clamped before anything is derived. */
const MIN_SKILL_RANK = 1;
const MAX_SKILL_RANK = 6;

/**
 * The rank a skill actually rolls at.
 *
 * Shared by the roll engine and the sheet, which each used to clamp on their own. Both
 * the dice and the bonus must come from this one value: a bonus derived from an
 * unclamped rank would hand a Rank 8 skill 6d20+80 instead of 6d20+60.
 *
 * @param {object} skill an entry of `actor.system.skills`
 * @returns {number}
 */
function skillRank(skill) {
    const raw = Number(skill?.value?.total);
    return Math.clamp(Number.isFinite(raw) ? raw : MIN_SKILL_RANK, MIN_SKILL_RANK, MAX_SKILL_RANK);
}

/**
 * The flat bonus accompanying a skill's dice.
 *
 * @param {number} rank a rank already passed through `skillRank`
 * @returns {number}
 */
function skillRankBonus(rank) {
    return rank * SKILL_RANK_BONUS;
}

/**
 * The three groups, in display order, mapped onto PTR's existing `type` field.
 *
 * PTR already tags every skill body/mind/spirit and those buckets line up exactly with
 * the Epopee groups, so this is a relabel plus two moves (see MIGRATED_SKILLS below)
 * rather than a new taxonomy.
 */
const SKILL_GROUPS = [
    { id: "body", labelKey: "PTU.Epopee.SkillGroupBody", colour: "#c0392b" },
    { id: "mind", labelKey: "PTU.Epopee.SkillGroupMind", colour: "#27ae60" },
    { id: "spirit", labelKey: "PTU.Epopee.SkillGroupSpirit", colour: "#2980b9" }
];

/**
 * Where the Epopee list differs from stock PTR:
 *  - `dexterity` (Habileté) is new, and belongs to VOLONTÉ.
 *  - `guile` (Ruse) moves from SAVOIR to ÉMOTION.
 *
 * Kept here as documentation; the actual data lives in template.json.
 */
const MIGRATED_SKILLS = {
    dexterity: { group: "body", added: true },
    guile: { group: "spirit", movedFrom: "mind" }
};

export {
    SKILL_DIE_SIZE,
    SKILL_RANK_BONUS,
    MIN_SKILL_RANK,
    MAX_SKILL_RANK,
    skillRank,
    skillRankBonus,
    SKILL_GROUPS,
    MIGRATED_SKILLS
};
