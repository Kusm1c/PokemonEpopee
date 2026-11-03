/**
 * Entraînement v2.
 *
 * "Lors d'un Entraînement, faut sélectionner 1 type parmi quatre : Level-Up, Loyauté,
 *  Apprendre une CT/DT, Autre. Au moment de lancer, on peut améliorer son jet : baie au
 *  goût apprécié et pas détesté +5 ; chaque heure d'affilée +1, augmenté de +1 par heure
 *  supplémentaire (3 heures = 1+2+3). Sur un échec, réduit la valeur de -10 ; sur une
 *  réussite, augmente la valeur de +25." - the value being the Training Difficulty.
 *
 * One real roll, by whoever clicks, posted as the Pokemon: the old version rolled once per
 * connected player on the clicker's client and printed their names, which read as random.
 */

import { localize } from "../../i18n.js";
import { calculateLevel } from "./level.js";

const K = "PTU.Epopee.Sheet.Training";

const TRAINING_TYPES = ["levelUp", "loyalty", "tm", "other"];
const DEFAULT_DIFFICULTY = 50;
const BERRY_BONUS = 5;
const SUCCESS_DIFFICULTY_CHANGE = 25;
const FAILURE_DIFFICULTY_CHANGE = -10;

/** 1 + 2 + ... + hours: each hour in a row is worth one more than the last. */
function hoursBonus(hours) {
    const h = Math.max(0, Math.floor(Number(hours) || 0));
    return (h * (h + 1)) / 2;
}

/** The Training Difficulty after a roll, never below 0. */
function nextDifficulty(difficulty, success) {
    return Math.max(0, difficulty + (success ? SUCCESS_DIFFICULTY_CHANGE : FAILURE_DIFFICULTY_CHANGE));
}

/** The smallest experience total that reaches the next level. */
function nextLevelExp(level) {
    const table = CONFIG.PTU.data.levelProgression;
    if (level >= 100) return null;
    let exp = (Number(table[level]) || 0) + 1;
    while (calculateLevel(exp, level) <= level && exp < table[100]) exp++;
    return exp;
}

async function askOptions(actor) {
    const typeOptions = TRAINING_TYPES
        .map((t) => `<option value="${t}">${localize(`${K}.Types.${t}`)}</option>`).join("");
    return Dialog.prompt({
        title: localize(`${K}.Title`, { name: actor.name }),
        content: `
            <div class="form-group"><label>${localize(`${K}.Type`)}</label><select name="type">${typeOptions}</select></div>
            <div class="form-group"><label>${localize(`${K}.Berry`, { bonus: BERRY_BONUS })}</label><input type="checkbox" name="berry"/></div>
            <div class="form-group"><label>${localize(`${K}.Hours`)}</label><input type="number" name="hours" value="0" min="0" step="1"/></div>
            <p style="font-size:11px;opacity:.7;">${localize(`${K}.HoursHint`)}</p>`,
        label: localize(`${K}.RollButton`),
        callback: (html) => ({
            type: html.find("[name=type]").val(),
            berry: html.find("[name=berry]").is(":checked"),
            hours: Number(html.find("[name=hours]").val()) || 0
        }),
        options: { width: 380 }
    }).catch(() => null);
}

/** Apply a successful training's gain. Returns the line describing it. */
async function applyGain(actor, type) {
    if (type === "levelUp") {
        const level = actor.system.level.current;
        const exp = nextLevelExp(level);
        if (exp === null) return localize(`${K}.Gain.MaxLevel`);
        const gained = Math.max(0, exp - (Number(actor.system.level.exp) || 0));
        // Opens the level-up window on this client, as any experience gain does.
        await actor.update({ "system.level.exp": exp });
        return localize(`${K}.Gain.LevelUp`, { exp: gained, level: level + 1 });
    }
    if (type === "loyalty") {
        const { checked, unlocked } = actor.system.loyalty;
        if (checked >= unlocked) return localize(`${K}.Gain.LoyaltyFull`, { max: unlocked });
        await actor.update({ "system.loyalty.checked": checked + 1 });
        return localize(`${K}.Gain.Loyalty`, { n: checked + 1, max: unlocked });
    }
    return localize(`${K}.Gain.${type === "tm" ? "Tm" : "Other"}`);
}

async function runTraining(actor) {
    const options = await askOptions(actor);
    if (!options) return;

    const difficulty = Number(actor.system.trainingDifficulty ?? DEFAULT_DIFFICULTY);
    const berry = options.berry ? BERRY_BONUS : 0;
    const hours = hoursBonus(options.hours);

    const roll = await new Roll("1d100 + @berry + @hours", { berry, hours }).evaluate();
    const success = roll.total >= difficulty;
    const newDifficulty = nextDifficulty(difficulty, success);

    await actor.update({ "system.trainingDifficulty": newDifficulty });
    const gain = success ? await applyGain(actor, options.type) : null;

    const lines = [
        localize(`${K}.Chosen`, { type: localize(`${K}.Types.${options.type}`) }),
        localize(`${K}.Difficulty`, { dc: difficulty }),
        berry ? localize(`${K}.BerryLine`, { bonus: berry }) : null,
        hours ? localize(`${K}.HoursLine`, { hours: options.hours, bonus: hours }) : null,
        `<b>${localize(success ? `${K}.Passed` : `${K}.Failed`)}</b>`,
        gain,
        localize(`${K}.NewDifficulty`, { from: difficulty, to: newDifficulty })
    ].filter(Boolean);

    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `<div class="header-bar"><p class="action">${localize(`${K}.Title`, { name: actor.name })}</p></div>`
            + lines.map((l) => `<p style="margin:2px 0;">${l}</p>`).join("")
    });
}

export { TRAINING_TYPES, BERRY_BONUS, hoursBonus, nextDifficulty, nextLevelExp, runTraining };
