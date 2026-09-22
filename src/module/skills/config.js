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
 * The three groups, in display order, mapped onto PTR's existing `type` field.
 *
 * PTR already tags every skill body/mind/spirit and those buckets line up exactly with
 * the Epopee groups, so this is a relabel plus two moves (see MIGRATED_SKILLS below)
 * rather than a new taxonomy.
 */
const SKILL_GROUPS = [
    { id: "body", label: "VOLONTÉ", colour: "#c0392b" },
    { id: "mind", label: "SAVOIR", colour: "#27ae60" },
    { id: "spirit", label: "ÉMOTION", colour: "#2980b9" }
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

export { SKILL_DIE_SIZE, SKILL_GROUPS, MIGRATED_SKILLS };
