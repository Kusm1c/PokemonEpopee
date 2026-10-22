/**
 * The Epopee GM dialogs, as real modules.
 *
 * These used to live as JavaScript source inside template literals inside a macro
 * definition file — two levels of escaping, which a single find/replace pass across the
 * repo silently corrupted. Written as functions the macros simply call, that failure
 * mode cannot happen: there is no JS-inside-a-string anywhere.
 *
 * Each macro's command is now one line, e.g. `game.pe.epopee.environment()`.
 */

import {
    WEATHER_DEFINITIONS, FIELD_DEFINITIONS, ZONE_DEFINITIONS,
    HAZARD_DEFINITIONS, WALL_DEFINITIONS
} from "../environment/definitions.js";
import { startWeather, startField, clearWeather, clearField, toggleZone } from "../environment/engine.js";
import { placeHazard } from "../environment/hazards.js";
import { placeWall } from "../environment/walls.js";
import { advanceProgression } from "../travel/engine.js";
import { openNavigationRoll } from "../travel/navigation.js";
import { openJourney } from "../travel/journey.js";
import { purgeOnRecall } from "../statuses/engine.js";
import { localize } from "../i18n.js";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

/** `<option>` list of definition slugs, shown by name. */
const opts = (definitions, selected) => Object.entries(definitions)
    .map(([k, d]) => `<option value="${k}"${k === selected ? " selected" : ""}>${d.label ?? k}</option>`)
    .join("");

const field = (label, inner) => `<div class="form-group"><label>${label}</label>${inner}</div>`;

/** The token a placement dialog should anchor on: targeted first, then selected. */
function anchorToken() {
    return [...game.user.targets][0]?.document ?? canvas.tokens.controlled[0]?.document ?? null;
}

async function prompt({ title, content, label, width = 420 }, read) {
    return Dialog.prompt({
        title, content, label: label ?? localize("PTU.Epopee.Setup.Validate"),
        options: { width },
        callback: (html) => read(html)
    }).catch(() => null);
}

/* ------------------------------------------------------------------ */
/* Weather / Field / Zones                                             */
/* ------------------------------------------------------------------ */

async function environment() {
    if (!game.combat) return ui.notifications.warn(localize("PTU.Epopee.Notify.NoCombat"));

    const active = game.combat.flags.pe?.zones ?? {};
    const zoneRows = Object.keys(ZONE_DEFINITIONS).map(z =>
        `<div class="form-group"><label><input type="checkbox" class="pe-zone" value="${z}"`
        + `${z in active ? " checked" : ""}/> ${ZONE_DEFINITIONS[z].label}</label></div>`
    ).join("");

    const result = await prompt({
        title: localize("PTU.Epopee.Setup.Environment.Title"),
        content:
            field(localize("PTU.Epopee.Setup.Environment.Weather"), `<select id="pe-weather"><option value="">${localize("PTU.Epopee.Setup.NoneM")}</option>${opts(WEATHER_DEFINITIONS)}</select>`)
            + field(localize("PTU.Epopee.Setup.Environment.Field"), `<select id="pe-field"><option value="">${localize("PTU.Epopee.Setup.NoneM")}</option>${opts(FIELD_DEFINITIONS)}</select>`)
            + field(localize("PTU.Epopee.Setup.Extended"), `<input type="checkbox" id="pe-extended"/> <span style="font-size:11px;opacity:.7;">${localize("PTU.Epopee.Setup.Environment.ExtendedHint")}</span>`)
            + `<hr/><p>${localize("PTU.Epopee.Setup.Environment.Zones")}</p>${zoneRows}`,
        label: localize("PTU.Epopee.Setup.Apply")
    }, (html) => ({
        weather: html.find("#pe-weather").val(),
        fieldSlug: html.find("#pe-field").val(),
        extended: html.find("#pe-extended").is(":checked"),
        zones: html.find(".pe-zone:checked").map((i, e) => e.value).get()
    }));

    if (!result) return;

    if (result.weather) await startWeather(game.combat, result.weather, result.extended);
    else await clearWeather(game.combat);

    if (result.fieldSlug) await startField(game.combat, result.fieldSlug, result.extended);
    else await clearField(game.combat);

    // toggleZone flips state, so only act where the checkbox differs from what's active.
    for (const slug of Object.keys(ZONE_DEFINITIONS)) {
        const wanted = result.zones.includes(slug);
        if (wanted !== (slug in active)) await toggleZone(game.combat, slug);
    }
}

/* ------------------------------------------------------------------ */
/* Hazards & Walls                                                     */
/* ------------------------------------------------------------------ */

async function hazard() {
    const token = anchorToken();
    if (!token) return ui.notifications.warn(localize("PTU.Epopee.Setup.Hazard.NoToken"));

    const slug = await prompt({
        title: localize("PTU.Epopee.Setup.Hazard.Title"),
        content: field(localize("PTU.Epopee.Setup.Hazard.Label"), `<select id="pe-hazard">${opts(HAZARD_DEFINITIONS)}</select>`),
        label: localize("PTU.Epopee.Setup.Place")
    }, (html) => html.find("#pe-hazard").val());

    if (!slug) return;
    await placeHazard(token.x, token.y, slug);
}

async function wall() {
    const token = anchorToken();
    if (!token) return ui.notifications.warn(localize("PTU.Epopee.Setup.Wall.NoToken"));

    const result = await prompt({
        title: localize("PTU.Epopee.Setup.Wall.Title"),
        content:
            field(localize("PTU.Epopee.Setup.Wall.Label"), `<select id="pe-wall">${opts(WALL_DEFINITIONS)}</select>`)
            + field(localize("PTU.Epopee.Setup.Wall.Length"), `<input type="number" id="pe-wall-len" value="1" min="1"/>`)
            + field(localize("PTU.Epopee.Setup.Extended"), `<input type="checkbox" id="pe-wall-ext"/>`),
        label: localize("PTU.Epopee.Setup.Place")
    }, (html) => ({
        slug: html.find("#pe-wall").val(),
        length: Number(html.find("#pe-wall-len").val()) || 1,
        extended: html.find("#pe-wall-ext").is(":checked")
    }));

    if (!result) return;
    await placeWall(token.x, token.y, result.slug, result.length, result.extended);
}

/* ------------------------------------------------------------------ */
/* Hex travel                                                          */
/* ------------------------------------------------------------------ */

async function travel() {
    const state = game.user.getFlag("pe", "travelState") ?? { progressionKm: 0, thresholdKm: 6 };
    const tables = game.tables.contents;
    const tableOpts = `<option value="">${localize("PTU.Epopee.Setup.NoneF")}</option>`
        + tables.map(t => `<option value="${t.id}">${t.name}</option>`).join("");

    const result = await prompt({
        title: localize("PTU.Epopee.Setup.Quarter.Title"),
        width: 460,
        content:
            `<p>${localize("PTU.Epopee.Setup.Quarter.Progress", { done: state.progressionKm, threshold: state.thresholdKm })}</p>`
            + field(localize("PTU.Epopee.Setup.Quarter.Threshold"),
                `<select id="pe-th">
                    <option value="6"${state.thresholdKm === 6 ? " selected" : ""}>${localize("PTU.Epopee.Setup.Quarter.ThresholdNear")}</option>
                    <option value="12"${state.thresholdKm === 12 ? " selected" : ""}>${localize("PTU.Epopee.Setup.Quarter.ThresholdFar")}</option>
                 </select>`)
            + field(localize("PTU.Epopee.Setup.Quarter.Speed"), `<input type="number" id="pe-speed" value="3" min="0" step="0.5"/>`)
            + field(localize("PTU.Epopee.Setup.Quarter.Multiplier"), `<input type="number" id="pe-mult" value="1" min="0" step="0.1"/>`)
            + `<hr/>`
            + field(localize("PTU.Epopee.Setup.Quarter.TracksTable"), `<select id="pe-t-tracks">${tableOpts}</select>`)
            + field(localize("PTU.Epopee.Setup.Quarter.LairTable"), `<select id="pe-t-lair">${tableOpts}</select>`)
            + field(localize("PTU.Epopee.Setup.Quarter.WanderTable"), `<select id="pe-t-wander">${tableOpts}</select>`),
        label: localize("PTU.Epopee.Setup.Quarter.Advance")
    }, (html) => ({
        thresholdKm: Number(html.find("#pe-th").val()),
        speed: Number(html.find("#pe-speed").val()) || 0,
        mult: Number(html.find("#pe-mult").val()) || 1,
        tracks: html.find("#pe-t-tracks").val(),
        lair: html.find("#pe-t-lair").val(),
        wander: html.find("#pe-t-wander").val()
    }));

    if (!result) return;

    const kmThisQuarter = result.speed * 4 * result.mult;
    const next = advanceProgression({
        current: state.progressionKm,
        thresholdKm: result.thresholdKm,
        kmThisQuarter
    });

    await game.user.setFlag("pe", "travelState", {
        progressionKm: next.progressionKm ?? next.overflowKm ?? 0,
        thresholdKm: result.thresholdKm
    });

    const half = await new Roll("1d8").evaluate();
    const lines = [
        `<p>${localize("PTU.Epopee.Setup.Quarter.Covered", { km: kmThisQuarter })}</p>`,
        `<p>${localize("PTU.Epopee.Setup.Quarter.HalfHour", { n: half.total })}</p>`,
        next.exited
            ? `<p>${localize("PTU.Epopee.Setup.Quarter.Exited", { km: next.overflowKm ?? 0 })}</p>`
            : `<p>${localize("PTU.Epopee.Setup.Quarter.ProgressPlain", { done: next.progressionKm, threshold: result.thresholdKm })}</p>`
    ];

    // The doc fixes the order: tracks, then lair, then wandering.
    for (const [label, id] of [[localize("PTU.Epopee.Setup.Quarter.Tracks"), result.tracks], [localize("PTU.Epopee.Setup.Quarter.Lair"), result.lair], [localize("PTU.Epopee.Setup.Quarter.Wander"), result.wander]]) {
        if (!id) continue;
        const table = game.tables.get(id);
        if (!table) continue;
        const draw = await table.draw({ displayChat: false });
        const text = draw.results.map(r => r.text ?? r.name ?? "?").join(", ");
        lines.push(`<p>${localize("PTU.Epopee.Setup.Quarter.Draw", { label, text })}</p>`);
    }

    await ChatMessage.create({
        flavor: `<div class="header-bar"><p class="action">${localize("PTU.Epopee.Setup.Quarter.Card")}</p></div>`,
        content: lines.join("")
    });
}

/* ------------------------------------------------------------------ */
/* Recall / narrative blocks / shared inventory                        */
/* ------------------------------------------------------------------ */

async function recall() {
    const actors = game.user.targets.size
        ? [...game.user.targets].map(t => t.actor)
        : canvas.tokens.controlled.map(t => t.actor);

    if (!actors.length) return ui.notifications.warn(localize("PTU.Epopee.Setup.Recall.NoToken"));

    for (const actor of actors) {
        if (!actor) continue;
        const purged = await purgeOnRecall(actor);
        ui.notifications.info(purged.length
            ? localize("PTU.Epopee.Setup.Recall.Purged", { name: actor.name, list: purged.join(", ") })
            : localize("PTU.Epopee.Setup.Recall.Nothing", { name: actor.name }));
    }
}

async function narrativeBlock() {
    if (!game.user.isGM) return ui.notifications.warn(localize("PTU.Epopee.Travel.GmOnly"));

    const title = await prompt({
        title: localize("PTU.Epopee.Setup.Block.Title"),
        content: field(localize("PTU.Epopee.Setup.Block.Field"), `<input type="text" id="pe-block-title" value=""/>`),
        label: localize("PTU.Epopee.Setup.Block.Confirm")
    }, (html) => html.find("#pe-block-title").val()?.trim());

    if (!title) return;

    const trainers = game.actors.filter(a => a.type === "character");
    if (!trainers.length) return ui.notifications.warn(localize("PTU.Epopee.Setup.Block.NoTrainers"));

    let touched = 0;
    for (const actor of trainers) {
        const blocks = [...(actor.system.epopee?.narrative?.customBlocks ?? [])];
        if (blocks.some(b => b.title === title)) continue;
        blocks.push({ title, body: "" });
        await actor.update({ "system.epopee.narrative.customBlocks": blocks });
        touched++;
    }

    ui.notifications.info(localize("PTU.Epopee.Setup.Block.Added", { title, n: touched }));
}

function sharedInventory() {
    new CONFIG.PTU.ui.sharedInventory.sheetClass().render(true);
}

/* ------------------------------------------------------------------ */
/* Travel: Navigator roll and journey planner                          */
/* ------------------------------------------------------------------ */

function navigation() {
    openNavigationRoll();
}

function journey() {
    openJourney();
}

export { environment, hazard, wall, travel, recall, narrativeBlock, sharedInventory, navigation, journey };
