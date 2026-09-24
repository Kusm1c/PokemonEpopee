/**
 * Injects Epopee's new `dexterity` skill into the hardcoded ChoiceSet lists.
 *
 * Adding a skill to `template.json` and to `CONFIG.PTU.data.skills.keys` is not enough:
 * the skill-picking edges (Basic/Adept/Expert/Master Skills, Skill Enhancement, Skill
 * Improvement) each carry their **own** 17-entry list baked into the item's rule data.
 * A skill missing from those lists exists on the sheet, rolls, and is still unpickable.
 *
 * Rather than hand-write an entry per shape, this clones an existing sibling entry and
 * substitutes the skill key throughout. The lists use at least two different value
 * shapes - a bare key (`"acrobatics"`) and a data path
 * (`"system.skills.acrobatics.value.mod"`) - and their predicates vary too, so cloning
 * is what keeps this correct without enumerating every variant.
 */

/** The skill to inject, and the label shown in the dropdown. */
const NEW_SKILL = "dexterity";
const NEW_LABEL = "Dexterity";

/** Skill keys as they appear in stock lists, used to recognise one. */
const KNOWN_SKILLS = [
    "acrobatics", "athletics", "charm", "combat", "command", "generalEd", "medicineEd",
    "occultEd", "pokemonEd", "techEd", "focus", "guile", "intimidate", "intuition",
    "perception", "stealth", "survival"
];

/**
 * Which skill key does this choice entry refer to, if any?
 *
 * @param {object} choice
 * @returns {string|null}
 */
function skillOf(choice) {
    // Recognises the injected skill as well, so a second run sees it is already there.
    // Without this the idempotence check below never matches and every run appends
    // another copy.
    const recognised = [...KNOWN_SKILLS, NEW_SKILL];
    const value = typeof choice?.value === "string" ? choice.value : "";
    if (recognised.includes(value)) return value;

    const path = value.match(/^system\.skills\.(\w+)\./);
    if (path && recognised.includes(path[1])) return path[1];

    return null;
}

/**
 * Does this look like a list of skills?
 *
 * Requires most entries to resolve to a known skill, so an unrelated ChoiceSet that
 * happens to mention one is left alone. Stock lists carry the odd non-skill entry -
 * "Fossils" appears in Skill Enhancement - hence "most" rather than "all".
 */
function isSkillChoiceList(choices) {
    if (!Array.isArray(choices) || choices.length < 10) return false;
    const recognised = choices.filter(c => skillOf(c) !== null).length;
    return recognised >= choices.length - 2;
}

/**
 * Build the new entry by cloning a sibling and swapping the skill key everywhere it
 * appears - in the value, the label, and anywhere inside the predicate.
 *
 * @param {object} template a sibling choice entry
 * @param {string} templateSkill the skill key that entry refers to
 * @returns {object}
 */
function buildEntry(template, templateSkill) {
    const clone = JSON.parse(JSON.stringify(template));
    const json = JSON.stringify(clone).split(templateSkill).join(NEW_SKILL);
    const entry = JSON.parse(json);

    // The label is the one field that isn't a key substitution: stock lists use either
    // a capitalised display name or the raw key, so follow whichever the list uses.
    const templateLabel = String(template.label ?? "");
    entry.label = templateLabel === templateSkill ? NEW_SKILL : NEW_LABEL;

    return entry;
}

/**
 * @param {object} doc
 * @returns {object|null} rewritten source, or null when nothing needed changing
 */
function rewriteDocument(doc) {
    const source = doc.toObject();
    const rules = source.system?.rules;
    if (!Array.isArray(rules)) return null;

    let changed = false;

    for (const rule of rules) {
        if (rule.key !== "ChoiceSet" || !isSkillChoiceList(rule.choices)) continue;
        if (rule.choices.some(c => skillOf(c) === NEW_SKILL)) continue;

        const template = rule.choices.find(c => skillOf(c) !== null);
        if (!template) continue;

        rule.choices.push(buildEntry(template, skillOf(template)));
        changed = true;
    }

    return changed ? source : null;
}

/**
 * @param {string[]} log
 */
async function injectSkillChoices(log) {
    let docsTouched = 0;
    const names = [];

    for (const pack of game.packs) {
        if (pack.metadata.packageType !== "system") continue;

        const wasLocked = pack.locked;
        if (wasLocked) await pack.configure({ locked: false });

        try {
            const updates = [];
            for (const doc of await pack.getDocuments()) {
                const rewritten = rewriteDocument(doc);
                if (rewritten) {
                    updates.push(rewritten);
                    names.push(doc.name);
                }
            }
            if (updates.length) {
                await pack.documentClass.updateDocuments(updates, { pack: pack.collection });
                docsTouched += updates.length;
            }
        } catch (error) {
            log.push(`⚠ ${pack.collection} : ${error.message}`);
        } finally {
            if (wasLocked) await pack.configure({ locked: true });
        }
    }

    if (docsTouched) log.push(`${NEW_SKILL} ajouté aux choix de ${docsTouched} item(s) : ${names.join(", ")}.`);
    else log.push(`Choix de compétences : ${NEW_SKILL} déjà présent partout.`);
}

export { injectSkillChoices, NEW_SKILL, KNOWN_SKILLS };
