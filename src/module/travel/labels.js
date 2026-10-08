/**
 * Display helpers shared by the travel macros and the reference journal: translated
 * names, multipliers written as the tables print them, and the party roster.
 */

import { localize } from "../i18n.js";
import { PARTY_FOLDER } from "./tables.js";

const terrainName = (terrain) => localize(`PTU.Epopee.Travel.Terrain.${terrain.id}`);
const pathName = (path) => localize(`PTU.Epopee.Travel.Path.${path}`);
const conditionName = (condition) => localize(`PTU.Epopee.Travel.Condition.${condition.id}`);
const modeName = (mode) => localize(`PTU.Epopee.Travel.Mode.${mode.id}`);

/** "3/4" -> "x3/4", as the tables write it. */
const multiplier = (text) => `x${text}`;

/** A number with at most one decimal, without a trailing ".0". */
const formatNumber = (value) => String(Math.round(Number(value) * 10) / 10);

/**
 * Trainers the macros offer: characters in the "00 PJs" Actor folder or any folder
 * nested inside it.
 *
 * @returns {{folderFound: boolean, actors: Actor[]}}
 */
function partyTrainers() {
    const roots = game.folders.filter((f) => f.type === "Actor" && f.name === PARTY_FOLDER);
    const folderIds = new Set();
    for (const root of roots) {
        folderIds.add(root.id);
        for (const sub of root.getSubfolders(true)) folderIds.add(sub.id);
    }
    const actors = game.actors
        .filter((a) => a.type === "character" && a.folder && folderIds.has(a.folder.id))
        .sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
    return { folderFound: roots.length > 0, actors };
}

/** Escape text going into chat HTML: actor names are free text. */
const escape = (text) => foundry.utils.escapeHTML(String(text ?? ""));

export { terrainName, pathName, conditionName, modeName, multiplier, formatNumber, partyTrainers, escape };
