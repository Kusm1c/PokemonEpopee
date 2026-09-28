import { sluggify } from "../../util/misc.js";
import { PTUDiceModifier, PTUModifier } from "../actor/modifiers.js";
import { extractDamageDice, extractModifiers, extractNotes } from "../rules/helpers.js";
import { Statistic } from "../system/statistic/index.js";

class PTUSkills {
    /**
     * @param {Number} skillRank
     * @returns {String} The skill rank's slug
     *
     * The stock table listed 1-6 and 8, so a rank of 7 - or 9 and up - fell through to
     * "invalid" and the sheet rendered "PTU.SkillInvalid". That is reachable in ordinary
     * play: Pokemon skills start at 2 and edges add to them, so a few increases put a
     * skill at 7 and the row broke. Ranks are now clamped into the table instead: above
     * Master is Virtuoso, and anything at or below zero reads as Pathetic rather than as
     * an error. A non-numeric value is still "invalid", since that is a real data fault
     * worth seeing.
     */
    static getRankSlug(skillRank) {
        // `Number(null)` is 0, which would read as a legitimate rank and hide a missing
        // value behind "Pathetic". Only an actual number, or a string holding one, counts.
        if (skillRank === null || skillRank === undefined || skillRank === "") return "invalid";

        const rank = Number(skillRank);
        if (!Number.isFinite(rank)) return "invalid";

        if (rank >= 8) return "virtuoso";
        if (rank >= 7) return "master";

        switch (Math.max(1, Math.round(rank))) {
            case 1: return "pathetic"//game.i18n.localize("PTU.SkillPathetic");
            case 2: return "untrained"//game.i18n.localize("PTU.SkillUntrained");
            case 3: return "novice"//game.i18n.localize("PTU.SkillNovice");
            case 4: return "adept"//game.i18n.localize("PTU.SkillAdept");
            case 5: return "expert"//game.i18n.localize("PTU.SkillExpert");
            case 6: return "master"//game.i18n.localize("PTU.SkillMaster");
            default: return "invalid"//game.i18n.localize("PTU.SkillInvalid");
        }
    }

    static calculate({
        item,
        actor,
        context,
    }) {
        const baseDomains = ['all', 'check'];
        const { options, skill } = context;

        const resolvables = { item, actor };
        const injectables = resolvables;

        if(skill) {
            options.push(`skill:${skill}`, `skill:${sluggify(actor.system.skills[skill].rank)}`)
        }

        const fromSelectors = extractModifiers(actor.synthetics, baseDomains, { injectables, resolvables });
        const modifiers = fromSelectors
            .flatMap(modifier => {
                return modifier.predicate.test(options) ? modifier : [];
            })

        const selectors = (() => {
            const selectors = [...baseDomains];
            if (skill) {
                selectors.push('skill-check');
                selectors.push(`skill-${skill}`);
            }
            return selectors;
        })();

        const diceModifiers = [];

        if (skill) {
            const skillDiceModifier = new PTUDiceModifier({
                diceNumber: actor.system.skills[skill]?.value?.total ?? 1,
                dieSize: 6,
                label: game.i18n.format("PTU.Check.SkillDice", { skill: Handlebars.helpers.capitalize(skill) })
            });
            diceModifiers.push(skillDiceModifier);
            const skillModifier = new PTUModifier({
                label: game.i18n.format("PTU.Check.SkillMod", { skill: Handlebars.helpers.capitalize(skill) }),
                modifier: actor.system.skills[skill]?.modifier?.total ?? 0
            })
            modifiers.push(skillModifier);
        }

        const notes = extractNotes(actor.synthetics.rollNotes, selectors).filter(n => n.predicate.test(options));
        const synthetics = extractModifiers(actor.synthetics, selectors, { injectables, resolvables });

        for (const modifier of synthetics) {
            if (modifier instanceof PTUModifier) modifiers.push(modifier);
            if (modifier instanceof PTUDiceModifier) diceModifiers.push(modifier);
        }

        const testedModifier = new Statistic(actor, {
            slug: skill ? `${skill}-check` : "check",
            label: game.i18n.format(skill ? "PTU.Check.SkillCheck" : "PTU.Check.Check", { skill: Handlebars.helpers.capitalize(skill) }),
            check: { type: "skill-check", domains: selectors, modifiers, diceModifiers },
            options: [...options],
            domains: [],
            notes
        }, {
            extraRollOptions: [...options]
        })

        return testedModifier
    }
}

export { PTUSkills }