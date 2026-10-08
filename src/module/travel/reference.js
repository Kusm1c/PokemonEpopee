/**
 * The in-game travel reference: a Journal with the terrain modifiers, the condition
 * modifiers and the base movement speeds.
 *
 * Generated from travel/tables.js, the same data the macros use, so the reference cannot
 * disagree with them. It resyncs on every GM load like the macros do, writing only a
 * page whose content changed. The Journal is found by its flag rather than its name, so
 * renaming it in the world does not create a second one.
 *
 * GM-only by default: it lists the Navigation DCs, which the players roll against blind.
 * A GM can share it from the Journal's permissions.
 */

import { localize } from "../i18n.js";
import { conditionName, escape, formatNumber, multiplier, pathName, terrainName } from "./labels.js";
import { BASE_SPEED_METRES, BASE_SPEED_ROWS, CONDITIONS, PATHS, TERRAINS } from "./tables.js";

const JOURNAL_FLAG = "travelReference";
const PAGE_FLAG = "travelReferencePage";
const K = "PTU.Epopee.Travel.Reference";

const table = (headers, rows) => `<table>
<thead><tr>${headers.map((h) => `<th>${escape(h)}</th>`).join("")}</tr></thead>
<tbody>
${rows.map((cells) => `<tr>${cells.map((c) => `<td>${escape(c)}</td>`).join("")}</tr>`).join("\n")}
</tbody>
</table>`;

function terrainPage() {
    return table(
        [localize(`${K}.Terrain`), ...PATHS.map(pathName), localize(`${K}.NavigationDC`), localize(`${K}.ForageDC`)],
        TERRAINS.map((t) => [terrainName(t), ...PATHS.map((p) => multiplier(t.speed[p])), t.navigationDC, t.forageDC])
    );
}

function conditionPage() {
    return table(
        [localize(`${K}.Condition`), localize(`${K}.Modifier`)],
        CONDITIONS.filter((c) => c.id !== "none").map((c) => [conditionName(c), multiplier(c.speed)])
    );
}

function baseSpeedPage() {
    return table(
        [localize(`${K}.OnFoot`), ...BASE_SPEED_METRES.map((m) => localize(`${K}.Metres`, { metres: m }))],
        BASE_SPEED_ROWS.map((row) => [localize(`${K}.Row.${row.id}`), ...row.km.map((km) => `${formatNumber(km)} km`)])
    );
}

function pages() {
    return [
        { id: "terrain", name: localize(`${K}.TerrainTitle`), content: terrainPage() },
        { id: "condition", name: localize(`${K}.ConditionTitle`), content: conditionPage() },
        { id: "baseSpeed", name: localize(`${K}.BaseSpeedTitle`), content: baseSpeedPage() }
    ];
}

/**
 * Create the reference, or bring its pages up to date.
 *
 * @param {string[]} log
 */
async function syncTravelReference(log) {
    const wanted = pages();
    const journal = game.journal.find((j) => j.getFlag("pe", JOURNAL_FLAG));

    if (!journal) {
        await JournalEntry.create({
            name: localize(`${K}.Title`),
            flags: { pe: { [JOURNAL_FLAG]: true } },
            pages: wanted.map((p, i) => ({
                name: p.name,
                type: "text",
                sort: (i + 1) * 100000,
                text: { content: p.content, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML },
                flags: { pe: { [PAGE_FLAG]: p.id } }
            }))
        });
        log.push("Référence de voyage créée.");
        return;
    }

    const updates = [];
    const creates = [];
    wanted.forEach((p, i) => {
        const page = journal.pages.find((pg) => pg.getFlag("pe", PAGE_FLAG) === p.id);
        if (!page) {
            creates.push({
                name: p.name, type: "text", sort: (i + 1) * 100000,
                text: { content: p.content, format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML },
                flags: { pe: { [PAGE_FLAG]: p.id } }
            });
        } else if (page.text?.content !== p.content || page.name !== p.name) {
            updates.push({ _id: page.id, name: p.name, "text.content": p.content });
        }
    });

    if (creates.length) await journal.createEmbeddedDocuments("JournalEntryPage", creates);
    if (updates.length) await journal.updateEmbeddedDocuments("JournalEntryPage", updates);
    if (creates.length || updates.length) log.push("Référence de voyage mise à jour.");
}

export { syncTravelReference };
